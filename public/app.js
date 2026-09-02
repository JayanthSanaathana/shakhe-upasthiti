const homeView = document.getElementById('home-view');
const formView = document.getElementById('form-view');
const listView = document.getElementById('list-view');
const viewShakheView = document.getElementById('view-shakhe-view');
const varadiGateView = document.getElementById('varadi-gate-view');
const varadiChoiceView = document.getElementById('varadi-choice-view');
const lookupView = document.getElementById('lookup-view');
const setupView = document.getElementById('setup-view');
const upasthitiView = document.getElementById('upasthiti-view');
const shakheForm = document.getElementById('shakhe-form');
const formError = document.getElementById('form-error');
const successPanel = document.getElementById('success-panel');
const nagaraOnlyEls = document.querySelectorAll('.nagara-only');
const guestActions = document.getElementById('guest-actions');
const nagaraActions = document.getElementById('nagara-actions');

const SELECT_PLACEHOLDER = 'ಆಯ್ಕೆಮಾಡಿ/Select';
const TIMING_LABEL = {
  prabhat: 'ಪ್ರಭಾತ/Prabhat',
  sayam: 'ಸಾಯಂ/Sayam',
  ratri: 'ರಾತ್ರಿ/Ratri',
};
const TYPE_LABEL = {
  balaka: 'ಬಾಲಕ/Balaka',
  'Taruna-Vidyarthi': 'ತರುಣ-ವಿದ್ಯಾರ್ಥಿ/Taruna-Vidyarthi',
  'Taruna-Udyogi': 'ತರುಣ-ಉದ್ಯೋಗಿ/Taruna-Udyogi',
  Samyuktha: 'ಸಂಯುಕ್ತ/Samyuktha',
};
const BOUDHIK_ITEMS = [
  { id: 'geethe', kn: 'ಗೀತೆ', en: 'Geethe' },
  { id: 'amruthavacha', kn: 'ಅಮೃತವಚನ', en: 'Amruthavacha' },
  { id: 'shloka', kn: 'ಶ್ಲೋಕ', en: 'Shloka' },
  { id: 'panchaga', kn: 'ಪಂಚಾಂಗ', en: 'Panchaga' },
  { id: 'sannaKathe', kn: 'ಸಣ್ಣ ಕಥೆ', en: 'Sanna Kathe' },
  { id: 'deerghaKathe', kn: 'ದೀರ್ಘ ಕಥೆ', en: 'Deergha Kathe' },
  { id: 'boudhik', kn: 'ಬೌದ್ಧಿಕ್', en: 'Boudhik' },
  { id: 'charche', kn: 'ಚರ್ಚೆ', en: 'Charche' },
  { id: 'samacharaSamekhe', kn: 'ಸಮಾಚಾರ ಸಮೀಕ್ಷೆ', en: 'Samachara Samekhe' },
  { id: 'prathanaAbhyasa', kn: 'ಪ್ರಾರ್ಥನಾ ಅಭ್ಯಾಸ', en: 'Prathana Abhyasa' },
  { id: 'itara', kn: 'ಇತರ', en: 'Itara' },
];
const SHARIRIK_ITEMS = [
  { id: 'suryanamaskar', kn: 'ಸೂರ್ಯನಮಸ್ಕಾರ', en: 'Suryanamaskar' },
  { id: 'samata', kn: 'ಸಮತಾ', en: 'Samata' },
  { id: 'sanchalana', kn: 'ಸಂಚಲನ', en: 'Sanchalana' },
  { id: 'danda', kn: 'ದಂಡ', en: 'Danda' },
  { id: 'niyuddha', kn: 'ನಿಯುದ್ಧ', en: 'Niyuddha' },
  { id: 'yeshti', kn: 'ಯಷ್ಟಿ', en: 'Yeshti' },
  { id: 'dandaYuddha', kn: 'ದಂಡ ಯುದ್ಧ', en: 'Danda yuddha' },
  { id: 'padavinyas', kn: 'ಪಾದವಿನ್ಯಾಸ', en: 'Padavinyas' },
  { id: 'itara', kn: 'ಇತರ', en: 'Itara' },
];
const MAP_DEFAULT = [12.9716, 77.5946];

let nagaraId = null;
let nagaraName = null;
let nagaraBhagName = null;
let nagaraVibhagName = null;
let varadiPendingCredentials = null;
let varadiLogoutTimer = null;
let lockedIds = { vibhagId: '', bhagId: '', nagarId: '' };
let formMode = 'create';
let editingShakheId = null;
let listShakhes = [];
let formFilling = false;

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fillSelect(select, options, placeholder, selectedId) {
  const opts = (options || []).map((o) => {
    const selected = selectedId && o.id === selectedId ? ' selected' : '';
    return `<option value="${escapeHtml(String(o.id || ''))}"${selected}>${escapeHtml(String(o.name || ''))}</option>`;
  });
  select.innerHTML = `<option value="">${escapeHtml(placeholder || '')}</option>` + opts.join('');
}

function showScreen(view) {
  [homeView, formView, listView, viewShakheView, varadiGateView, varadiChoiceView, lookupView, setupView, upasthitiView].forEach((v) =>
    v.classList.add('hidden')
  );
  view.classList.remove('hidden');
}

function setNagaraAuthed(on) {
  document.documentElement.classList.toggle('nagara-authed', on);
  nagaraOnlyEls.forEach((el) => el.classList.toggle('hidden', !on));
  guestActions.classList.toggle('hidden', on);
  nagaraActions.classList.toggle('hidden', !on);
}

function clearVaradiLogoutTimer() {
  if (varadiLogoutTimer) {
    clearTimeout(varadiLogoutTimer);
    varadiLogoutTimer = null;
  }
}

function armVaradiLogout(ms) {
  clearVaradiLogoutTimer();
  const wait = Number(ms);
  if (!Number.isFinite(wait) || wait <= 0) return;
  varadiLogoutTimer = setTimeout(async () => {
    try {
      await fetch('/api/varadi/logout', { method: 'POST' });
    } catch (_) {}
    logoutLocal();
    showHome();
  }, wait);
}

function logoutLocal() {
  clearVaradiLogoutTimer();
  nagaraId = null;
  nagaraName = null;
  nagaraBhagName = null;
  nagaraVibhagName = null;
  varadiPendingCredentials = null;
  setNagaraAuthed(false);
}

function showHome() {
  const place = document.getElementById('nagara-home-place');
  if (place) {
    place.textContent = nagaraName || '';
    place.classList.toggle('hidden', !nagaraName);
  }
  showScreen(homeView);
}

function showVaradiGate(opts) {
  const errorEl = document.getElementById('varadi-gate-error');
  const message = opts && opts.message ? String(opts.message) : '';
  if (message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  } else {
    errorEl.classList.add('hidden');
  }
  document.getElementById('varadi-email').value = '';
  document.getElementById('varadi-password').value = '';
  showScreen(varadiGateView);
}

async function openFromSession(data) {
  if (!data || data.level !== 'nagara' || !data.entityId) {
    showVaradiGate({ message: 'ಈ ಖಾತೆಗೆ ನಗರ ಇಲ್ಲ/No Nagara access for this account' });
    return;
  }
  nagaraId = data.entityId;
  nagaraName = data.entityName || '';
  setNagaraAuthed(true);
  armVaradiLogout(data.expiresIn);
  showHome();
}

function showVaradiChoices(choices) {
  const list = document.getElementById('varadi-choice-list');
  const errorEl = document.getElementById('varadi-choice-error');
  errorEl.classList.add('hidden');
  list.innerHTML = '';
  (choices || []).forEach((choice) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'action';
    btn.innerHTML = `<span class="action-kn">${escapeHtml(choice.entityName || choice.entityId)}</span><span class="action-en">${escapeHtml(
      choice.sthara || choice.level || ''
    )}</span>`;
    btn.addEventListener('click', () => selectVaradiChoice(choice));
    list.appendChild(btn);
  });
  showScreen(varadiChoiceView);
}

async function selectVaradiChoice(choice) {
  const errorEl = document.getElementById('varadi-choice-error');
  errorEl.classList.add('hidden');
  if (!varadiPendingCredentials || !choice || !choice.entityId) {
    showVaradiGate();
    return;
  }
  try {
    const res = await fetch('/api/varadi/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: varadiPendingCredentials.email,
        password: varadiPendingCredentials.password,
        entityId: choice.entityId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      errorEl.textContent = data.error || 'ಸೈನ್ ಇನ್ ಆಗಲಿಲ್ಲ/Could not sign in';
      errorEl.classList.remove('hidden');
      return;
    }
    varadiPendingCredentials = null;
    await openFromSession(data);
  } catch (_) {
    errorEl.textContent = 'ಸೈನ್ ಇನ್ ಆಗಲಿಲ್ಲ/Could not sign in';
    errorEl.classList.remove('hidden');
  }
}

const bearers = {
  mukhashikshak: null,
  karyavaha: null,
  palaka: null,
};

function personPhone(person) {
  const d = String((person && person.phone) || '').replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}

function phoneOk(value, optional) {
  const d = String(value || '').replace(/\D/g, '');
  if (!d) return optional;
  return d.length >= 10;
}

function resetBearer(key, blockId) {
  bearers[key] = null;
  const block = document.getElementById(blockId);
  if (!block) return;
  const search = block.querySelector('.ob-search');
  search.value = '';
  search.classList.remove('hidden');
  block.querySelector('.ob-results').innerHTML = '';
  block.querySelector('.ob-selected').classList.add('hidden');
}

function selectBearer(key, blockId, person) {
  const block = document.getElementById(blockId);
  bearers[key] = person;
  const search = block.querySelector('.ob-search');
  search.value = '';
  search.classList.add('hidden');
  block.querySelector('.ob-results').innerHTML = '';
  block.querySelector('.ob-selected').classList.remove('hidden');
  block.querySelector('.ob-selected-text').textContent = person.name
    ? `${person.name} — ${person.phone}`
    : person.phone;
}

async function selectBearerByPhone(key, blockId, phone, name) {
  resetBearer(key, blockId);
  if (!phone) return;
  selectBearer(key, blockId, { name: name || '', phone });
  try {
    const res = await fetch(`/api/people/search?phone=${encodeURIComponent(phone)}`);
    const people = await res.json().catch(() => []);
    const want = foldPhoneClient(phone);
    const match =
      (Array.isArray(people) && people.find((p) => foldPhoneClient(personPhone(p)) === want)) ||
      (Array.isArray(people) && people[0]);
    if (match) {
      selectBearer(key, blockId, {
        personId: match.personId,
        name: match.name || name || '',
        phone: match.phone || phone,
      });
    }
  } catch (_) {}
}

function bindBearerSearch(blockId, key) {
  const block = document.getElementById(blockId);
  const searchInput = block.querySelector('.ob-search');
  const results = block.querySelector('.ob-results');
  let debounce;
  searchInput.addEventListener('input', () => {
    searchInput.value = String(searchInput.value || '').replace(/\D/g, '').slice(0, 20);
    clearTimeout(debounce);
    const q = searchInput.value.trim();
    results.innerHTML = '';
    if (q.length < 3) return;
    debounce = setTimeout(async () => {
      const res = await fetch(`/api/people/search?phone=${encodeURIComponent(q)}`);
      const people = await res.json().catch(() => []);
      results.innerHTML = '';
      if (!Array.isArray(people) || people.length === 0) {
        results.innerHTML =
          '<li class="no-match">ಹೊಂದಾಣಿಕೆ ಸಿಗಲಿಲ್ಲ — ಬೇರೆ ಸಂಖ್ಯೆ ಪ್ರಯತ್ನಿಸಿ/No matches — try a different number.</li>';
        return;
      }
      people.forEach((p) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        const context = [p.nagarName, p.responsibility, p.shakhe].filter(Boolean).join(', ');
        btn.textContent = context ? `${p.name} — ${p.phone} (${context})` : `${p.name} — ${p.phone}`;
        btn.addEventListener('click', () => {
          selectBearer(key, blockId, { personId: p.personId, name: p.name, phone: p.phone });
          refreshSubmit();
          if (key === 'mukhashikshak') checkMukhashikshakShakhe(personPhone(bearers[key]));
          if (typeof refreshDailySubmit === 'function') refreshDailySubmit();
        });
        li.appendChild(btn);
        results.appendChild(li);
      });
    }, 300);
  });
  block.querySelector('.ob-clear').addEventListener('click', () => {
    resetBearer(key, blockId);
    if (key === 'mukhashikshak') closePhoneExists();
    refreshSubmit();
    if (typeof refreshDailySubmit === 'function') refreshDailySubmit();
  });
}

bindBearerSearch('mukhashikshak-block', 'mukhashikshak');
bindBearerSearch('karyavaha-block', 'karyavaha');
bindBearerSearch('palaka-block', 'palaka');
bindBearerSearch('pravasi-block', 'pravasi');
bindBearerSearch('boudhik-speaker-block', 'boudhikSpeaker');
bindBearerSearch('charche-speaker-block', 'charcheSpeaker');

function setFieldError(id, message) {
  const el = document.querySelector(`[data-error-for="${id}"]`);
  const input = document.getElementById(id);
  if (el) el.textContent = message || '';
  if (input) input.classList.toggle('is-invalid', Boolean(message));
}

function formComplete() {
  return (
    document.getElementById('shakhe-vasati').value &&
    document.getElementById('shakhe-upavasati').value &&
    document.getElementById('shakhe-name').value.trim() &&
    document.getElementById('shakhe-timing').value &&
    document.getElementById('shakhe-time').value &&
    document.getElementById('shakhe-type').value &&
    phoneOk(personPhone(bearers.mukhashikshak), false) &&
    phoneOk(personPhone(bearers.karyavaha), true) &&
    phoneOk(personPhone(bearers.palaka), true)
  );
}

function refreshSubmit() {
  document.getElementById('shakhe-submit').disabled = !formComplete();
}

let upavasatiCheckSeq = 0;
let phoneCheckSeq = 0;

function warnPersonName(storedName, storedPhone, bearer) {
  if (storedName) return storedName;
  if (bearer && personPhone(bearer) && personPhone(bearer) === foldPhoneClient(storedPhone)) {
    return bearer.name || '';
  }
  return '';
}

function foldPhoneClient(value) {
  const d = String(value || '').replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}

function shakheWarnCard(s) {
  const path = [s.vibhag && s.vibhag.name, s.bhag && s.bhag.name, s.nagar && s.nagar.name, s.vasati && s.vasati.name, s.upavasati && s.upavasati.name]
    .filter(Boolean)
    .join(' → ');
  const mukhaName = warnPersonName(s.mukhashikshakName, s.mukhashikshakPhone, bearers.mukhashikshak);
  const karyName = warnPersonName(s.karyavahaName, s.karyavahaPhone, bearers.karyavaha);
  const palakaName = warnPersonName(s.shakhaPalakaName, s.shakhaPalakaPhone, bearers.palaka);
  return `<div class="warn-utsava"><p class="utsava-hierarchy">${escapeHtml(path || '—')}</p>${kv(
    'ಶಾಖೆ ಹೆಸರು/Shakhe name',
    s.name || '—'
  )}${kv('ಸಮಯ/Timing', `${TIMING_LABEL[s.timing] || s.timing || '—'} ${s.time || ''}`.trim())}${kv(
    'ಪ್ರಕಾರ/Type',
    TYPE_LABEL[s.shakheType] || s.shakheType || '—'
  )}${kv('ಮುಖಶಿಕ್ಷಕ/Mukhashikshak', personCell(mukhaName, s.mukhashikshakPhone))}${kv(
    'ಕಾರ್ಯವಾಹ/Karyavaha',
    personCell(karyName, s.karyavahaPhone)
  )}${kv('ಶಾಖಾ ಪಾಲಕ/Shakha palaka', personCell(palakaName, s.shakhaPalakaPhone))}</div>`;
}

function closeUpavasatiExists() {
  upavasatiCheckSeq += 1;
  document.getElementById('upavasati-exists').classList.add('hidden');
}

function closePhoneExists() {
  phoneCheckSeq += 1;
  document.getElementById('phone-exists').classList.add('hidden');
  document.getElementById('phone-exists-details').innerHTML = '';
}

function openUpavasatiExists(shakhes) {
  document.getElementById('upavasati-exists-details').innerHTML = (shakhes || []).map(shakheWarnCard).join('');
  document.getElementById('upavasati-exists').classList.remove('hidden');
  document.getElementById('upavasati-exists-close').focus();
}

function openPhoneExists(shakhes) {
  document.getElementById('phone-exists-details').innerHTML = (shakhes || []).map(shakheWarnCard).join('');
  document.getElementById('phone-exists').classList.remove('hidden');
  document.getElementById('phone-exists-close').focus();
}

async function checkUpavasatiShakhe(upavasatiId) {
  closeUpavasatiExists();
  const seq = ++upavasatiCheckSeq;
  if (!upavasatiId) return;
  try {
    const res = await fetch(`/api/shakhe/by-upavasati?upavasatiId=${encodeURIComponent(upavasatiId)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    if (seq !== upavasatiCheckSeq) return;
    if (document.getElementById('shakhe-upavasati').value !== upavasatiId) return;
    const list = (data.shakhes || []).filter((s) => s.id !== editingShakheId);
    if (!list.length) return;
    openUpavasatiExists(list);
  } catch (_) {}
}

async function checkMukhashikshakShakhe(phone) {
  closePhoneExists();
  const seq = ++phoneCheckSeq;
  if (!phone || phone.length < 6) return;
  try {
    const res = await fetch(`/api/shakhe/by-mukhashikshak?phone=${encodeURIComponent(phone)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    if (seq !== phoneCheckSeq) return;
    if (personPhone(bearers.mukhashikshak) !== phone) return;
    const list = (data.shakhes || []).filter((s) => s.id !== editingShakheId);
    if (!list.length) return;
    openPhoneExists(list);
  } catch (_) {}
}

async function loadFormHierarchy() {
  const res = await fetch('/api/form');
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    logoutLocal();
    showVaradiGate();
    return null;
  }
  if (!res.ok) {
    formError.textContent = data.error || 'ಫಾರ್ಮ್ ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load form';
    formError.classList.remove('hidden');
    return null;
  }
  const bySthara = Object.fromEntries((data.levels || []).map((l) => [l.sthara, l]));
  document.getElementById('locked-vibhag').textContent = (bySthara.Vibhag && bySthara.Vibhag.value && bySthara.Vibhag.value.name) || '—';
  document.getElementById('locked-bhag').textContent = (bySthara.Bhag && bySthara.Bhag.value && bySthara.Bhag.value.name) || '—';
  document.getElementById('locked-nagar').textContent = (bySthara.Nagar && bySthara.Nagar.value && bySthara.Nagar.value.name) || '—';
  nagaraVibhagName = (bySthara.Vibhag && bySthara.Vibhag.value && bySthara.Vibhag.value.name) || '';
  nagaraBhagName = (bySthara.Bhag && bySthara.Bhag.value && bySthara.Bhag.value.name) || '';
  lockedIds = {
    vibhagId: bySthara.Vibhag && bySthara.Vibhag.value ? bySthara.Vibhag.value.id : '',
    bhagId: bySthara.Bhag && bySthara.Bhag.value ? bySthara.Bhag.value.id : '',
    nagarId: bySthara.Nagar && bySthara.Nagar.value ? bySthara.Nagar.value.id : nagaraId,
  };
  return bySthara;
}

async function openForm() {
  formMode = 'create';
  editingShakheId = null;
  successPanel.classList.add('hidden');
  shakheForm.classList.remove('hidden');
  formError.classList.add('hidden');
  document.getElementById('form-title').textContent = 'ಶಾಖೆ ರಚಿಸಿ/Create Shakhe';
  document.querySelector('#success-panel strong').textContent = 'ಶಾಖೆ ರಚಿಸಲಾಗಿದೆ/Shakhe created';
  shakheForm.reset();
  closeUpavasatiExists();
  closePhoneExists();
  resetBearer('mukhashikshak', 'mukhashikshak-block');
  resetBearer('karyavaha', 'karyavaha-block');
  resetBearer('palaka', 'palaka-block');
  fillSelect(document.getElementById('shakhe-upavasati'), [], 'ಮೊದಲು ವಸತಿ ಆಯ್ಕೆಮಾಡಿ/Select a Vasati first');
  document.getElementById('shakhe-upavasati').disabled = true;
  showScreen(formView);

  const bySthara = await loadFormHierarchy();
  if (!bySthara) return;
  const vasati = document.getElementById('shakhe-vasati');
  fillSelect(vasati, (bySthara.Vasati && bySthara.Vasati.options) || [], SELECT_PLACEHOLDER);
  vasati.disabled = false;
  refreshSubmit();
}

function setFormLoading(on) {
  const el = document.getElementById('form-loading');
  if (el) el.classList.toggle('hidden', !on);
  const view = document.getElementById('form-view');
  if (view) view.classList.toggle('is-loading', !!on);
}

async function openEditShakhe(id) {
  formMode = 'edit';
  editingShakheId = id;
  formFilling = true;
  successPanel.classList.add('hidden');
  shakheForm.classList.remove('hidden');
  formError.classList.add('hidden');
  document.getElementById('form-title').textContent = 'ಶಾಖೆ ತಿದ್ದುಪಡಿ/Edit Shakhe';
  document.querySelector('#success-panel strong').textContent = 'ಶಾಖೆ ಉಳಿಸಲಾಗಿದೆ/Shakhe saved';
  shakheForm.reset();
  closeUpavasatiExists();
  closePhoneExists();
  resetBearer('mukhashikshak', 'mukhashikshak-block');
  resetBearer('karyavaha', 'karyavaha-block');
  resetBearer('palaka', 'palaka-block');
  showScreen(formView);
  setFormLoading(true);
  try {
    const cached = listShakhes.find((s) => s.id === id) || {};
    const bySthara = await loadFormHierarchy();
    if (!bySthara) return;
    const vasati = document.getElementById('shakhe-vasati');
    fillSelect(vasati, (bySthara.Vasati && bySthara.Vasati.options) || [], SELECT_PLACEHOLDER);
    vasati.disabled = false;

    const res = await fetch(`/api/shakhe/${encodeURIComponent(id)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      formError.textContent = data.error || 'ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load';
      formError.classList.remove('hidden');
      return;
    }
    const row = { ...cached, ...data };
    if (row.vasati && row.vasati.id) {
      vasati.value = row.vasati.id;
      const upa = document.getElementById('shakhe-upavasati');
      upa.innerHTML = '<option value="">ಲೋಡ್ ಆಗುತ್ತಿದೆ/Loading…</option>';
      const optRes = await fetch(
        `/api/options?parentId=${encodeURIComponent(vasati.value)}&sthara=${encodeURIComponent('Upavasati')}`
      );
      const options = await optRes.json().catch(() => []);
      if (optRes.ok) {
        fillSelect(upa, options, SELECT_PLACEHOLDER);
        upa.disabled = false;
        if (row.upavasati && row.upavasati.id) upa.value = row.upavasati.id;
      }
    }
    document.getElementById('shakhe-name').value = row.name || '';
    document.getElementById('shakhe-timing').value = row.timing || '';
    document.getElementById('shakhe-time').value = row.time || '';
    document.getElementById('shakhe-type').value = row.shakheType || '';
    await selectBearerByPhone(
      'mukhashikshak',
      'mukhashikshak-block',
      row.mukhashikshakPhone,
      row.mukhashikshakName
    );
    await selectBearerByPhone('karyavaha', 'karyavaha-block', row.karyavahaPhone, row.karyavahaName);
    await selectBearerByPhone('palaka', 'palaka-block', row.shakhaPalakaPhone, row.shakhaPalakaName);
    refreshSubmit();
  } finally {
    formFilling = false;
    setFormLoading(false);
  }
}

async function openList() {
  const errorEl = document.getElementById('list-error');
  const loading = document.getElementById('list-loading');
  const body = document.getElementById('list-body');
  errorEl.classList.add('hidden');
  body.innerHTML = '';
  loading.classList.remove('hidden');
  showScreen(listView);
  const res = await fetch('/api/shakhe');
  const data = await res.json().catch(() => ({}));
  loading.classList.add('hidden');
  if (res.status === 401) {
    logoutLocal();
    showVaradiGate();
    return;
  }
  if (!res.ok) {
    errorEl.textContent = data.error || 'ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load';
    errorEl.classList.remove('hidden');
    return;
  }
  listShakhes = data.shakhes || [];
  if (!listShakhes.length) {
    body.innerHTML = '<p class="username">ಈ ನಗರದಲ್ಲಿ ಶಾಖೆಗಳಿಲ್ಲ/No shakhes in this nagara yet.</p>';
    return;
  }
  paintShakheList();
}

function hideStoreKey() {
  return `shakhe-hide:v1:${nagaraId || 'nagara'}`;
}

function loadHiddenIds() {
  try {
    const raw = localStorage.getItem(hideStoreKey());
    const arr = raw ? JSON.parse(raw) : [];
    return new Set((Array.isArray(arr) ? arr : []).map(String));
  } catch (_) {
    return new Set();
  }
}

function saveHiddenIds(idSet) {
  try {
    localStorage.setItem(hideStoreKey(), JSON.stringify([...idSet]));
  } catch (_) {}
}

function personCell(name, phone) {
  if (name && phone) return `${name} — ${phone}`;
  return phone || name || '—';
}

function mapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
}

function locationCellHtml(s) {
  const loc = s.location || {};
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (!s.setupComplete || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return escapeHtml('ಇಲ್ಲ/Not set');
  }
  const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  return `<a class="num-link" href="${escapeHtml(mapsUrl(lat, lng))}" target="_blank" rel="noopener noreferrer">${escapeHtml(
    label
  )}</a>`;
}

function shakheListCells(s) {
  return (
    `<td><button type="button" class="num-link" data-shakhe-id="${escapeHtml(s.id)}">${escapeHtml(
      s.name
    )}</button></td>` +
    `<td>${escapeHtml(s.vasati && s.vasati.name)}</td>` +
    `<td>${escapeHtml(s.upavasati && s.upavasati.name)}</td>` +
    `<td>${escapeHtml(TIMING_LABEL[s.timing] || s.timing)} ${escapeHtml(s.time)}</td>` +
    `<td>${escapeHtml(TYPE_LABEL[s.shakheType] || s.shakheType)}</td>` +
    `<td>${escapeHtml(personCell(s.mukhashikshakName, s.mukhashikshakPhone))}</td>` +
    `<td>${escapeHtml(personCell(s.karyavahaName, s.karyavahaPhone))}</td>` +
    `<td>${escapeHtml(personCell(s.shakhaPalakaName, s.shakhaPalakaPhone))}</td>` +
    `<td>${escapeHtml(s.stanaName || 'ಇಲ್ಲ/Not set')}</td>` +
    `<td>${locationCellHtml(s)}</td>` +
    `<td><button type="button" class="edit-link" data-edit-id="${escapeHtml(s.id)}"><span class="th-stack"><span class="th-kn">ತಿದ್ದುಪಡಿ</span><span class="th-en">Edit</span></span></button></td>`
  );
}

function paintShakheList() {
  const body = document.getElementById('list-body');
  const hidden = loadHiddenIds();
  const visible = listShakhes.filter((s) => !hidden.has(String(s.id)));
  const hiddenItems = listShakhes.filter((s) => hidden.has(String(s.id)));
  const head =
    '<thead><tr><th class="col-check"></th><th>ಶಾಖೆ/Shakhe</th><th>ವಸತಿ/Vasati</th><th>ಉಪವಸತಿ/Upavasati</th><th>ಸಮಯ/Timing</th><th>ಪ್ರಕಾರ/Type</th><th>ಮುಖಶಿಕ್ಷಕ/Mukhashikshak</th><th>ಕಾರ್ಯವಾಹ/Karyavaha</th><th>ಶಾಖಾ ಪಾಲಕ/Shakha palaka</th><th>ಸ್ಥಾನ/Sthana</th><th>ಸ್ಥಳ/Location</th><th>ತಿದ್ದುಪಡಿ/Edit</th></tr></thead>';
  const visibleRows = visible
    .map(
      (s) =>
        `<tr><td class="col-check"><input type="checkbox" data-hide-id="${escapeHtml(s.id)}"></td>${shakheListCells(
          s
        )}</tr>`
    )
    .join('');
  const tableHtml = visible.length
    ? `<table>${head}<tbody>${visibleRows}</tbody></table>`
    : '<p class="username">ತೋರಿಸುವ ಶಾಖೆಗಳಿಲ್ಲ/No visible shakhes</p>';
  const hiddenTable = hiddenItems.length
    ? `<table><thead><tr><th>ಶಾಖೆ/Shakhe</th><th>ವಸತಿ/Vasati</th><th>ಉಪವಸತಿ/Upavasati</th><th>ಸಮಯ/Timing</th><th>ಪ್ರಕಾರ/Type</th><th>ಮುಖಶಿಕ್ಷಕ/Mukhashikshak</th><th>ಕಾರ್ಯವಾಹ/Karyavaha</th><th>ಶಾಖಾ ಪಾಲಕ/Shakha palaka</th><th>ಸ್ಥಾನ/Sthana</th><th>ಸ್ಥಳ/Location</th><th>ತಿದ್ದುಪಡಿ/Edit</th><th></th></tr></thead><tbody>${hiddenItems
        .map(
          (s) =>
            `<tr>${shakheListCells(s)}<td><button type="button" class="secondary" data-unhide-id="${escapeHtml(
              s.id
            )}">ತೋರಿಸು/Unhide</button></td></tr>`
        )
        .join('')}</tbody></table>`
    : '<p class="username">ಮರೆಯಾದ ಶಾಖೆಗಳಿಲ್ಲ/No hidden shakhes</p>';
  body.innerHTML =
    tableHtml +
    `<div class="list-hide-bar">` +
    `<button type="button" class="secondary" data-list-hide>ಮರೆಮಾಡಿ/Hide</button>` +
    `<button type="button" class="secondary" data-list-hidden-toggle>ಮರೆಯಾದವು/Hidden (${hidden.size})</button>` +
    `</div>` +
    `<div class="list-hidden-panel hidden" data-list-hidden-panel>${hiddenTable}</div>`;
  body.querySelectorAll('button[data-shakhe-id]').forEach((btn) => {
    btn.addEventListener('click', () => openShakheView(btn.getAttribute('data-shakhe-id')));
  });
  body.querySelectorAll('button[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => openEditShakhe(btn.getAttribute('data-edit-id')));
  });
  const hideBtn = body.querySelector('[data-list-hide]');
  const toggleBtn = body.querySelector('[data-list-hidden-toggle]');
  const panel = body.querySelector('[data-list-hidden-panel]');
  if (hideBtn) {
    hideBtn.addEventListener('click', () => {
      const next = loadHiddenIds();
      body.querySelectorAll('input[data-hide-id]:checked').forEach((el) => {
        next.add(String(el.getAttribute('data-hide-id')));
      });
      saveHiddenIds(next);
      paintShakheList();
    });
  }
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => panel.classList.toggle('hidden'));
  }
  body.querySelectorAll('[data-unhide-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = loadHiddenIds();
      next.delete(String(btn.getAttribute('data-unhide-id')));
      saveHiddenIds(next);
      paintShakheList();
    });
  });
}

document.getElementById('open-nagara-login-btn').addEventListener('click', async () => {
  try {
    const res = await fetch('/api/varadi/session');
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok && data.level === 'nagara') {
      await openFromSession(data);
      return;
    }
  } catch (_) {}
  showVaradiGate();
});

document.getElementById('open-upasthiti-btn').addEventListener('click', openLookup);
document.getElementById('lookup-back').addEventListener('click', showHome);
document.getElementById('setup-back').addEventListener('click', () => openLookup({ reset: false }));
document.getElementById('upasthiti-back').addEventListener('click', () => openLookup({ reset: false }));
document.getElementById('upasthiti-done').addEventListener('click', () => {
  document.getElementById('upasthiti-success').classList.add('hidden');
});

document.getElementById('open-form-btn').addEventListener('click', openForm);
document.getElementById('open-list-btn').addEventListener('click', openList);
document.getElementById('form-back').addEventListener('click', () => {
  if (formMode === 'edit') {
    openList();
    return;
  }
  showHome();
});
document.getElementById('list-back').addEventListener('click', showHome);
document.getElementById('view-shakhe-back').addEventListener('click', openList);
document.getElementById('success-done').addEventListener('click', () => {
  if (formMode === 'edit') {
    openList();
    return;
  }
  showHome();
});

document.getElementById('nagara-logout').addEventListener('click', async () => {
  try {
    await fetch('/api/varadi/logout', { method: 'POST' });
  } catch (_) {}
  logoutLocal();
  showHome();
});

document.getElementById('varadi-gate-back').addEventListener('click', showHome);
document.getElementById('varadi-choice-back').addEventListener('click', () => {
  varadiPendingCredentials = null;
  showVaradiGate();
});

document.getElementById('varadi-gate-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('varadi-gate-error');
  const email = document.getElementById('varadi-email').value.trim();
  const password = document.getElementById('varadi-password').value;
  errorEl.classList.add('hidden');
  try {
    const res = await fetch('/api/varadi/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      errorEl.textContent =
        res.status === 429
          ? 'ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ/Try again later'
          : res.status === 403
            ? 'ಈ ಖಾತೆಗೆ ನಗರ ಇಲ್ಲ/No Nagara access for this account'
            : res.status === 503
              ? 'ಸೈನ್ ಇನ್ ಆಗಲಿಲ್ಲ/Could not sign in'
              : 'ಇಮೇಲ್ ಅಥವಾ ಗುಪ್ತಪದ ತಪ್ಪು/Invalid email or password';
      errorEl.classList.remove('hidden');
      return;
    }
    document.getElementById('varadi-password').value = '';
    if (data.needsChoice && Array.isArray(data.choices)) {
      varadiPendingCredentials = { email, password };
      showVaradiChoices(data.choices);
      return;
    }
    varadiPendingCredentials = null;
    await openFromSession(data);
  } catch (_) {
    errorEl.textContent = 'ಸೈನ್ ಇನ್ ಆಗಲಿಲ್ಲ/Could not sign in';
    errorEl.classList.remove('hidden');
  }
});

document.getElementById('shakhe-vasati').addEventListener('change', async () => {
  if (formFilling) return;
  const vasati = document.getElementById('shakhe-vasati');
  const upa = document.getElementById('shakhe-upavasati');
  closeUpavasatiExists();
  fillSelect(upa, [], 'ಮೊದಲು ವಸತಿ ಆಯ್ಕೆಮಾಡಿ/Select a Vasati first');
  upa.disabled = true;
  refreshSubmit();
  if (!vasati.value) return;
  upa.innerHTML = '<option value="">ಲೋಡ್ ಆಗುತ್ತಿದೆ/Loading…</option>';
  const res = await fetch(
    `/api/options?parentId=${encodeURIComponent(vasati.value)}&sthara=${encodeURIComponent('Upavasati')}`
  );
  const options = await res.json().catch(() => []);
  if (!res.ok) {
    fillSelect(upa, [], 'ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load');
    return;
  }
  fillSelect(upa, options, SELECT_PLACEHOLDER);
  upa.disabled = false;
  refreshSubmit();
});

['shakhe-upavasati', 'shakhe-name', 'shakhe-timing', 'shakhe-time', 'shakhe-type'].forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener('input', refreshSubmit);
  el.addEventListener('change', refreshSubmit);
});
document.getElementById('shakhe-upavasati').addEventListener('change', () => {
  checkUpavasatiShakhe(document.getElementById('shakhe-upavasati').value);
});
document.getElementById('phone-exists-close').addEventListener('click', closePhoneExists);
document.getElementById('phone-exists-dismiss').addEventListener('click', closePhoneExists);
document.getElementById('upavasati-exists-close').addEventListener('click', closeUpavasatiExists);
document.getElementById('upavasati-exists-dismiss').addEventListener('click', closeUpavasatiExists);
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!document.getElementById('phone-exists').classList.contains('hidden')) {
    closePhoneExists();
    return;
  }
  if (!document.getElementById('upavasati-exists').classList.contains('hidden')) {
    closeUpavasatiExists();
  }
});

shakheForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.classList.add('hidden');
  ['shakhe-vasati', 'shakhe-upavasati', 'shakhe-name', 'shakhe-timing', 'shakhe-time', 'shakhe-type', 'mukhashikshak-phone', 'karyavaha-phone', 'palaka-phone'].forEach(
    (id) => setFieldError(id, '')
  );
  if (!formComplete()) {
    if (!document.getElementById('shakhe-vasati').value) setFieldError('shakhe-vasati', 'ಆಯ್ಕೆಮಾಡಿ/Select');
    if (!document.getElementById('shakhe-upavasati').value) setFieldError('shakhe-upavasati', 'ಆಯ್ಕೆಮಾಡಿ/Select');
    if (!document.getElementById('shakhe-name').value.trim()) setFieldError('shakhe-name', 'ಹೆಸರು ನಮೂದಿಸಿ/Enter name');
    if (!document.getElementById('shakhe-timing').value) setFieldError('shakhe-timing', 'ಆಯ್ಕೆಮಾಡಿ/Select');
    if (!document.getElementById('shakhe-time').value) setFieldError('shakhe-time', 'ಸಮಯ ಆಯ್ಕೆಮಾಡಿ/Select time');
    if (!document.getElementById('shakhe-type').value) setFieldError('shakhe-type', 'ಆಯ್ಕೆಮಾಡಿ/Select');
    if (!phoneOk(personPhone(bearers.mukhashikshak), false)) {
      setFieldError('mukhashikshak-phone', 'ಹುಡುಕಿ ಆಯ್ಕೆಮಾಡಿ/Search and select');
    }
    refreshSubmit();
    return;
  }

  const submit = document.getElementById('shakhe-submit');
  submit.disabled = true;
  const timeVal = document.getElementById('shakhe-time').value;
  const time = timeVal.length >= 5 ? timeVal.slice(0, 5) : timeVal;
  const editing = formMode === 'edit' && editingShakheId;
  const res = await fetch(editing ? `/api/shakhe/${encodeURIComponent(editingShakheId)}` : '/api/shakhe', {
    method: editing ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vibhagId: lockedIds.vibhagId,
      bhagId: lockedIds.bhagId,
      nagarId: lockedIds.nagarId,
      vasatiId: document.getElementById('shakhe-vasati').value,
      upavasatiId: document.getElementById('shakhe-upavasati').value,
      name: document.getElementById('shakhe-name').value.trim(),
      timing: document.getElementById('shakhe-timing').value,
      time,
      shakheType: document.getElementById('shakhe-type').value,
      mukhashikshakPhone: personPhone(bearers.mukhashikshak),
      mukhashikshakName: (bearers.mukhashikshak && bearers.mukhashikshak.name) || '',
      karyavahaPhone: personPhone(bearers.karyavaha),
      karyavahaName: (bearers.karyavaha && bearers.karyavaha.name) || '',
      shakhaPalakaPhone: personPhone(bearers.palaka),
      shakhaPalakaName: (bearers.palaka && bearers.palaka.name) || '',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    logoutLocal();
    showVaradiGate();
    return;
  }
  if (!res.ok) {
    formError.textContent =
      data.error || (editing ? 'ಶಾಖೆ ಉಳಿಸಲಾಗಲಿಲ್ಲ/Could not save Shakhe' : 'ಶಾಖೆ ರಚಿಸಲಾಗಲಿಲ್ಲ/Could not create Shakhe');
    formError.classList.remove('hidden');
    refreshSubmit();
    return;
  }
  shakheForm.classList.add('hidden');
  successPanel.classList.remove('hidden');
});

let confirmPhone = '';
let linkedShakhe = null;
let locationConfirmed = false;
let map = null;
let marker = null;
let viewMap = null;
let viewMarker = null;
let awaitingGps = false;
let gpsLocateSeq = 0;
let checksBuilt = false;

function todayIst() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function formatDateDisplay(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso || '';
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function programCheckHtml(item, picked, disabled) {
  const on = picked.has(item.id) ? ' checked' : '';
  const lock = disabled ? ' disabled' : '';
  return `<label class="choice"><input type="checkbox" value="${escapeHtml(item.id)}"${on}${lock}><span class="check-label"><span class="action-kn">${escapeHtml(
    item.kn
  )}</span><span class="action-en">${escapeHtml(item.en)}</span></span></label>`;
}

function savedProgramFold(legend, ids, catalog, extrasHtml) {
  const picked = new Set(ids || []);
  const checks = catalog.map((item) => programCheckHtml(item, picked, true)).join('');
  return (
    `<details class="program-fold"><summary>${legend}</summary>` +
    `<div class="check-grid">${checks}</div>` +
    (extrasHtml || '') +
    `</details>`
  );
}

function kv(label, value) {
  return `<div class="kv"><dt>${label}</dt><dd>${escapeHtml(value == null || value === '' ? '—' : value)}</dd></div>`;
}

function shakheSummaryHtml(s) {
  return (
    kv('ಶಾಖೆ/Shakhe', s.name) +
    kv('ವಿಭಾಗ/Vibhag', s.vibhag && s.vibhag.name) +
    kv('ಭಾಗ/Bhag', s.bhag && s.bhag.name) +
    kv('ನಗರ/Nagara', s.nagar && s.nagar.name) +
    kv('ವಸತಿ/Vasati', s.vasati && s.vasati.name) +
    kv('ಉಪವಸತಿ/Upavasati', s.upavasati && s.upavasati.name) +
    kv('ಸಮಯ ವಿಭಾಗ/Timing', TIMING_LABEL[s.timing] || s.timing) +
    kv('ಸಮಯ/Time', s.time) +
    kv('ಪ್ರಕಾರ/Type', TYPE_LABEL[s.shakheType] || s.shakheType) +
    kv('ಮುಖಶಿಕ್ಷಕ/Mukhashikshak', personCell(s.mukhashikshakName, s.mukhashikshakPhone)) +
    kv('ಕಾರ್ಯವಾಹ/Karyavaha', personCell(s.karyavahaName, s.karyavahaPhone)) +
    kv('ಶಾಖಾ ಪಾಲಕ/Shakha palaka', personCell(s.shakhaPalakaName, s.shakhaPalakaPhone))
  );
}

function ensureViewMap(lat, lng) {
  if (!window.L) {
    document.getElementById('view-coords').textContent =
      'ನಕ್ಷೆ ಲೋಡ್ ಆಗಲಿಲ್ಲ. ರಿಫ್ರೆಶ್ ಮಾಡಿ/Map failed to load. Refresh and try again.';
    return;
  }
  const center = [lat, lng];
  if (!viewMap) {
    viewMap = L.map('view-map').setView(center, 16);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(viewMap);
    viewMarker = L.marker(center).addTo(viewMap);
  } else {
    viewMap.setView(center, 16);
    viewMarker.setLatLng(center);
  }
  setTimeout(() => viewMap.invalidateSize(), 0);
  setTimeout(() => viewMap.invalidateSize(), 250);
}

async function openShakheView(id) {
  const errorEl = document.getElementById('view-shakhe-error');
  const fields = document.getElementById('view-shakhe-fields');
  const place = document.getElementById('view-shakhe-place');
  const pending = document.getElementById('view-shakhe-pending');
  errorEl.classList.add('hidden');
  fields.innerHTML = '';
  place.classList.add('hidden');
  pending.classList.add('hidden');
  showScreen(viewShakheView);
  const res = await fetch(`/api/shakhe/${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    logoutLocal();
    showVaradiGate();
    return;
  }
  if (!res.ok) {
    errorEl.textContent = data.error || 'ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load';
    errorEl.classList.remove('hidden');
    return;
  }
  fields.innerHTML = shakheSummaryHtml(data);
  const loc = data.location || {};
  const hasPlace =
    data.setupComplete && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng));
  if (hasPlace) {
    document.getElementById('view-stana-fields').innerHTML = kv('ಸ್ಥಾನದ ಹೆಸರು/Sthana name', data.stanaName);
    const lat = Number(loc.lat);
    const lng = Number(loc.lng);
    const coords = document.getElementById('view-coords');
    coords.innerHTML = `<a class="num-link" href="${escapeHtml(mapsUrl(lat, lng))}" target="_blank" rel="noopener noreferrer">${escapeHtml(
      `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    )}</a>`;
    place.classList.remove('hidden');
    ensureViewMap(Number(loc.lat), Number(loc.lng));
  } else {
    pending.classList.remove('hidden');
  }
}

function bindDigitField(el, maxLen) {
  if (!el) return;
  el.addEventListener('input', () => {
    el.value = String(el.value || '').replace(/\D/g, '').slice(0, maxLen);
  });
}

function countVal(id) {
  const raw = document.getElementById(id).value.trim();
  if (raw === '') return null;
  if (!/^\d+$/.test(raw)) return null;
  return Number(raw);
}

function openLookup(opts) {
  const reset = !opts || opts.reset !== false;
  document.getElementById('lookup-error').classList.add('hidden');
  document.getElementById('lookup-results').innerHTML = '';
  if (reset) document.getElementById('lookup-phone').value = '';
  showScreen(lookupView);
}

function pinLatLng() {
  if (!marker) return null;
  const { lat, lng } = marker.getLatLng();
  return { lat, lng };
}

function updateCoordsHint() {
  const pos = pinLatLng();
  if (!pos) return;
  document.getElementById('setup-coords').textContent = locationConfirmed
    ? `ಸ್ಥಳ ಖಚಿತಪಟ್ಟಿದೆ/Location confirmed: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`
    : `ಅಕ್ಷಾಂಶ/Latitude ${pos.lat.toFixed(6)}, ರೇಖಾಂಶ/Longitude ${pos.lng.toFixed(6)} — ಪಿನ್ ಎಳೆಯಿರಿ, ನಂತರ ಖಚಿತಪಡಿಸಿ/drag the pin, then confirm`;
}

function setLocationLocked(locked) {
  locationConfirmed = locked;
  document.getElementById('setup-address').disabled = locked;
  document.getElementById('confirm-location').classList.toggle('hidden', locked);
  document.getElementById('edit-location').classList.toggle('hidden', !locked);
  document.getElementById('location-locked').classList.toggle('hidden', !locked);
  document.getElementById('utsava-map-wrap').classList.toggle('is-locked', locked);
  if (marker) {
    if (locked) marker.dragging.disable();
    else marker.dragging.enable();
  }
  updateCoordsHint();
}

function confirmLocation() {
  const pos = pinLatLng();
  if (!pos) return;
  document.getElementById('setup-lat').value = pos.lat.toFixed(6);
  document.getElementById('setup-lng').value = pos.lng.toFixed(6);
  document.getElementById('setup-address-results').innerHTML = '';
  setLocationLocked(true);
}

function editLocation() {
  document.getElementById('setup-lat').value = '';
  document.getElementById('setup-lng').value = '';
  awaitingGps = false;
  setLocationLocked(false);
}

function refreshMapSize() {
  if (!map) return;
  setTimeout(() => map.invalidateSize(), 0);
  setTimeout(() => map.invalidateSize(), 250);
}

function ensureMap(lat, lng, zoom) {
  if (!window.L) {
    document.getElementById('setup-coords').textContent =
      'ನಕ್ಷೆ ಲೋಡ್ ಆಗಲಿಲ್ಲ. ರಿಫ್ರೆಶ್ ಮಾಡಿ/Map failed to load. Refresh and try again.';
    return;
  }
  const center = [lat, lng];
  if (!map) {
    map = L.map('utsava-map').setView(center, zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    marker = L.marker(center, { draggable: !locationConfirmed }).addTo(map);
    marker.on('dragend', () => {
      if (locationConfirmed) return;
      awaitingGps = false;
      updateCoordsHint();
    });
    map.on('click', (e) => {
      if (locationConfirmed) return;
      awaitingGps = false;
      marker.setLatLng(e.latlng);
      updateCoordsHint();
    });
  } else {
    map.setView(center, zoom);
    marker.setLatLng(center);
  }
  updateCoordsHint();
  refreshMapSize();
}

function goToPlace(place) {
  if (locationConfirmed) return;
  awaitingGps = false;
  document.getElementById('setup-address').value = place.label;
  document.getElementById('setup-address-results').innerHTML = '';
  ensureMap(place.lat, place.lng, 17);
}

function centerMapFromGps() {
  if (locationConfirmed) return;
  if (!navigator.geolocation) {
    ensureMap(MAP_DEFAULT[0], MAP_DEFAULT[1], 12);
    return;
  }
  const seq = ++gpsLocateSeq;
  awaitingGps = true;
  document.getElementById('setup-coords').textContent =
    'GPS ನಿಂದ ಸ್ಥಳ ಪಡೆಯಲಾಗುತ್ತಿದೆ…/Getting live location from GPS…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (seq !== gpsLocateSeq || !awaitingGps || locationConfirmed) return;
      awaitingGps = false;
      ensureMap(pos.coords.latitude, pos.coords.longitude, 16);
    },
    () => {
      if (seq !== gpsLocateSeq || !awaitingGps) return;
      awaitingGps = false;
      ensureMap(MAP_DEFAULT[0], MAP_DEFAULT[1], 12);
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
  );
}

async function openSetup(shakhe) {
  linkedShakhe = shakhe;
  document.getElementById('setup-error').classList.add('hidden');
  document.getElementById('setup-linked').textContent = shakhe.name || '';
  document.getElementById('setup-details').innerHTML = shakheSummaryHtml(shakhe);
  document.getElementById('setup-stana-name').value = shakhe.stanaName || '';
  document.getElementById('setup-address').value = '';
  document.getElementById('setup-address-results').innerHTML = '';
  document.getElementById('setup-lat').value = '';
  document.getElementById('setup-lng').value = '';
  setLocationLocked(false);
  showScreen(setupView);
  const loc = shakhe.location || {};
  if (Number.isFinite(loc.lat) && Number.isFinite(loc.lng) && loc.lat != null && loc.lng != null) {
    ensureMap(loc.lat, loc.lng, 16);
  } else {
    ensureMap(MAP_DEFAULT[0], MAP_DEFAULT[1], 12);
    centerMapFromGps();
  }
}

const programPicked = {
  boudhik: new Set(),
  sharirik: new Set(),
};

function programCatalog(name) {
  return name === 'sharirik' ? SHARIRIK_ITEMS : BOUDHIK_ITEMS;
}

function renderProgramChecks(name) {
  const box = document.getElementById(`${name}-checks`);
  if (!box) return;
  const picked = programPicked[name];
  if (box.dataset.built === '1') {
    box.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = picked.has(cb.value);
    });
    return;
  }
  box.dataset.built = '1';
  box.innerHTML = programCatalog(name)
    .map((item) => programCheckHtml(item, picked, false))
    .join('');
  box.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      if (cb.checked) programPicked[name].add(cb.value);
      else programPicked[name].delete(cb.value);
      if (name === 'boudhik') syncBoudhikExtras();
      else syncSharirikExtras();
    });
  });
}

function fillChecks() {
  renderProgramChecks('boudhik');
  renderProgramChecks('sharirik');
}

function shakhePathLine(s) {
  return [s.vibhag, s.bhag, s.nagar, s.vasati, s.upavasati]
    .map((part) => part && part.name)
    .filter(Boolean)
    .join(' → ');
}

function shakheTitleLine(s) {
  const upa = s.upavasati && s.upavasati.name ? s.upavasati.name : '';
  return upa ? `${s.name} · ${upa}` : s.name || '';
}

function setDateChrome(step) {
  const picker = document.getElementById('upasthiti-date-picker-wrap');
  const bold = document.getElementById('upasthiti-date-bold');
  if (picker) picker.classList.toggle('hidden', step === 2);
  if (bold) bold.classList.remove('hidden');
}

function setDailyStep(step) {
  document.getElementById('upasthiti-step-1').classList.toggle('hidden', step !== 1);
  document.getElementById('upasthiti-step-2').classList.toggle('hidden', step !== 2);
  document.getElementById('upasthiti-step-next').classList.toggle('hidden', step !== 1);
  document.getElementById('upasthiti-step-back').classList.toggle('hidden', step !== 2);
  document.getElementById('upasthiti-submit').classList.toggle('hidden', step !== 2);
  setDateChrome(step);
}

function selectedChecks(name) {
  return [...(programPicked[name] || [])];
}

function setChecks(name, values) {
  programPicked[name] = new Set(values || []);
  renderProgramChecks(name);
}

function syncItara(name, wrapId) {
  const on = selectedChecks(name).includes('itara');
  document.getElementById(wrapId).classList.toggle('hidden', !on);
  if (!on) document.getElementById(wrapId.replace('-wrap', '')).value = '';
}

function syncBoudhikExtras() {
  const picked = new Set(selectedChecks('boudhik'));
  const toggle = (id, on, clear) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', !on);
    if (!on && clear) clear();
  };
  toggle('sanna-kathe-wrap', picked.has('sannaKathe'), () => {
    document.getElementById('sanna-kathe-text').value = '';
  });
  toggle('deergha-kathe-wrap', picked.has('deerghaKathe'), () => {
    document.getElementById('deergha-kathe-text').value = '';
  });
  toggle('boudhik-speaker-block', picked.has('boudhik'), () => {
    resetBearer('boudhikSpeaker', 'boudhik-speaker-block');
  });
  toggle('charche-speaker-block', picked.has('charche'), () => {
    resetBearer('charcheSpeaker', 'charche-speaker-block');
  });
  syncItara('boudhik', 'boudhik-itara-wrap');
}

function syncSharirikExtras() {
  syncItara('sharirik', 'sharirik-itara-wrap');
}

function personSnapPayload(person) {
  if (!person) return null;
  return { personId: person.personId || null, name: person.name || '', phone: person.phone || '' };
}

function personSnapLine(person) {
  if (!person) return '';
  const name = person.name || '';
  const phone = person.phone || '';
  if (name && phone) return `${name} — ${phone}`;
  return name || phone || '';
}

function refreshTotal() {
  const taruna = countVal('count-taruna') || 0;
  const balaka = countVal('count-balaka') || 0;
  document.getElementById('count-total').textContent = String(taruna + balaka);
}

function dailyComplete() {
  return (
    countVal('count-taruna') !== null &&
    countVal('count-balaka') !== null &&
    countVal('count-shishu') !== null &&
    countVal('count-mata') !== null &&
    phoneOk(personPhone(bearers.pravasi), true) &&
    countVal('count-manegalu') !== null &&
    countVal('count-vyaktigalu') !== null
  );
}

function refreshDailySubmit() {
  const ready = dailyComplete();
  document.getElementById('upasthiti-step-next').disabled = !ready;
  document.getElementById('upasthiti-submit').disabled = !ready;
}

function resetDailyForm() {
  ['count-taruna', 'count-balaka', 'count-shishu', 'count-mata', 'count-manegalu', 'count-vyaktigalu', 'boudhik-itara', 'sharirik-itara', 'seva-text', 'sanna-kathe-text', 'deergha-kathe-text'].forEach(
    (id) => {
      document.getElementById(id).value = '';
    }
  );
  setChecks('boudhik', []);
  setChecks('sharirik', []);
  resetBearer('pravasi', 'pravasi-block');
  resetBearer('boudhikSpeaker', 'boudhik-speaker-block');
  resetBearer('charcheSpeaker', 'charche-speaker-block');
  syncBoudhikExtras();
  syncSharirikExtras();
  refreshTotal();
  document.getElementById('upasthiti-success').classList.add('hidden');
  document.getElementById('upasthiti-error').classList.add('hidden');
  setDailyStep(1);
  refreshDailySubmit();
}

function setUpasthitiDate(iso) {
  const dateEl = document.getElementById('upasthiti-date');
  const bold = document.getElementById('upasthiti-date-bold');
  const heading = document.getElementById('upasthiti-heading');
  const today = todayIst();
  dateEl.max = today;
  dateEl.value = iso;
  if (bold) bold.textContent = `ದಿನಾಂಕ/Date ${formatDateDisplay(iso)}`;
  if (heading) {
    heading.textContent =
      iso === today ? 'ಇಂದಿನ ಶಾಖಾ ಉಪಸ್ಥಿತಿ/Indina Shakha Upasthiti' : 'ಶಾಖಾ ಉಪಸ್ಥಿತಿ/Shakha Upasthiti';
  }
}

function viewBlock(legend, inner) {
  return `<fieldset class="stana-block"><legend>${legend}</legend>${inner}</fieldset>`;
}

function setSavedStep(step) {
  const s1 = document.getElementById('saved-step-1');
  const s2 = document.getElementById('saved-step-2');
  if (s1) s1.classList.toggle('hidden', step !== 1);
  if (s2) s2.classList.toggle('hidden', step !== 2);
  document.getElementById('saved-step-next').classList.toggle('hidden', step !== 1);
  document.getElementById('saved-step-back').classList.toggle('hidden', step !== 2);
  document.getElementById('upasthiti-edit').classList.toggle('hidden', step !== 2);
  setDateChrome(step);
}

function showSavedUpasthiti(entry, opts) {
  const dateIso = (entry && entry.date) || document.getElementById('upasthiti-date').value || todayIst();
  setUpasthitiDate(dateIso);

  const pravasi = personCell(
    entry.pravasiName || (entry.pravasiPerson && entry.pravasiPerson.name),
    entry.pravasiPhone || (entry.pravasiPerson && entry.pravasiPerson.phone)
  );
  const counts =
    `<div class="view-counts">` +
    kv('ತರುಣ/Taruna', entry.taruna) +
    kv('ಬಾಲಕ/Balaka', entry.balaka) +
    kv('ಶಿಶು/Shishu', entry.shishu) +
    kv('ಮಾತಾ-ಭಗಿನಿ/Mata Bhagini', entry.mataBhagi) +
    `</div>` +
    `<p class="total-line">ಒಟ್ಟು/Total <strong>${escapeHtml(entry.total)}</strong></p>` +
    kv('ಉಪಸ್ಥಿತ ಪ್ರವಾಸಿ ಕಾರ್ಯಕರ್ತರು/Upasthitha pravasi karyakartharu', pravasi) +
    kv('ಒಟ್ಟು ಸಂಪರ್ಕಿತ ಮನೆಗಳು/Ottu samparkitha manegalu', entry.samparkitaManegalu) +
    kv('ಒಟ್ಟು ಸಂಪರ್ಕಿತ ವ್ಯಕ್ತಿಗಳು/Ottu samparkita vyaktigalu', entry.samparkitaVyaktigalu);

  const boudhikExtras =
    (entry.sannaKatheText ? kv('ಸಣ್ಣ ಕಥೆ/Sanna Kathe', entry.sannaKatheText) : '') +
    (entry.deerghaKatheText ? kv('ದೀರ್ಘ ಕಥೆ/Deergha Kathe', entry.deerghaKatheText) : '') +
    (personSnapLine(entry.boudhikPerson)
      ? kv('ಬೌದ್ಧಿಕ್/Boudhik', personCell(entry.boudhikPerson.name, entry.boudhikPerson.phone))
      : '') +
    (personSnapLine(entry.charchePerson)
      ? kv('ಚರ್ಚೆ/Charche', personCell(entry.charchePerson.name, entry.charchePerson.phone))
      : '') +
    (entry.boudhikItara ? kv('ಇತರ/Itara', entry.boudhikItara) : '');
  const sharirikExtras = entry.sharirikItara ? kv('ಇತರ/Itara', entry.sharirikItara) : '';
  const sevaValue = entry.seva ? escapeHtml(entry.seva) : '';

  document.getElementById('upasthiti-saved-fields-1').innerHTML = viewBlock('ಉಪಸ್ಥಿತಿ/Upasthiti', counts);
  document.getElementById('upasthiti-saved-fields-2').innerHTML =
    `<fieldset class="stana-block"><legend>ಶಾಖೆಯಲ್ಲಿ ನಡೆದ ಅಷ್ಟಬಿಂದು/Ashtabindu done in shakhe</legend>` +
    savedProgramFold(
      'ಇಂದು ನಡೆದ ಬೌದ್ಧಿಕ್ ಕಾರ್ಯಕ್ರಮ/Indu Nadeda Boudhik Karyakrama',
      entry.boudhik,
      BOUDHIK_ITEMS,
      boudhikExtras
    ) +
    savedProgramFold(
      'ಇಂದು ನಡೆದ ಶಾರೀರಿಕ ಕಾರ್ಯಕ್ರಮ/Indu Nadeda Sharirik Karyakrama',
      entry.sharirik,
      SHARIRIK_ITEMS,
      sharirikExtras
    ) +
    `<div class="field"><label>ಇಂದು ನಡೆದ ಸೇವಾ ಕಾರ್ಯಕ್ರಮ/Indu Nadeda Seva Karyakrama</label>` +
    `<input type="text" readonly value="${sevaValue}" placeholder="—"></div>` +
    `</fieldset>`;

  document.getElementById('upasthiti-saved-view').classList.remove('hidden');
  document.getElementById('upasthiti-form').classList.add('hidden');
  setSavedStep(1);

  const success = document.getElementById('upasthiti-success');
  if (opts && opts.submitted) {
    const shakheName = (linkedShakhe && linkedShakhe.name) || (entry.shakhe && entry.shakhe.name) || '';
    document.getElementById('upasthiti-success-detail').textContent = `${shakheName} · ${formatDateDisplay(dateIso)}`;
    success.classList.remove('hidden');
  } else {
    success.classList.add('hidden');
  }
}

function showDailyForm() {
  document.getElementById('upasthiti-saved-view').classList.add('hidden');
  document.getElementById('upasthiti-success').classList.add('hidden');
  document.getElementById('upasthiti-form').classList.remove('hidden');
  setDailyStep(1);
  refreshDailySubmit();
}

function fillDaily(entry) {
  if (!entry) return;
  document.getElementById('count-taruna').value = String(entry.taruna);
  document.getElementById('count-balaka').value = String(entry.balaka);
  document.getElementById('count-shishu').value = String(entry.shishu);
  document.getElementById('count-mata').value = String(entry.mataBhagi);
  const pravasi = entry.pravasiPerson || {
    name: entry.pravasiName,
    phone: entry.pravasiPhone,
  };
  if (pravasi && (pravasi.phone || pravasi.name)) {
    selectBearer('pravasi', 'pravasi-block', pravasi);
  } else {
    resetBearer('pravasi', 'pravasi-block');
  }
  document.getElementById('count-manegalu').value =
    entry.samparkitaManegalu == null ? '' : String(entry.samparkitaManegalu);
  document.getElementById('count-vyaktigalu').value =
    entry.samparkitaVyaktigalu == null ? '' : String(entry.samparkitaVyaktigalu);
  setChecks('boudhik', entry.boudhik);
  setChecks('sharirik', entry.sharirik);
  document.getElementById('sanna-kathe-text').value = entry.sannaKatheText || '';
  document.getElementById('deergha-kathe-text').value = entry.deerghaKatheText || '';
  document.getElementById('boudhik-itara').value = entry.boudhikItara || '';
  document.getElementById('sharirik-itara').value = entry.sharirikItara || '';
  document.getElementById('seva-text').value = entry.seva || '';
  if (entry.boudhikPerson && (entry.boudhikPerson.phone || entry.boudhikPerson.name)) {
    selectBearer('boudhikSpeaker', 'boudhik-speaker-block', entry.boudhikPerson);
  } else {
    resetBearer('boudhikSpeaker', 'boudhik-speaker-block');
  }
  if (entry.charchePerson && (entry.charchePerson.phone || entry.charchePerson.name)) {
    selectBearer('charcheSpeaker', 'charche-speaker-block', entry.charchePerson);
  } else {
    resetBearer('charcheSpeaker', 'charche-speaker-block');
  }
  syncBoudhikExtras();
  syncSharirikExtras();
  refreshTotal();
  refreshDailySubmit();
}

async function loadDailyForDate(date) {
  resetDailyForm();
  setUpasthitiDate(date);
  const res = await fetch(
    `/api/upasthiti?shakheId=${encodeURIComponent(linkedShakhe.id)}&confirmPhone=${encodeURIComponent(
      confirmPhone
    )}&date=${encodeURIComponent(date)}`
  );
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    openSetup(data.shakhe || linkedShakhe);
    return;
  }
  if (!res.ok) {
    showDailyForm();
    document.getElementById('upasthiti-error').textContent = data.error || 'ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load';
    document.getElementById('upasthiti-error').classList.remove('hidden');
    return;
  }
  if (data.upasthiti) {
    fillDaily(data.upasthiti);
    showSavedUpasthiti(data.upasthiti);
    return;
  }
  showDailyForm();
}

async function openDaily(shakhe) {
  linkedShakhe = shakhe;
  if (!checksBuilt) {
    fillChecks();
    checksBuilt = true;
  }
  document.getElementById('upasthiti-path').textContent = shakhePathLine(shakhe);
  document.getElementById('upasthiti-linked').textContent = shakheTitleLine(shakhe);
  document.getElementById('upasthiti-saved-view').classList.add('hidden');
  document.getElementById('upasthiti-form').classList.add('hidden');
  showScreen(upasthitiView);
  await loadDailyForDate(todayIst());
}

async function enterShakhe(shakhe) {
  linkedShakhe = shakhe;
  if (!shakhe.setupComplete) {
    await openSetup(shakhe);
    return;
  }
  await openDaily(shakhe);
}

document.getElementById('lookup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('lookup-error');
  const results = document.getElementById('lookup-results');
  const phone = document.getElementById('lookup-phone').value.replace(/\D/g, '');
  errorEl.classList.add('hidden');
  results.innerHTML = '';
  if (phone.length < 6) {
    errorEl.textContent = 'ಕನಿಷ್ಠ 6 ಅಂಕಿ ನಮೂದಿಸಿ/Enter at least 6 digits';
    errorEl.classList.remove('hidden');
    return;
  }
  confirmPhone = phone;
  const res = await fetch(`/api/shakhe/by-phone?phone=${encodeURIComponent(phone)}`);
  const data = await res.json().catch(() => ({}));
  const list = data.shakhes || [];
  if (!list.length) {
    results.innerHTML = '<li class="no-match">ಶಾಖೆ ಸಿಗಲಿಲ್ಲ/No shakhe for this phone.</li>';
    return;
  }
  if (list.length === 1) {
    enterShakhe(list[0]);
    return;
  }
  list.forEach((s) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    const place = [s.upavasati && s.upavasati.name, s.vasati && s.vasati.name, TIMING_LABEL[s.timing] || s.timing]
      .filter(Boolean)
      .join(' · ');
    btn.textContent = place ? `${s.name} — ${place}` : s.name;
    btn.addEventListener('click', () => enterShakhe(s));
    li.appendChild(btn);
    results.appendChild(li);
  });
});

{
  const addressInput = document.getElementById('setup-address');
  const addressResults = document.getElementById('setup-address-results');
  let addressDebounce;
  document.getElementById('confirm-location').addEventListener('click', confirmLocation);
  document.getElementById('edit-location').addEventListener('click', editLocation);
  addressInput.addEventListener('input', () => {
    if (locationConfirmed) return;
    clearTimeout(addressDebounce);
    const q = addressInput.value.trim();
    addressResults.innerHTML = '';
    if (q.length < 3) return;
    addressDebounce = setTimeout(async () => {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const places = await res.json();
      addressResults.innerHTML = '';
      if (!res.ok || !Array.isArray(places) || places.length === 0) {
        addressResults.innerHTML = '<li class="no-match">ವಿಳಾಸ ಸಿಗಲಿಲ್ಲ/No matching address.</li>';
        return;
      }
      places.forEach((place) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = place.label;
        btn.addEventListener('click', () => goToPlace(place));
        li.appendChild(btn);
        addressResults.appendChild(li);
      });
    }, 350);
  });
}

document.getElementById('setup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('setup-error');
  errorEl.classList.add('hidden');
  const stana = document.getElementById('setup-stana-name').value.trim();
  if (stana.length < 5 || stana.length > 15) {
    errorEl.textContent = 'ಸ್ಥಾನದ ಹೆಸರು 5 ರಿಂದ 15 ಅಕ್ಷರ/Sthana name must be 5 to 15 characters';
    errorEl.classList.remove('hidden');
    return;
  }
  if (!locationConfirmed) {
    errorEl.textContent = 'ಸ್ಥಳ ಖಚಿತಪಡಿಸಿ/Confirm location';
    errorEl.classList.remove('hidden');
    return;
  }
  const lat = Number(document.getElementById('setup-lat').value);
  const lng = Number(document.getElementById('setup-lng').value);
  const res = await fetch(`/api/shakhe/${encodeURIComponent(linkedShakhe.id)}/setup`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      confirmPhone,
      stanaName: stana,
      location: { lat, lng },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    errorEl.textContent = data.error || 'ಉಳಿಸಲಾಗಲಿಲ್ಲ/Could not save';
    errorEl.classList.remove('hidden');
    return;
  }
  await openDaily(data);
});

['count-taruna', 'count-balaka', 'count-shishu', 'count-mata', 'count-manegalu', 'count-vyaktigalu'].forEach((id) => {
  bindDigitField(document.getElementById(id), 5);
  document.getElementById(id).addEventListener('input', () => {
    refreshTotal();
    refreshDailySubmit();
  });
});
bindDigitField(document.getElementById('lookup-phone'), 10);

document.getElementById('upasthiti-step-next').addEventListener('click', () => {
  if (!dailyComplete()) {
    refreshDailySubmit();
    return;
  }
  setDailyStep(2);
});
document.getElementById('upasthiti-step-back').addEventListener('click', () => setDailyStep(1));

document.getElementById('upasthiti-date-bold').addEventListener('click', () => {
  const picker = document.getElementById('upasthiti-date-picker-wrap');
  if (picker && picker.classList.contains('hidden')) return;
  const dateEl = document.getElementById('upasthiti-date');
  if (dateEl && typeof dateEl.showPicker === 'function') dateEl.showPicker();
  else if (dateEl) dateEl.focus();
});

document.getElementById('upasthiti-date').addEventListener('change', () => {
  const date = document.getElementById('upasthiti-date').value;
  if (!date || !linkedShakhe) return;
  loadDailyForDate(date);
});

document.getElementById('saved-step-next').addEventListener('click', () => setSavedStep(2));
document.getElementById('saved-step-back').addEventListener('click', () => setSavedStep(1));
document.getElementById('upasthiti-edit').addEventListener('click', () => {
  showDailyForm();
});

document.getElementById('upasthiti-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('upasthiti-error');
  const submitBtn = document.getElementById('upasthiti-submit');
  errorEl.classList.add('hidden');
  if (!dailyComplete()) {
    refreshDailySubmit();
    return;
  }
  submitBtn.disabled = true;
  const res = await fetch('/api/upasthiti', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shakheId: linkedShakhe.id,
      confirmPhone,
      date: document.getElementById('upasthiti-date').value || todayIst(),
      taruna: countVal('count-taruna'),
      balaka: countVal('count-balaka'),
      shishu: countVal('count-shishu'),
      mataBhagi: countVal('count-mata'),
      pravasiPerson: personSnapPayload(bearers.pravasi),
      pravasiPhone: personPhone(bearers.pravasi),
      pravasiName: (bearers.pravasi && bearers.pravasi.name) || '',
      samparkitaManegalu: countVal('count-manegalu'),
      samparkitaVyaktigalu: countVal('count-vyaktigalu'),
      boudhik: selectedChecks('boudhik'),
      sannaKatheText: document.getElementById('sanna-kathe-text').value,
      deerghaKatheText: document.getElementById('deergha-kathe-text').value,
      boudhikPerson: personSnapPayload(bearers.boudhikSpeaker),
      charchePerson: personSnapPayload(bearers.charcheSpeaker),
      boudhikItara: document.getElementById('boudhik-itara').value,
      sharirik: selectedChecks('sharirik'),
      sharirikItara: document.getElementById('sharirik-itara').value,
      seva: document.getElementById('seva-text').value,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    errorEl.textContent = data.error || 'ಉಪಸ್ಥಿತಿ ಉಳಿಸಲಾಗಲಿಲ್ಲ/Could not save Upasthiti';
    errorEl.classList.remove('hidden');
    refreshDailySubmit();
    return;
  }
  fillDaily(data);
  showSavedUpasthiti(data, { submitted: true });
});

(async function boot() {
  try {
    const res = await fetch('/api/varadi/session');
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok && data.level === 'nagara') {
      await openFromSession(data);
      return;
    }
  } catch (_) {}
  showHome();
})();
