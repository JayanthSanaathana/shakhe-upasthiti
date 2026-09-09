/**
 * Shakhe report visibility intervals.
 * Interval [from, to): hidden on from .. to-1; to=null means still hidden.
 * Hide/unhide dates are ISO YYYY-MM-DD (IST calendar days).
 */

function dayIsHidden(intervals, dayIso) {
  const day = String(dayIso || '');
  if (!day) return false;
  for (const iv of intervals || []) {
    if (!iv || !iv.from) continue;
    if (day < String(iv.from)) continue;
    if (iv.to == null || iv.to === '') return true;
    if (day < String(iv.to)) return true;
  }
  return false;
}

function isCurrentlyHidden(intervals) {
  return (intervals || []).some((iv) => iv && iv.from && (iv.to == null || iv.to === ''));
}

/** True if at least one day in `days` is not covered by a hide interval. */
function shakheVisibleInDays(intervals, days) {
  const list = days || [];
  if (!list.length) return !isCurrentlyHidden(intervals);
  if (!(intervals || []).length) return true;
  return list.some((d) => !dayIsHidden(intervals, d));
}

function plainIntervals(intervals) {
  return (intervals || [])
    .map((iv) => {
      if (!iv || !iv.from) return null;
      const to = iv.to == null || iv.to === '' ? null : String(iv.to);
      return { from: String(iv.from), to };
    })
    .filter(Boolean);
}

function openHideInterval(intervals, fromIso) {
  const list = plainIntervals(intervals);
  if (list.some((iv) => iv.from && iv.to == null)) {
    return list;
  }
  list.push({ from: String(fromIso), to: null });
  return list;
}

function closeHideInterval(intervals, toIso) {
  const list = plainIntervals(intervals);
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i].from && list[i].to == null) {
      list[i].to = String(toIso);
      break;
    }
  }
  return list;
}

function filterEntriesByShakheVisibility(entries, intervalsByShakheId) {
  if (!intervalsByShakheId || !intervalsByShakheId.size) return entries || [];
  return (entries || []).filter((e) => {
    const sid = e && e.shakhe != null ? String(e.shakhe) : '';
    const intervals = intervalsByShakheId.get(sid);
    if (!intervals || !intervals.length) return true;
    return !dayIsHidden(intervals, e.date);
  });
}

function intervalsByShakheId(shakhes) {
  const map = new Map();
  for (const s of shakhes || []) {
    const id = s && (s._id || s.id);
    if (!id) continue;
    map.set(String(id), s.reportHideIntervals || []);
  }
  return map;
}

module.exports = {
  dayIsHidden,
  isCurrentlyHidden,
  shakheVisibleInDays,
  openHideInterval,
  closeHideInterval,
  filterEntriesByShakheVisibility,
  intervalsByShakheId,
};
