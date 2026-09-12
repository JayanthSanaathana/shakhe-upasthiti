const path = require('path');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const JSZip = require('jszip');
const Shakhe = require('../models/Shakhe');
const ShakheUpasthiti = require('../models/ShakheUpasthiti');
const report = require('./shakheVaradiReport');
const { shakheVisibleInDays, filterEntriesByShakheVisibility, intervalsByShakheId } = require('./reportVisibility');

const NEXT_LEVEL = { prant: 'vibhag', vibhag: 'bhag', bhag: 'nagara' };
const CHILD_KEY = { prant: 'vibhag', vibhag: 'bhag', bhag: 'nagar', nagara: 'vasati' };
const LEVEL_LABEL = {
  prant: 'ಪ್ರಾಂತ/Prant',
  vibhag: 'ವಿಭಾಗ/Vibhag',
  bhag: 'ಜಿಲ್ಲಾ/ಭಾಗ/Bhag',
  nagara: 'ತಾಲ್ಲೂಕು/ನಗರ/Nagara',
  vasati: 'ವಸತಿ/ಮಂಡಲ/Vasati',
};
const LEVEL_EN = { prant: 'Prant', vibhag: 'Vibhag', bhag: 'Bhag', nagara: 'Nagara', vasati: 'Vasati' };
const KANNADA_FONT = path.join(__dirname, '..', 'public', 'fonts', 'NotoSansKannada-VF.ttf');
const BOUDHIK_LABELS = {
  geethe: 'ಗೀತೆ/Geethe', amruthavacha: 'ಅಮೃತವಚನ/Amruthavacha', shloka: 'ಶ್ಲೋಕ/Shloka',
  panchaga: 'ಪಂಚಾಂಗ/Panchanga', sannaKathe: 'ಸಣ್ಣ ಕಥೆ/Sanna Kathe', deerghaKathe: 'ದೀರ್ಘ ಕಥೆ/Deergha Kathe',
  boudhik: 'ಬೌದ್ಧಿಕ/Boudhik', charche: 'ಚರ್ಚೆ/Charche', samacharaSamekhe: 'ಸಮಾಚಾರ ಸಮೀಕ್ಷೆ/News Review',
  prathanaAbhyasa: 'ಪ್ರಾರ್ಥನಾ ಅಭ್ಯಾಸ/Prarthana Practice', itara: 'ಇತರೆ/Other',
};
const BOUDHIK_IDS = Object.keys(BOUDHIK_LABELS);
const SHARIRIK_LABELS = {
  suryanamaskar: 'ಸೂರ್ಯನಮಸ್ಕಾರ/Suryanamaskar', samata: 'ಸಮತಾ/Samata', sanchalana: 'ಸಂಚಲನ/Sanchalana',
  danda: 'ದಂಡ/Danda', niyuddha: 'ನಿಯುದ್ಧ/Niyuddha', yeshti: 'ಯಷ್ಟಿ/Yeshti', dandaYuddha: 'ದಂಡ ಯುದ್ಧ/Danda Yuddha',
  padavinyas: 'ಪದವಿನ್ಯಾಸ/Padavinyas', itara: 'ಇತರೆ/Other',
};
const SHARIRIK_IDS = Object.keys(SHARIRIK_LABELS);

function safeName(value) {
  return String(value || 'Report').replace(/[\\/*?:\[\]]/g, ' ').replace(/\s+/g, ' ').trim() || 'Report';
}

function makeSheetNamer() {
  const used = new Set();
  return (prefix, name) => {
    const base = safeName(`${prefix} ${name}`).slice(0, 31);
    let candidate = base;
    let n = 2;
    while (used.has(candidate.toLowerCase())) {
      const suffix = ` ${n++}`;
      candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  };
}

function childOf(row, level) {
  return row && row[CHILD_KEY[level]];
}

function scopeEntity(data, level) {
  const key = level === 'nagara' ? 'nagar' : level;
  return data && data[key];
}

async function loadScope(level, entityId, options) {
  if (options.kind === 'shakhe') {
    return level === 'nagara'
      ? report.reportForNagara(entityId, options.from, options.to, options.excludeSunday)
      : report.reportForParentLevel(level, entityId, options.from, options.to, options.excludeSunday);
  }
  return level === 'nagara'
    ? report.reportProgramForNagara(entityId, options.kind, options.from, options.to, options.excludeSunday, options.itemDayCount)
    : report.reportProgramForParentLevel(level, entityId, options.kind, options.from, options.to, options.excludeSunday, options.itemDayCount);
}

async function collectHierarchy(level, entityId, options, parentKey, out) {
  const data = await loadScope(level, entityId, options);
  if (data.error) throw new Error(data.error);
  const entity = scopeEntity(data, level) || { id: entityId, name: level };
  const key = `${level}:${entityId}`;
  out.scopes.push({ key, level, entity, data, parentKey });
  const next = NEXT_LEVEL[level];
  if (!next) return;
  for (const row of data.rows || []) {
    const child = childOf(row, level);
    if (child && child.id) await collectHierarchy(next, child.id, options, key, out);
  }
}

function rangeDays(from, to, excludeSunday) {
  const parsed = report.parseDateRange(from, to, excludeSunday);
  return parsed.days || [];
}

async function collectShakhes(nagarIds, options) {
  const shakhes = nagarIds.length
    ? await Shakhe.find({ 'nagar.entity': { $in: nagarIds } }).sort({ name: 1 }).lean()
    : [];
  const days = rangeDays(options.from, options.to, options.excludeSunday);
  const visibleShakhes = shakhes.filter((s) => shakheVisibleInDays(s.reportHideIntervals || [], days));
  const entriesRaw = visibleShakhes.length ? await ShakheUpasthiti.find({
    shakhe: { $in: visibleShakhes.map((s) => s._id) }, date: { $gte: options.from, $lte: options.to },
  }).sort({ date: 1 }).lean() : [];
  const entries = filterEntriesByShakheVisibility(entriesRaw, intervalsByShakheId(visibleShakhes))
    .filter((e) => !options.excludeSunday || new Date(`${e.date}T12:00:00Z`).getUTCDay() !== 0);
  const byShakhe = new Map();
  for (const entry of entries) {
    const id = String(entry.shakhe);
    if (!byShakhe.has(id)) byShakhe.set(id, []);
    byShakhe.get(id).push(entry);
  }
  return { shakhes: visibleShakhes, byShakhe, days };
}

function styleHeader(row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  row.alignment = { vertical: 'middle', wrapText: true };
}

function finishSheet(ws) {
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = ws.rowCount > 1 ? { from: 'A1', to: ws.getCell(1, ws.columnCount).address } : undefined;
  ws.eachRow((row) => row.eachCell((cell) => {
    cell.alignment = { ...(cell.alignment || {}), vertical: 'top', wrapText: true };
    cell.border = { bottom: { style: 'hair', color: { argb: 'FFD9E2F3' } } };
  }));
  ws.columns.forEach((col, i) => { col.width = i === 0 ? 25 : 16; });
  if (ws.rowCount) styleHeader(ws.getRow(1));
}

function linkCell(cell, value, sheet, address = 'A1') {
  if (!sheet) { cell.value = value == null ? '' : value; return; }
  const target = String(sheet).replace(/'/g, "''");
  // Keep the destination separately because summary values are later replaced
  // by formulas. writeWorkbook adds native OOXML links to those formula cells.
  cell._reportInternalLocation = `'${target}'!${address}`;
  if (value == null || value === '') { cell.value = value == null ? '' : value; return; }
  const shown = String(value);
  // Tooltip is also used by writeWorkbook to populate OOXML's explicit
  // `display` label, which Google Sheets needs when importing internal links.
  cell.value = { text: shown, hyperlink: `#'${target}'!${address}`, tooltip: shown };
  cell.font = { color: { argb: 'FF0563C1' }, underline: true };
}

/**
 * ExcelJS writes internal links as external relationships with an extra leading
 * '#'. Excel and Google Sheets then treat them as links to the whole file.
 * Rewrite them to native OOXML `location` hyperlinks before download.
 */
async function writeWorkbook(workbook) {
  const formulaLinksBySheet = new Map();
  workbook.worksheets.forEach((worksheet, index) => {
    const links = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      for (let column = 1; column <= worksheet.columnCount; column += 1) {
        const cell = row.getCell(column);
        if (cell._reportInternalLocation) {
          links.push({ ref: cell.address, location: cell._reportInternalLocation });
        }
      }
    });
    formulaLinksBySheet.set(`xl/worksheets/sheet${index + 1}.xml`, links);
  });
  const original = await workbook.xlsx.writeBuffer();
  const zip = await JSZip.loadAsync(original);
  const workbookFile = zip.file('xl/workbook.xml');
  if (workbookFile) {
    const workbookXml = await workbookFile.async('string');
    const recalculating = workbookXml.replace(/<calcPr\b([^>]*)\/>/, (tag, attrs) => {
      let next = attrs
        .replace(/\sfullCalcOnLoad="[^"]*"/g, '')
        .replace(/\sforceFullCalc="[^"]*"/g, '')
        .replace(/\scalcMode="[^"]*"/g, '');
      next += ' fullCalcOnLoad="1" forceFullCalc="1" calcMode="auto"';
      return `<calcPr${next}/>`;
    });
    zip.file('xl/workbook.xml', recalculating);
  }
  const sheetPaths = Object.keys(zip.files).filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  for (const sheetPath of sheetPaths) {
    const file = zip.file(sheetPath);
    if (!file) continue;
    const xml = await file.async('string');
    let fixed = xml.replace(/<hyperlink\b[^>]*\/>/g, (tag) => {
      if (!/location="#/.test(tag)) return tag;
      const tooltip = tag.match(/\stooltip="([^"]*)"/);
      let nativeTag = tag.replace(/\s+r:id="[^"]+"/, '').replace('location="#', 'location="');
      if (tooltip && !/\sdisplay=/.test(nativeTag)) {
        nativeTag = nativeTag.replace('/>', ` display="${tooltip[1]}"/>`);
      }
      return nativeTag;
    });
    const extraLinks = formulaLinksBySheet.get(sheetPath) || [];
    if (extraLinks.length) {
      const existingRefs = new Set([...fixed.matchAll(/<hyperlink\b[^>]*\sref="([^"]+)"[^>]*\/>/g)].map((match) => match[1]));
      const escapeAttribute = (value) => String(value)
        .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;');
      const additions = extraLinks
        .filter((link) => !existingRefs.has(link.ref))
        .map((link) => `<hyperlink ref="${escapeAttribute(link.ref)}" location="${escapeAttribute(link.location)}"/>`)
        .join('');
      if (additions) {
        if (/<hyperlinks>/.test(fixed)) fixed = fixed.replace('</hyperlinks>', `${additions}</hyperlinks>`);
        else fixed = fixed.replace('<pageMargins', `<hyperlinks>${additions}</hyperlinks><pageMargins`);
      }
    }
    if (fixed !== xml) zip.file(sheetPath, fixed);

    const relPath = sheetPath.replace('xl/worksheets/', 'xl/worksheets/_rels/') + '.rels';
    const relFile = zip.file(relPath);
    if (!relFile) continue;
    const relXml = await relFile.async('string');
    const fixedRels = relXml.replace(
      /<Relationship\b(?=[^>]*Type="[^"]*\/hyperlink")[^>]*\/>/g,
      ''
    );
    zip.file(relPath, fixedRels);
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

function standardColumns(dayCount) {
  const days = Array.from({ length: dayCount + 1 }, (_, i) => `${i} days ran`);
  return [LEVEL_LABEL.vasati, 'Yojita Shakhe', 'Running Shakhe', ...days, 'Not running', 'Avg Taruna', 'Avg Balaka', 'Avg Total', 'Avg Shishu', 'Avg Mata Bhagini', 'Contacted homes', 'Contacted people'];
}

function standardValues(row, dayCount) {
  const a = row.averages || {}; const s = row.ottuSamparka || {}; const buckets = row.daysRanBuckets || [];
  return [childOf(row, row._level)?.name || '', row.yojitaShakheCount || 0, row.nadayuthiruvaShakheCount || 0,
    ...Array.from({ length: dayCount + 1 }, (_, i) => buckets[i] || 0), row.nadayadaShakheCount || 0,
    a.taruna ?? '', a.balaka ?? '', a.total ?? '', a.shishu ?? '', a.mataBhagi ?? '', s.manegalu ?? '', s.vyaktigalu ?? ''];
}

function standardTotalValues(total, dayCount) {
  const a = total.averages || {}; const s = total.ottuSamparka || {}; const buckets = total.daysRanBuckets || [];
  return ['Total', total.yojitaShakheCount || 0, total.nadayuthiruvaShakheCount || 0,
    ...Array.from({ length: dayCount + 1 }, (_, i) => buckets[i] || 0), total.nadayadaShakheCount || 0,
    a.taruna ?? '', a.balaka ?? '', a.total ?? '', a.shishu ?? '', a.mataBhagi ?? '', s.manegalu ?? '', s.vyaktigalu ?? ''];
}

function programColumns(data) {
  return [LEVEL_LABEL.vasati, 'Yojita Shakhe', 'Running Shakhe', 'Not running', ...(data.catalog || []).map((i) => `${i.kn}/${i.en}`)];
}

function programValues(row, data) {
  return [childOf(row, row._level)?.name || '', row.yojitaShakheCount || 0, row.nadayuthiruvaShakheCount || 0,
    row.nadayadaShakheCount || 0, ...(data.catalog || []).map((i) => (row.itemCounts || {})[i.id] || 0)];
}

function programTotalValues(total, data) {
  return ['Total', total.yojitaShakheCount || 0, total.nadayuthiruvaShakheCount || 0,
    total.nadayadaShakheCount || 0, ...(data.catalog || []).map((i) => (total.itemCounts || {})[i.id] || 0)];
}

function personLabel(person) {
  if (!person) return '';
  return [person.name, person.phone].filter(Boolean).join(' - ');
}

function boudhikDailyHeaders() {
  return BOUDHIK_IDS.flatMap((id) => {
    const columns = [`Boudhik - ${BOUDHIK_LABELS[id]}`];
    if (id === 'sannaKathe') columns.push('Sanna Kathe text');
    else if (id === 'deerghaKathe') columns.push('Deergha Kathe text');
    else if (id === 'boudhik') columns.push('Boudhik speaker');
    else if (id === 'charche') columns.push('Charche speaker');
    else if (id === 'itara') columns.push('Boudhik other details');
    return columns;
  });
}

function boudhikDailyValues(entry) {
  return BOUDHIK_IDS.flatMap((id) => {
    const selected = Boolean(entry && Array.isArray(entry.boudhik) && entry.boudhik.includes(id));
    const values = [selected ? 'Yes' : 'No'];
    if (id === 'sannaKathe') values.push(entry && entry.sannaKatheText || '');
    else if (id === 'deerghaKathe') values.push(entry && entry.deerghaKatheText || '');
    else if (id === 'boudhik') values.push(entry ? personLabel(entry.boudhikPerson) : '');
    else if (id === 'charche') values.push(entry ? personLabel(entry.charchePerson) : '');
    else if (id === 'itara') values.push(entry && entry.boudhikItara || '');
    return values;
  });
}

function excelColumn(number) {
  let n = number;
  let out = '';
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}

function quotedSheet(name) {
  return `'${String(name).replace(/'/g, "''")}'`;
}

function formulaCell(cell, formula, result) {
  cell.value = { formula, result: result == null ? '' : result };
}

function selectPdfFont(doc, value) {
  doc.font(/[\u0C80-\u0CFF]/.test(String(value || '')) ? 'Kannada' : 'Helvetica');
  return doc;
}

function pdfDisplayText(value) {
  const text = String(value == null ? '' : value);
  if (!/[\u0C80-\u0CFF]/.test(text)) return text;
  return text.replace(/[A-Za-z]+(?:[\s-]+[A-Za-z]+)*/g, '').replace(/[\s/|-]+$/g, '').trim();
}

function paintPdfPage(doc) {
  doc.save().rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF').restore();
  doc.fillColor('#111111');
}

function addBackLink(ws, parentSheet) {
  if (!parentSheet) return;
  const row = ws.addRow([]);
  linkCell(row.getCell(1), '← Back to parent report', parentSheet);
}

function cachedCellValue(cell) {
  const value = cell.value;
  if (value && typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, 'result')) return value.result;
    if (Object.prototype.hasOwnProperty.call(value, 'text')) return value.text;
  }
  return value == null ? '' : value;
}

function replaceWithFormula(cell, formula) {
  const result = cachedCellValue(cell);
  formulaCell(cell, formula, result);
  cell.font = { ...(cell.font || {}), color: { argb: 'FF111111' }, underline: false };
}

function dailyRange(meta, column) {
  const col = excelColumn(column);
  return `${quotedSheet(meta.sheetName)}!$${col}$2:$${col}$${meta.lastDataRow}`;
}

function applyNagaraFormulas(scope, ws, meta, options) {
  if (!meta || !meta.calendarDayCount) return;
  const data = scope.data;
  const divisor = meta.calendarDayCount;
  const groupRange = dailyRange(meta, 2);
  const ranRange = dailyRange(meta, 8);
  const includedRange = dailyRange(meta, meta.includedCol);
  const visibleDaysRange = dailyRange(meta, meta.visibleDaysCol);
  const daysRanRange = dailyRange(meta, meta.daysRanCol);
  const countFormula = (helperRange, row, criterion, total) => {
    const groupArgs = total ? '' : `${groupRange},$A${row},`;
    return `IFERROR(COUNTIFS(${groupArgs}${helperRange},${criterion})/${divisor},0)`;
  };
  const sumFormula = (metricCol, row, total) => {
    const metricRange = dailyRange(meta, metricCol);
    const groupArgs = total ? '' : `${groupRange},$A${row},`;
    return `SUMIFS(${metricRange},${groupArgs}${includedRange},"Yes",${ranRange},"Yes")`;
  };
  const avgFormula = (metricCol, row, total) => {
    const groupArgs = total ? '' : `${groupRange},$A${row},`;
    const count = `COUNTIFS(${groupArgs}${includedRange},"Yes",${ranRange},"Yes")`;
    return `IFERROR(ROUNDUP(${sumFormula(metricCol, row, total)}/${count},0),"")`;
  };
  const rows = data.rows || [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = i + 2;
    replaceWithFormula(ws.getCell(row, 2), countFormula(visibleDaysRange, row, '">0"', false));
    replaceWithFormula(ws.getCell(row, 3), countFormula(daysRanRange, row, '">0"', false));
    if (options.kind === 'shakhe') {
      const dayCount = meta.calendarDayCount;
      for (let days = 0; days <= dayCount; days += 1) {
        replaceWithFormula(ws.getCell(row, 4 + days), countFormula(daysRanRange, row, days, false));
      }
      const notRunningCol = 5 + dayCount;
      replaceWithFormula(ws.getCell(row, notRunningCol), `B${row}-C${row}`);
      const averageStart = 6 + dayCount;
      [9, 10, 11, 12, 13].forEach((dailyCol, offset) => {
        replaceWithFormula(ws.getCell(row, averageStart + offset), avgFormula(dailyCol, row, false));
      });
      replaceWithFormula(ws.getCell(row, averageStart + 5), sumFormula(14, row, false));
      replaceWithFormula(ws.getCell(row, averageStart + 6), sumFormula(15, row, false));
    } else {
      replaceWithFormula(ws.getCell(row, 4), `B${row}-C${row}`);
      (data.catalog || []).forEach((item, offset) => {
        const helperRange = dailyRange(meta, meta.itemCountCols.get(`${options.kind}:${item.id}`));
        const criterion = `IF(${quotedSheet(meta.filtersName)}!$B$8="Happened",">0",${quotedSheet(meta.filtersName)}!$B$8)`;
        replaceWithFormula(ws.getCell(row, 5 + offset), countFormula(helperRange, row, criterion, false));
      });
    }
  }

  if (!data.totals) return;
  const totalRow = rows.length + 2;
  replaceWithFormula(ws.getCell(totalRow, 2), countFormula(visibleDaysRange, totalRow, '">0"', true));
  replaceWithFormula(ws.getCell(totalRow, 3), countFormula(daysRanRange, totalRow, '">0"', true));
  if (options.kind === 'shakhe') {
    const dayCount = meta.calendarDayCount;
    for (let days = 0; days <= dayCount; days += 1) {
      replaceWithFormula(ws.getCell(totalRow, 4 + days), countFormula(daysRanRange, totalRow, days, true));
    }
    const notRunningCol = 5 + dayCount;
    replaceWithFormula(ws.getCell(totalRow, notRunningCol), `B${totalRow}-C${totalRow}`);
    const averageStart = 6 + dayCount;
    [9, 10, 11, 12, 13].forEach((dailyCol, offset) => {
      replaceWithFormula(ws.getCell(totalRow, averageStart + offset), avgFormula(dailyCol, totalRow, true));
    });
    replaceWithFormula(ws.getCell(totalRow, averageStart + 5), sumFormula(14, totalRow, true));
    replaceWithFormula(ws.getCell(totalRow, averageStart + 6), sumFormula(15, totalRow, true));
  } else {
    replaceWithFormula(ws.getCell(totalRow, 4), `B${totalRow}-C${totalRow}`);
    (data.catalog || []).forEach((item, offset) => {
      const helperRange = dailyRange(meta, meta.itemCountCols.get(`${options.kind}:${item.id}`));
      const criterion = `IF(${quotedSheet(meta.filtersName)}!$B$8="Happened",">0",${quotedSheet(meta.filtersName)}!$B$8)`;
      replaceWithFormula(ws.getCell(totalRow, 5 + offset), countFormula(helperRange, totalRow, criterion, true));
    });
  }
}

function applyParentFormulas(scope, ws, sheetByKey, scopesByKey, options, filtersName, calendarDayCount) {
  const data = scope.data;
  const rows = data.rows || [];
  for (let i = 0; i < rows.length; i += 1) {
    const rowNumber = i + 2;
    const child = childOf(rows[i], scope.level);
    const childKey = child && `${NEXT_LEVEL[scope.level]}:${child.id}`;
    const childScope = scopesByKey.get(childKey);
    const childSheet = sheetByKey.get(childKey);
    if (!childScope || !childSheet) continue;
    const childTotalRow = (childScope.data.rows || []).length + 2;
    for (let column = 2; column <= ws.columnCount; column += 1) {
      let formula = `${quotedSheet(childSheet)}!${excelColumn(column)}${childTotalRow}`;
      if (options.kind === 'shakhe' && scope.level === 'vibhag') {
        const dayCount = calendarDayCount || 0;
        const averageStart = 6 + dayCount;
        if (column >= averageStart && column <= averageStart + 4) {
          formula = `IFERROR(${formula}/${quotedSheet(filtersName)}!$B$6,"")`;
        }
      }
      replaceWithFormula(ws.getCell(rowNumber, column), formula);
    }
  }
  if (!data.totals || !rows.length) return;
  const totalRow = rows.length + 2;
  for (let column = 2; column <= ws.columnCount; column += 1) {
    const letter = excelColumn(column);
    replaceWithFormula(ws.getCell(totalRow, column), `SUM(${letter}2:${letter}${rows.length + 1})`);
  }
}

async function buildWorkbook(rootLevel, rootId, options) {
  const tree = { scopes: [] };
  await collectHierarchy(rootLevel, rootId, options, null, tree);
  const nagarIds = tree.scopes.filter((s) => s.level === 'nagara').map((s) => s.entity.id);
  // Always retain every calendar day in the raw Nagara sheets. The workbook's
  // Exclude Sunday control decides which rows feed the summary formulas.
  const detail = await collectShakhes(nagarIds, { ...options, excludeSunday: false });
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Shakhe Upasthiti';
  wb.created = new Date();
  wb.calcProperties.fullCalcOnLoad = true;
  wb.calcProperties.forceFullCalc = true;
  wb.calcProperties.calcMode = 'auto';
  const nameSheet = makeSheetNamer();
  const filtersName = nameSheet('', 'Filters');
  const filters = wb.addWorksheet(filtersName);
  const calendarDayCount = detail.days.length;
  const nonSundayDayCount = rangeDays(options.from, options.to, true).length;
  filters.addRows([
    ['Filter', 'Value'], ['Report', options.kind === 'shakhe' ? 'Shakhe Varadi' : `${options.kind} Varadi`],
    ['Scope', `${LEVEL_LABEL[rootLevel]} - ${tree.scopes[0] && tree.scopes[0].entity.name || ''}`],
    ['From', options.from], ['To', options.to], ['Days selected', rangeDays(options.from, options.to, options.excludeSunday).length],
    ['Exclude Sunday Sanghik', options.excludeSunday ? 'Yes' : 'No'], ['Program days filter', options.itemDayCount || 'Happened'],
    ['Generated at', new Date().toISOString()],
  ]);
  filters.getCell('B7').dataValidation = { type: 'list', allowBlank: false, formulae: ['"Yes,No"'] };
  filters.getCell('B8').dataValidation = {
    type: 'list',
    allowBlank: false,
    formulae: [`"Happened,${Array.from({ length: calendarDayCount }, (_, i) => i + 1).join(',')}"`],
  };
  formulaCell(
    filters.getCell('B6'),
    `IF(B7="Yes",${nonSundayDayCount},${calendarDayCount})`,
    options.excludeSunday ? nonSundayDayCount : calendarDayCount
  );
  filters.addRow(['How to refresh', 'Change the yellow B7/B8 filter cells; Excel or Google Sheets will recalculate this workbook.']);
  for (const address of ['B7', 'B8']) {
    filters.getCell(address).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
    filters.getCell(address).font = { bold: true, color: { argb: 'FF7F6000' } };
  }

  const sheetByKey = new Map();
  for (const scope of tree.scopes) {
    const sheetName = nameSheet(scope.level.slice(0, 3).toUpperCase(), scope.entity.name);
    sheetByKey.set(scope.key, sheetName);
    scope.sheetName = sheetName;
  }
  const openRow = filters.addRow([]);
  linkCell(openRow.getCell(1), 'Open report →', sheetByKey.get(`${rootLevel}:${rootId}`));
  finishSheet(filters);
  const nagaraDetailSheetById = new Map();
  const nagaraDailyMeta = new Map();
  for (const scope of tree.scopes.filter((item) => item.level === 'nagara')) {
    nagaraDetailSheetById.set(String(scope.entity.id), nameSheet('Daily', scope.entity.name));
  }

  for (const scope of tree.scopes) {
    const ws = wb.addWorksheet(scope.sheetName);
    const data = scope.data;
    const headers = options.kind === 'shakhe' ? standardColumns(calendarDayCount) : programColumns(data);
    headers[0] = LEVEL_LABEL[NEXT_LEVEL[scope.level] || 'vasati'];
    ws.addRow(headers);
    for (const original of data.rows || []) {
      const row = { ...original, _level: scope.level };
      const child = childOf(row, scope.level);
      const targetKey = NEXT_LEVEL[scope.level] && child ? `${NEXT_LEVEL[scope.level]}:${child.id}` : null;
      const target = targetKey
        ? sheetByKey.get(targetKey)
        : scope.level === 'nagara'
          ? nagaraDetailSheetById.get(String(scope.entity.id))
          : null;
      const values = options.kind === 'shakhe' ? standardValues(row, calendarDayCount) : programValues(row, data);
      const excelRow = ws.addRow([]);
      values.forEach((value, i) => linkCell(excelRow.getCell(i + 1), value, target));
    }
    if (data.totals) {
      const values = options.kind === 'shakhe'
        ? standardTotalValues(data.totals, calendarDayCount)
        : programTotalValues(data.totals, data);
      const totalRow = ws.addRow([]);
      values.forEach((value, i) => linkCell(totalRow.getCell(i + 1), value, filtersName));
      totalRow.font = { bold: true };
    }
    const parentSheet = scope.parentKey ? sheetByKey.get(scope.parentKey) : filtersName;
    addBackLink(ws, parentSheet);
    finishSheet(ws);
    if (options.kind === 'shakhe') {
      // 0..N "days ran" buckets begin at column D. Keep them available but
      // hidden by default; Excel/Google Sheets users can unhide when needed.
      for (let column = 4; column <= 4 + calendarDayCount; column += 1) {
        ws.getColumn(column).hidden = true;
      }
    }
  }

  for (const [nagarId, sheetName] of nagaraDetailSheetById) {
    const ws = wb.addWorksheet(sheetName);
    const dailyHeaders = ['Nagara', 'Vasati', 'Upavasati', 'Shakhe', 'Time', 'Type', 'Date', 'Ran', 'Taruna', 'Balaka', 'Total', 'Shishu', 'Mata Bhagini', 'Contacted homes', 'Contacted people',
      ...boudhikDailyHeaders(),
      ...SHARIRIK_IDS.map((id) => `Sharirik - ${SHARIRIK_LABELS[id]}`), 'Sharirik other details', 'Seva', 'Pravasi'];
    const helperStart = dailyHeaders.length + 1;
    const itemRefs = [
      ...BOUDHIK_IDS.map((id) => ({ key: `boudhik:${id}`, id, kind: 'boudhik' })),
      ...SHARIRIK_IDS.map((id) => ({ key: `sharirik:${id}`, id, kind: 'sharirik' })),
    ];
    const helperHeaders = ['_Visible', '_Sunday', '_Included', '_Visible days', '_Days ran', ...itemRefs.map((item) => `_Days ${item.key}`)];
    ws.addRow([...dailyHeaders, ...helperHeaders]);
    const dailyRows = [];
    const matches = detail.shakhes
      .filter((s) => s.nagar && String(s.nagar.entity) === nagarId)
      .sort((a, b) => {
        const aPath = `${a.vasati && a.vasati.name || ''}\u0000${a.upavasati && a.upavasati.name || ''}\u0000${a.name || ''}`;
        const bPath = `${b.vasati && b.vasati.name || ''}\u0000${b.upavasati && b.upavasati.name || ''}\u0000${b.name || ''}`;
        return aPath.localeCompare(bPath);
      });
    for (const shakhe of matches) {
      const entries = new Map((detail.byShakhe.get(String(shakhe._id)) || []).map((e) => [e.date, e]));
      for (const date of detail.days) {
        const e = entries.get(date);
        const pravasis = e && Array.isArray(e.pravasis) ? e.pravasis.map((p) => [p.name, p.phone, p.responsibility].filter(Boolean).join(' - ')).join('; ') : '';
        const excelRow = ws.addRow([shakhe.nagar && shakhe.nagar.name || '', shakhe.vasati && shakhe.vasati.name || '',
          shakhe.upavasati && shakhe.upavasati.name || '', shakhe.name || '', shakhe.time || '', shakhe.shakheType || '',
          date, e ? 'Yes' : 'No', e && e.taruna || 0, e && e.balaka || 0, e ? (e.taruna || 0) + (e.balaka || 0) : 0,
          e && e.shishu || 0, e && e.mataBhagi || 0, e && e.samparkitaManegalu != null ? e.samparkitaManegalu : '',
          e && e.samparkitaVyaktigalu != null ? e.samparkitaVyaktigalu : '',
          ...boudhikDailyValues(e),
          ...SHARIRIK_IDS.map((id) => e && Array.isArray(e.sharirik) && e.sharirik.includes(id) ? 'Yes' : 'No'),
          e && e.sharirikItara || '', e && e.seva || '', pravasis]);
        const visible = shakheVisibleInDays(shakhe.reportHideIntervals || [], [date]);
        excelRow.getCell(helperStart).value = visible ? 'Yes' : 'No';
        const isSunday = new Date(`${date}T12:00:00Z`).getUTCDay() === 0;
        excelRow.getCell(helperStart + 1).value = isSunday ? 'Yes' : 'No';
        dailyRows.push({ row: excelRow.number, visible, isSunday });
      }
    }
    const lastDataRow = Math.max(2, ws.rowCount);
    const visibleCol = helperStart;
    const sundayCol = helperStart + 1;
    const includedCol = helperStart + 2;
    const visibleDaysCol = helperStart + 3;
    const daysRanCol = helperStart + 4;
    const rawItemCols = new Map();
    for (const id of BOUDHIK_IDS) rawItemCols.set(`boudhik:${id}`, dailyHeaders.indexOf(`Boudhik - ${BOUDHIK_LABELS[id]}`) + 1);
    for (const id of SHARIRIK_IDS) rawItemCols.set(`sharirik:${id}`, dailyHeaders.indexOf(`Sharirik - ${SHARIRIK_LABELS[id]}`) + 1);
    const itemCountCols = new Map(itemRefs.map((item, i) => [item.key, helperStart + 5 + i]));
    const dRange = `$D$2:$D$${lastDataRow}`;
    const hRange = `$H$2:$H$${lastDataRow}`;
    const includedRange = `$${excelColumn(includedCol)}$2:$${excelColumn(includedCol)}$${lastDataRow}`;
    for (const record of dailyRows) {
      const row = record.row;
      formulaCell(
        ws.getCell(row, includedCol),
        `IF(AND(${excelColumn(visibleCol)}${row}="Yes",NOT(AND(${quotedSheet(filtersName)}!$B$7="Yes",${excelColumn(sundayCol)}${row}="Yes"))),"Yes","No")`,
        record.visible && (!options.excludeSunday || !record.isSunday) ? 'Yes' : 'No'
      );
      formulaCell(
        ws.getCell(row, visibleDaysCol),
        `COUNTIFS(${dRange},D${row},${includedRange},"Yes")`,
        0
      );
      formulaCell(
        ws.getCell(row, daysRanCol),
        `COUNTIFS(${dRange},D${row},${hRange},"Yes",${includedRange},"Yes")`,
        0
      );
      for (const item of itemRefs) {
        const rawCol = rawItemCols.get(item.key);
        const rawRange = `$${excelColumn(rawCol)}$2:$${excelColumn(rawCol)}$${lastDataRow}`;
        formulaCell(
          ws.getCell(row, itemCountCols.get(item.key)),
          `COUNTIFS(${dRange},D${row},${includedRange},"Yes",${rawRange},"Yes")`,
          0
        );
      }
    }
    nagaraDailyMeta.set(nagarId, {
      sheetName, lastDataRow, calendarDayCount, visibleCol, sundayCol, includedCol, visibleDaysCol, daysRanCol,
      itemCountCols, filtersName,
    });
    addBackLink(ws, sheetByKey.get(`nagara:${nagarId}`));
    finishSheet(ws);
    for (let column = helperStart; column < helperStart + helperHeaders.length; column += 1) {
      ws.getColumn(column).hidden = true;
    }
  }
  const scopesByKey = new Map(tree.scopes.map((scope) => [scope.key, scope]));
  for (const scope of tree.scopes) {
    const ws = wb.getWorksheet(scope.sheetName);
    if (scope.level === 'nagara') {
      applyNagaraFormulas(scope, ws, nagaraDailyMeta.get(String(scope.entity.id)), options);
    } else {
      applyParentFormulas(scope, ws, sheetByKey, scopesByKey, options, filtersName, calendarDayCount);
    }
  }
  return { workbook: wb, root: tree.scopes[0] };
}

function pdfBuffer(root, options) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 28, bufferPages: true });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
    doc.registerFont('Kannada', KANNADA_FONT);
    paintPdfPage(doc);
    const data = root.data; const title = options.kind === 'shakhe' ? 'Shakhe Varadi' : `${options.kind} Varadi`;
    doc.font('Helvetica').fontSize(16).text(title, { align: 'center' });
    doc.fontSize(10).text(`${LEVEL_EN[root.level]} report    ${options.from} to ${options.to}    Exclude Sunday: ${options.excludeSunday ? 'Yes' : 'No'}`, { align: 'center' });
    selectPdfFont(doc, root.entity.name).fontSize(12).text(pdfDisplayText(root.entity.name), { align: 'center' });
    doc.moveDown(0.6);
    const cols = options.kind === 'shakhe'
      ? ['Unit', 'Yojita', 'Running', 'Not running', 'Avg T', 'Avg B', 'Avg Total', 'Avg Shishu', 'Avg Mata', 'Homes', 'People']
      : ['Unit', 'Yojita', 'Running', 'Not running', ...(data.catalog || []).map((i) => i.en)];
    const pageWidth = doc.page.width - 56; const widths = cols.map((_, i) => i === 0 ? Math.max(105, pageWidth * 0.2) : (pageWidth - Math.max(105, pageWidth * 0.2)) / (cols.length - 1));
    const drawRow = (values, header) => {
      const height = 28; if (doc.y + height > doc.page.height - 28) { doc.addPage(); paintPdfPage(doc); } const y = doc.y; let x = 28;
      values.forEach((v, i) => { const shown = pdfDisplayText(v); doc.rect(x, y, widths[i], height).fillAndStroke(header ? '#1F4E78' : '#FFFFFF', '#B4C7E7'); selectPdfFont(doc, shown).fillColor(header ? '#FFFFFF' : '#111111').fontSize(header ? 7 : 8).text(shown, x + 3, y + 5, { width: widths[i] - 6, height: height - 8, ellipsis: true }); x += widths[i]; });
      doc.y = y + height;
    };
    drawRow(cols, true);
    for (const row of data.rows || []) {
      const child = childOf(row, root.level); const a = row.averages || {}; const s = row.ottuSamparka || {};
      const values = options.kind === 'shakhe'
        ? [child && child.name || '', row.yojitaShakheCount || 0, row.nadayuthiruvaShakheCount || 0, row.nadayadaShakheCount || 0, a.taruna ?? '', a.balaka ?? '', a.total ?? '', a.shishu ?? '', a.mataBhagi ?? '', s.manegalu ?? '', s.vyaktigalu ?? '']
        : [child && child.name || '', row.yojitaShakheCount || 0, row.nadayuthiruvaShakheCount || 0, row.nadayadaShakheCount || 0, ...(data.catalog || []).map((i) => (row.itemCounts || {})[i.id] || 0)];
      drawRow(values, false);
    }
    if (data.totals) {
      const a = data.totals.averages || {}; const s = data.totals.ottuSamparka || {};
      const values = options.kind === 'shakhe'
        ? ['Total', data.totals.yojitaShakheCount || 0, data.totals.nadayuthiruvaShakheCount || 0, data.totals.nadayadaShakheCount || 0, a.taruna ?? '', a.balaka ?? '', a.total ?? '', a.shishu ?? '', a.mataBhagi ?? '', s.manegalu ?? '', s.vyaktigalu ?? '']
        : ['Total', data.totals.yojitaShakheCount || 0, data.totals.nadayuthiruvaShakheCount || 0, data.totals.nadayadaShakheCount || 0, ...(data.catalog || []).map((i) => (data.totals.itemCounts || {})[i.id] || 0)];
      drawRow(values, true);
    }
    doc.end();
  });
}

function singleShakhePdfBuffer(shakhe, days, from, to) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 28 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
    doc.registerFont('Kannada', KANNADA_FONT);
    paintPdfPage(doc);
    doc.font('Helvetica').fontSize(16).text('Shakhe Varadi', { align: 'center' });
    selectPdfFont(doc, shakhe.name).fontSize(12).text(pdfDisplayText(shakhe.name), { align: 'center' });
    doc.font('Helvetica').fontSize(10).text(`${from} to ${to}`, { align: 'center' }).moveDown(0.6);
    const cols = ['Date', 'Ran', 'Taruna', 'Balaka', 'Total', 'Shishu', 'Mata', 'Homes', 'People', 'Boudhik', 'Sharirik', 'Seva'];
    const pageWidth = doc.page.width - 56;
    const fixed = [67, 34, 38, 38, 38, 38, 38, 42, 42];
    const remaining = pageWidth - fixed.reduce((a, b) => a + b, 0);
    const widths = [...fixed, remaining * 0.36, remaining * 0.32, remaining * 0.32];
    const drawRow = (values, header) => {
      const height = 30;
      if (doc.y + height > doc.page.height - 28) { doc.addPage(); paintPdfPage(doc); }
      const y = doc.y; let x = 28;
      values.forEach((v, i) => {
        const shown = pdfDisplayText(v);
        doc.rect(x, y, widths[i], height).fillAndStroke(header ? '#1F4E78' : '#FFFFFF', '#B4C7E7');
        selectPdfFont(doc, shown).fillColor(header ? '#FFFFFF' : '#111111').fontSize(header ? 7 : 8)
          .text(shown, x + 3, y + 5, { width: widths[i] - 6, height: height - 8, ellipsis: true });
        x += widths[i];
      });
      doc.y = y + height;
    };
    drawRow(cols, true);
    for (const day of days) {
      const u = day.upasthiti;
      drawRow([day.date, u ? 'Yes' : 'No', u && u.taruna || 0, u && u.balaka || 0, u && u.total || 0,
        u && u.shishu || 0, u && u.mataBhagi || 0, u && u.samparkitaManegalu != null ? u.samparkitaManegalu : '',
        u && u.samparkitaVyaktigalu != null ? u.samparkitaVyaktigalu : '',
        u ? (u.boudhik || []).map((id) => BOUDHIK_LABELS[id] || id).join(', ') : '',
        u ? (u.sharirik || []).map((id) => SHARIRIK_LABELS[id] || id).join(', ') : '', u && u.seva || ''], false);
    }
    doc.end();
  });
}

async function exportHierarchy({ level, entityId, format, ...options }) {
  if (format === 'pdf') {
    const data = await loadScope(level, entityId, options);
    if (data.error) throw new Error(data.error);
    const entity = scopeEntity(data, level) || { id: entityId, name: level };
    return { buffer: await pdfBuffer({ level, entity, data }, options), contentType: 'application/pdf', extension: 'pdf' };
  }
  const built = await buildWorkbook(level, entityId, options);
  return { buffer: await writeWorkbook(built.workbook), contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx' };
}

async function exportSingleShakhe({ shakhe, days, from, to, format }) {
  if (format === 'pdf') return { buffer: await singleShakhePdfBuffer(shakhe, days, from, to), contentType: 'application/pdf', extension: 'pdf' };
  const wb = new ExcelJS.Workbook();
  wb.calcProperties.fullCalcOnLoad = true;
  wb.calcProperties.forceFullCalc = true;
  wb.calcProperties.calcMode = 'auto';
  const filters = wb.addWorksheet('Filters');
  filters.addRows([['Filter', 'Value'], ['Shakhe', shakhe.name || ''], ['From', from], ['To', to], ['Days selected', days.length], ['Generated at', new Date().toISOString()]]);
  const ws = wb.addWorksheet('Daily Upasthiti');
  const openRow = filters.addRow([]); linkCell(openRow.getCell(1), 'Open daily Upasthiti →', ws.name); finishSheet(filters);
  ws.addRow(['Date', 'Ran', 'Taruna', 'Balaka', 'Total', 'Shishu', 'Mata Bhagini', 'Contacted homes', 'Contacted people',
    ...boudhikDailyHeaders(),
    ...SHARIRIK_IDS.map((id) => `Sharirik - ${SHARIRIK_LABELS[id]}`), 'Sharirik other details', 'Seva', 'Pravasi']);
  for (const d of days) {
    const u = d.upasthiti;
    const pravasis = u && Array.isArray(u.pravasis) ? u.pravasis.map((p) => [p.name, p.phone, p.responsibility].filter(Boolean).join(' - ')).join('; ') : '';
    ws.addRow([d.date, u ? 'Yes' : 'No', u && u.taruna || 0, u && u.balaka || 0, u && u.total || 0, u && u.shishu || 0, u && u.mataBhagi || 0,
      u && u.samparkitaManegalu != null ? u.samparkitaManegalu : '', u && u.samparkitaVyaktigalu != null ? u.samparkitaVyaktigalu : '',
      ...boudhikDailyValues(u),
      ...SHARIRIK_IDS.map((id) => u && Array.isArray(u.sharirik) && u.sharirik.includes(id) ? 'Yes' : 'No'),
      u && u.sharirikItara || '', u && u.seva || '', pravasis]);
  }
  addBackLink(ws, filters.name);
  finishSheet(ws);
  return { buffer: await writeWorkbook(wb), contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx' };
}

module.exports = { exportHierarchy, exportSingleShakhe };
