const homeView = document.getElementById('home-view');
const formView = document.getElementById('form-view');
const listView = document.getElementById('list-view');
const viewShakheView = document.getElementById('view-shakhe-view');
const varadiGateView = document.getElementById('varadi-gate-view');
const varadiChoiceView = document.getElementById('varadi-choice-view');
const lookupView = document.getElementById('lookup-view');
const setupView = document.getElementById('setup-view');
const shakheVaradiView = document.getElementById('shakhe-varadi-view');
const upasthitiView = document.getElementById('upasthiti-view');
const shakheForm = document.getElementById('shakhe-form');
const formError = document.getElementById('form-error');
const successPanel = document.getElementById('success-panel');
const nagaraOnlyEls = document.querySelectorAll('.nagara-only');
const guestActions = document.getElementById('guest-actions');
const nagaraActions = document.getElementById('nagara-actions');
const nagaraLogoutFoot = document.getElementById('nagara-logout-foot');
const phoneLogoutFoot = document.getElementById('phone-logout-foot');
let currentView = homeView;

const VARADI_MSG_SUPERSEDED_ON_SCREEN =
  'ಈ ಸೆಷನ್‌ನಿಂದ ನಿರ್ಗಮಿಸಲಾಗಿದೆ (ಬೇರೆಡೆ ಲಾಗಿನ್)/Logged out of this session (signed in elsewhere)';
const VARADI_MSG_SUPERSEDED_FROM_HOME =
  'ಬೇರೆ ಸೆಷನ್‌ನಲ್ಲಿ ಲಾಗಿನ್ ಆಗಿದೆ. ಇಲ್ಲಿ ನಿರ್ಗಮಿಸಲಾಗಿದೆ — ಮತ್ತೆ ಲಾಗಿನ್ ಮಾಡಿ/Signed in on another session. Signed out here — please sign in again';
const VARADI_MSG_EXPIRED =
  'ಸೆಷನ್ ಅವಧಿ ಮುಗಿದಿದೆ — ಮತ್ತೆ ಲಾಗಿನ್ ಮಾಡಿ/Session expired — please sign in again';
const PHONE_MSG_SUPERSEDED_ON_SCREEN = VARADI_MSG_SUPERSEDED_ON_SCREEN;
const PHONE_MSG_SUPERSEDED_FROM_HOME = VARADI_MSG_SUPERSEDED_FROM_HOME;
const PHONE_MSG_EXPIRED = VARADI_MSG_EXPIRED;

const SELECT_PLACEHOLDER = 'ಆಯ್ಕೆಮಾಡಿ/Select';
const TIMING_LABEL = {
  prabhat: 'ಪ್ರಭಾತ್/Prabhat',
  sayam: 'ಸಾಯಂ/Sayam',
  ratri: 'ರಾತ್ರಿ/Ratri',
};
const TYPE_LABEL = {
  balaka: 'ಬಾಲಕ/Balaka',
  'Taruna-Vidyarthi': 'ತರುಣ-ವಿದ್ಯಾರ್ಥಿ/Taruna-Vidyarthi',
  'Taruna-Udyogi': 'ತರುಣ-ಉದ್ಯೋಗಿ/Taruna-Udyogi',
  Samyuktha: 'ಸಂಯುಕ್ತ/Samyuktha',
  Proudha: 'ಪ್ರೌಢ/Proudha',
};
const WEEKDAY_LABEL = [
  'ಭಾನುವಾರ/Sunday',
  'ಸೋಮವಾರ/Monday',
  'ಮಂಗಳವಾರ/Tuesday',
  'ಬುಧವಾರ/Wednesday',
  'ಗುರುವಾರ/Thursday',
  'ಶುಕ್ರವಾರ/Friday',
  'ಶನಿವಾರ/Saturday',
];
const BOUDHIK_ITEMS = [
  { id: 'geethe', kn: 'ಗೀತೆ', en: 'Geethe' },
  { id: 'amruthavacha', kn: 'ಅಮೃತವಚನ', en: 'Amruthavacha' },
  { id: 'shloka', kn: 'ಶ್ಲೋಕ', en: 'Shloka' },
  { id: 'panchaga', kn: 'ಪಂಚಾಂಗ', en: 'Panchaga' },
  { id: 'sannaKathe', kn: 'ಸಣ್ಣ ಕಥೆ', en: 'Sanna Kathe' },
  { id: 'deerghaKathe', kn: 'ದೀರ್ಘ ಕಥೆ', en: 'Deergha Kathe' },
  { id: 'boudhik', kn: 'ಬೌದ್ಧಿಕ್', en: 'Boudhik' },
  { id: 'charche', kn: 'ಚರ್ಚೆ', en: 'Charche' },
  { id: 'samacharaSamekhe', kn: 'ಸಮಾಚಾರ ಸಮೀಕ್ಷೆ', en: 'Samachara Sameekshe' },
  { id: 'prathanaAbhyasa', kn: 'ಪ್ರಾರ್ಥನಾ ಅಭ್ಯಾಸ', en: 'Prathana Abhyasa' },
  { id: 'itara', kn: 'ಇತರೆ', en: 'Itara' },
];
const SHARIRIK_ITEMS = [
  { id: 'suryanamaskar', kn: 'ಸೂರ್ಯನಮಸ್ಕಾರ', en: 'Suryanamaskar' },
  { id: 'samata', kn: 'ಸಮತಾ', en: 'Samata' },
  { id: 'sanchalana', kn: 'ಸಂಚಲನ', en: 'Sanchalana' },
  { id: 'danda', kn: 'ದಂಡ', en: 'Danda' },
  { id: 'niyuddha', kn: 'ನಿಯುದ್ಧ', en: 'Niyuddha' },
  { id: 'yeshti', kn: 'ಯಷ್ಟಿ', en: 'Yeshti' },
  { id: 'dandaYuddha', kn: 'ದಂಡ ಯುದ್ಧ', en: 'Danda yuddha' },
  { id: 'padavinyas', kn: 'ಪದವಿನ್ಯಾಸ', en: 'Padavinyas' },
  { id: 'itara', kn: 'ಇತರೆ', en: 'Itara' },
];
const MAP_DEFAULT = [12.9716, 77.5946];
let shakheStep = 1;

function makePlacePicker(ids) {
  const state = {
    map: null,
    marker: null,
    confirmed: false,
    awaitingGps: false,
    gpsSeq: 0,
  };
  function el(name) {
    return document.getElementById(ids[name]);
  }
  function pin() {
    if (!state.marker) return null;
    const { lat, lng } = state.marker.getLatLng();
    return { lat, lng };
  }
  function updateHint() {
    const pos = pin();
    const coords = el('coords');
    if (!coords || !pos) return;
    coords.textContent = state.confirmed
      ? `ಸ್ಥಳ ಖಚಿತಪಟ್ಟಿದೆ/Location confirmed: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`
      : `ಅಕ್ಷಾಂಶ/Latitude ${pos.lat.toFixed(6)}, ರೇಖಾಂಶ/Longitude ${pos.lng.toFixed(6)} — ಪಿನ್ ಎಳೆಯಿರಿ, ನಂತರ ಖಚಿತಪಡಿಸಿ/drag the pin, then confirm`;
  }
  function setLocked(locked) {
    state.confirmed = locked;
    const address = el('address');
    if (address) address.disabled = locked;
    el('confirmBtn').classList.toggle('hidden', locked);
    el('editBtn').classList.toggle('hidden', !locked);
    el('lockedMsg').classList.toggle('hidden', !locked);
    el('wrap').classList.toggle('is-locked', locked);
    if (state.marker) {
      if (locked) state.marker.dragging.disable();
      else state.marker.dragging.enable();
    }
    updateHint();
  }
  function refreshSize() {
    if (!state.map) return;
    setTimeout(() => state.map.invalidateSize(), 0);
    setTimeout(() => state.map.invalidateSize(), 250);
  }
  function ensure(lat, lng, zoom) {
    const coords = el('coords');
    if (!window.L) {
      if (coords) {
        coords.textContent = 'ನಕ್ಷೆ ಲೋಡ್ ಆಗಲಿಲ್ಲ. ರಿಫ್ರೆಶ್ ಮಾಡಿ/Map failed to load. Refresh and try again.';
      }
      return;
    }
    const center = [lat, lng];
    if (!state.map) {
      state.map = L.map(ids.map).setView(center, zoom);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(state.map);
      state.marker = L.marker(center, { draggable: !state.confirmed }).addTo(state.map);
      state.marker.on('dragend', () => {
        if (state.confirmed) return;
        state.awaitingGps = false;
        updateHint();
      });
      state.map.on('click', (e) => {
        if (state.confirmed) return;
        state.awaitingGps = false;
        state.marker.setLatLng(e.latlng);
        updateHint();
      });
    } else {
      state.map.setView(center, zoom);
      state.marker.setLatLng(center);
    }
    updateHint();
    refreshSize();
  }
  function confirm() {
    const pos = pin();
    if (!pos) return;
    el('lat').value = pos.lat.toFixed(6);
    el('lng').value = pos.lng.toFixed(6);
    el('results').innerHTML = '';
    setLocked(true);
    if (typeof refreshSubmit === 'function') refreshSubmit();
  }
  function edit() {
    el('lat').value = '';
    el('lng').value = '';
    state.awaitingGps = false;
    setLocked(false);
    if (typeof refreshSubmit === 'function') refreshSubmit();
  }
  function goToPlace(place) {
    if (state.confirmed) return;
    state.awaitingGps = false;
    el('address').value = place.label;
    el('results').innerHTML = '';
    ensure(place.lat, place.lng, 17);
  }
  function centerFromGps() {
    if (state.confirmed) return;
    if (!navigator.geolocation) {
      ensure(MAP_DEFAULT[0], MAP_DEFAULT[1], 12);
      return;
    }
    const seq = ++state.gpsSeq;
    state.awaitingGps = true;
    el('coords').textContent = 'GPS ನಿಂದ ಸ್ಥಳ ಪಡೆಯಲಾಗುತ್ತಿದೆ…/Getting live location from GPS…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (seq !== state.gpsSeq || !state.awaitingGps || state.confirmed) return;
        state.awaitingGps = false;
        ensure(pos.coords.latitude, pos.coords.longitude, 16);
        if (ids.map === 'shakhe-map' && typeof shakheStep !== 'undefined' && shakheStep === 2) {
          scrollShakheStepIntoView(2);
        }
      },
      () => {
        if (seq !== state.gpsSeq || !state.awaitingGps) return;
        state.awaitingGps = false;
        ensure(MAP_DEFAULT[0], MAP_DEFAULT[1], 12);
        if (ids.map === 'shakhe-map' && typeof shakheStep !== 'undefined' && shakheStep === 2) {
          scrollShakheStepIntoView(2);
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }
  function reset() {
    state.awaitingGps = false;
    const stana = el('stana');
    if (stana) stana.value = '';
    el('address').value = '';
    el('results').innerHTML = '';
    el('lat').value = '';
    el('lng').value = '';
    setLocked(false);
  }
  function bind() {
    el('confirmBtn').addEventListener('click', confirm);
    el('editBtn').addEventListener('click', edit);
    const addressInput = el('address');
    const results = el('results');
    let debounce;
    addressInput.addEventListener('input', () => {
      if (state.confirmed) return;
      clearTimeout(debounce);
      const q = addressInput.value.trim();
      results.innerHTML = '';
      if (q.length < 3) return;
      debounce = setTimeout(async () => {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const places = await res.json();
        results.innerHTML = '';
        if (!res.ok || !Array.isArray(places) || places.length === 0) {
          results.innerHTML = '<li class="no-match">ವಿಳಾಸ ಸಿಗಲಿಲ್ಲ/No matching address.</li>';
          return;
        }
        places.forEach((place) => {
          const li = document.createElement('li');
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = place.label;
          btn.addEventListener('click', () => goToPlace(place));
          li.appendChild(btn);
          results.appendChild(li);
        });
      }, 350);
    });
  }
  return {
    bind,
    reset,
    ensure,
    confirm,
    edit,
    goToPlace,
    centerFromGps,
    refreshSize,
    setLocked,
    isConfirmed: () => state.confirmed,
    coords() {
      const lat = Number(el('lat').value);
      const lng = Number(el('lng').value);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      return pin();
    },
    showExisting(lat, lng) {
      ensure(lat, lng, 16);
      el('lat').value = Number(lat).toFixed(6);
      el('lng').value = Number(lng).toFixed(6);
      setLocked(true);
    },
  };
}

const formPlace = makePlacePicker({
  stana: 'shakhe-stana-name',
  address: 'shakhe-address',
  results: 'shakhe-address-results',
  lat: 'shakhe-lat',
  lng: 'shakhe-lng',
  map: 'shakhe-map',
  wrap: 'shakhe-map-wrap',
  coords: 'shakhe-coords',
  confirmBtn: 'shakhe-confirm-location',
  editBtn: 'shakhe-edit-location',
  lockedMsg: 'shakhe-location-locked',
});
const setupPlace = makePlacePicker({
  stana: 'setup-stana-name',
  address: 'setup-address',
  results: 'setup-address-results',
  lat: 'setup-lat',
  lng: 'setup-lng',
  map: 'utsava-map',
  wrap: 'utsava-map-wrap',
  coords: 'setup-coords',
  confirmBtn: 'confirm-location',
  editBtn: 'edit-location',
  lockedMsg: 'location-locked',
});

let nagaraId = null;
let nagaraName = null;
let nagaraBhagName = null;
let nagaraVibhagName = null;
let varadiPendingCredentials = null;
let varadiLogoutTimer = null;
let phoneLogoutTimer = null;
let phoneSessionActive = false;
let phoneShakhes = [];
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

function updateSignOutFooters(view) {
  if (view) currentView = view;
  const v = currentView;
  const nagaraAuthed = document.documentElement.classList.contains('nagara-authed');
  const onPhoneFlow =
    v === lookupView || v === setupView || v === shakheVaradiView || v === upasthitiView;
  // Nagara sign out only on the nagara home dashboard (not Create/List screens).
  const onNagaraHome = nagaraAuthed && v === homeView;
  if (nagaraLogoutFoot) nagaraLogoutFoot.classList.toggle('hidden', !onNagaraHome);
  if (phoneLogoutFoot) phoneLogoutFoot.classList.toggle('hidden', !(phoneSessionActive && onPhoneFlow));
}

function showScreen(view) {
  [homeView, formView, listView, viewShakheView, varadiGateView, varadiChoiceView, lookupView, setupView, shakheVaradiView, upasthitiView].forEach((v) =>
    v.classList.add('hidden')
  );
  view.classList.remove('hidden');
  updateSignOutFooters(view);
}

function setNagaraAuthed(on) {
  document.documentElement.classList.toggle('nagara-authed', on);
  nagaraOnlyEls.forEach((el) => el.classList.toggle('hidden', !on));
  guestActions.classList.toggle('hidden', on);
  nagaraActions.classList.toggle('hidden', !on);
  updateSignOutFooters();
}

function setPhoneAuthed(on) {
  phoneSessionActive = Boolean(on);
  document.documentElement.classList.toggle('phone-authed', phoneSessionActive);
  updateSignOutFooters();
}

function clearVaradiLogoutTimer() {
  if (varadiLogoutTimer) {
    clearTimeout(varadiLogoutTimer);
    varadiLogoutTimer = null;
  }
}

function clearPhoneLogoutTimer() {
  if (phoneLogoutTimer) {
    clearTimeout(phoneLogoutTimer);
    phoneLogoutTimer = null;
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
    setHomeSessionMessage(VARADI_MSG_EXPIRED);
    showHome();
  }, wait);
}

function armPhoneLogout(ms) {
  clearPhoneLogoutTimer();
  const wait = Number(ms);
  if (!Number.isFinite(wait) || wait <= 0) return;
  phoneLogoutTimer = setTimeout(async () => {
    try {
      await fetch('/api/phone/logout', { method: 'POST' });
    } catch (_) {}
    logoutPhoneLocal();
    setHomeSessionMessage(PHONE_MSG_EXPIRED);
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

function selectedShakheStoreKey(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? `shakhe-phone-selected:v1:${digits}` : '';
}

function saveSelectedShakheId(phone, shakheId) {
  const key = selectedShakheStoreKey(phone);
  if (!key || !shakheId) return;
  try {
    localStorage.setItem(key, String(shakheId));
  } catch (_) {}
}

function loadSelectedShakheId(phone) {
  const key = selectedShakheStoreKey(phone);
  if (!key) return '';
  try {
    return String(localStorage.getItem(key) || '');
  } catch (_) {
    return '';
  }
}

function clearSelectedShakheId(phone) {
  const key = selectedShakheStoreKey(phone);
  if (!key) return;
  try {
    localStorage.removeItem(key);
  } catch (_) {}
}

function resolveSelectedShakhe(list) {
  const rows = Array.isArray(list) ? list : [];
  if (!rows.length) return null;
  if (linkedShakhe && linkedShakhe.id) {
    const current = rows.find((s) => s && s.id === linkedShakhe.id);
    if (current) return current;
  }
  const savedId = loadSelectedShakheId(confirmPhone);
  if (savedId) {
    const saved = rows.find((s) => s && String(s.id) === savedId);
    if (saved) return saved;
  }
  if (rows.length === 1) return rows[0];
  return null;
}

function logoutPhoneLocal() {
  clearPhoneLogoutTimer();
  clearSelectedShakheId(confirmPhone);
  confirmPhone = '';
  phoneShakhes = [];
  linkedShakhe = null;
  setPhoneAuthed(false);
  syncSwitchShakheButtons();
}

function setHomeSessionMessage(message) {
  const el = document.getElementById('home-session-msg');
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.classList.remove('hidden');
  } else {
    el.textContent = '';
    el.classList.add('hidden');
  }
}

async function clearStaleVaradiCookie() {
  try {
    await fetch('/api/varadi/logout', { method: 'POST' });
  } catch (_) {}
}

async function clearStalePhoneCookie() {
  try {
    await fetch('/api/phone/logout', { method: 'POST' });
  } catch (_) {}
}

function bounceIfVaradiAuth(res, data) {
  if (!(res && res.status === 401)) return false;
  if (!document.documentElement.classList.contains('nagara-authed') && !nagaraId) return false;
  const reason = data && data.reason;
  let message = '';
  if (reason === 'superseded') message = VARADI_MSG_SUPERSEDED_ON_SCREEN;
  else if (reason === 'expired') message = VARADI_MSG_EXPIRED;
  clearVaradiLogoutTimer();
  clearStaleVaradiCookie();
  logoutLocal();
  showVaradiGate({ message });
  return true;
}

function bounceIfPhoneAuth(res, data) {
  if (!(res && res.status === 401)) return false;
  const reason = data && data.reason;
  if (reason !== 'superseded' && reason !== 'expired' && reason !== 'invalid') return false;
  if (!phoneSessionActive && !confirmPhone) return false;
  let message = PHONE_MSG_EXPIRED;
  if (reason === 'superseded') message = PHONE_MSG_SUPERSEDED_ON_SCREEN;
  clearPhoneLogoutTimer();
  clearStalePhoneCookie();
  logoutPhoneLocal();
  setHomeSessionMessage(message);
  showHome();
  return true;
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
  setHomeSessionMessage('');
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
bindBearerSearch('boudhik-speaker-block', 'boudhikSpeaker');
bindBearerSearch('charche-speaker-block', 'charcheSpeaker');

let pravasiPeople = [];

function renderPravasiList() {
  const list = document.getElementById('pravasi-selected-list');
  if (!list) return;
  list.innerHTML = '';
  pravasiPeople.forEach((person, idx) => {
    const li = document.createElement('li');
    li.className = 'ob-selected';
    const text = document.createElement('span');
    text.className = 'ob-selected-text';
    text.textContent = personDetailText(person);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ob-clear';
    btn.textContent = 'ತೆಗೆದುಹಾಕಿ/Remove';
    btn.addEventListener('click', () => {
      pravasiPeople.splice(idx, 1);
      renderPravasiList();
      refreshDailySubmit();
    });
    li.appendChild(text);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function addPravasiPerson(person) {
  const phone = personPhone(person);
  if (!phoneOk(phone, false)) return;
  if (pravasiPeople.some((p) => personPhone(p) === phone)) return;
  if (pravasiPeople.length >= 20) return;
  pravasiPeople.push({
    personId: person.personId || null,
    name: person.name || '',
    phone: person.phone || phone,
    responsibility: person.responsibility || '',
    shakhe: person.shakhe || '',
    nagarName: person.nagarName || '',
  });
  renderPravasiList();
}

function resetPravasiPeople() {
  pravasiPeople = [];
  const block = document.getElementById('pravasi-block');
  if (block) {
    const search = block.querySelector('.ob-search');
    if (search) search.value = '';
    const results = block.querySelector('.ob-results');
    if (results) results.innerHTML = '';
  }
  renderPravasiList();
}

function bindPravasiMultiSearch() {
  const block = document.getElementById('pravasi-block');
  if (!block) return;
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
          addPravasiPerson({
            personId: p.personId,
            name: p.name,
            phone: p.phone,
            responsibility: p.responsibility,
            shakhe: p.shakhe,
            nagarName: p.nagarName,
          });
          searchInput.value = '';
          results.innerHTML = '';
          refreshDailySubmit();
        });
        li.appendChild(btn);
        results.appendChild(li);
      });
    }, 300);
  });
}

bindPravasiMultiSearch();

function setFieldError(id, message) {
  const el = document.querySelector(`[data-error-for="${id}"]`);
  const input = document.getElementById(id);
  if (el) el.textContent = message || '';
  if (input) input.classList.toggle('is-invalid', Boolean(message));
}

function hierarchyLocked() {
  return formView.classList.contains('hierarchy-locked');
}

function step1Complete() {
  const placeOk = hierarchyLocked()
    ? true
    : document.getElementById('shakhe-vibhag').value &&
      document.getElementById('shakhe-bhag').value &&
      document.getElementById('shakhe-nagar').value;
  return Boolean(
    placeOk &&
      document.getElementById('shakhe-vasati').value &&
      document.getElementById('shakhe-upavasati').value &&
      document.getElementById('shakhe-name').value.trim() &&
      document.getElementById('shakhe-timing').value &&
      document.getElementById('shakhe-time').value &&
      document.getElementById('shakhe-type').value
  );
}

function step2Complete() {
  const stana = document.getElementById('shakhe-stana-name').value.trim();
  return (
    phoneOk(personPhone(bearers.mukhashikshak), false) &&
    phoneOk(personPhone(bearers.karyavaha), true) &&
    phoneOk(personPhone(bearers.palaka), true) &&
    stana.length >= 5 &&
    stana.length <= 15 &&
    formPlace.isConfirmed()
  );
}

function formComplete() {
  return step1Complete() && step2Complete();
}

function scrollShakheStepIntoView(step) {
  const anchor =
    step === 2
      ? document.getElementById('mukhashikshak-block') || document.getElementById('shakhe-step-2')
      : document.getElementById('shakhe-step-1') || document.getElementById('form-view');
  if (!anchor) return;
  const run = () => anchor.scrollIntoView({ behavior: 'auto', block: 'start' });
  run();
  requestAnimationFrame(run);
  setTimeout(run, 50);
  setTimeout(run, 280);
}

function setShakheStep(step) {
  shakheStep = step;
  document.getElementById('shakhe-step-1').classList.toggle('hidden', step !== 1);
  document.getElementById('shakhe-step-2').classList.toggle('hidden', step !== 2);
  document.getElementById('shakhe-step-next').classList.toggle('hidden', step !== 1);
  document.getElementById('shakhe-step-back').classList.toggle('hidden', step !== 2);
  document.getElementById('shakhe-submit').classList.toggle('hidden', step !== 2);
  if (step === 2) {
    const existing = formPlace.coords();
    if (formPlace.isConfirmed() && existing) {
      formPlace.ensure(existing.lat, existing.lng, 16);
    } else {
      formPlace.ensure(MAP_DEFAULT[0], MAP_DEFAULT[1], 12);
      formPlace.centerFromGps();
    }
  }
  scrollShakheStepIntoView(step);
  refreshSubmit();
}

function refreshSubmit() {
  const next = document.getElementById('shakhe-step-next');
  const submit = document.getElementById('shakhe-submit');
  if (next) next.disabled = !step1Complete();
  if (submit) submit.disabled = !step2Complete();
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
  )}${kv('ಮುಖ್ಯ ಶಿಕ್ಷಕ್/Mukhya Shikshak', personCell(mukhaName, s.mukhashikshakPhone))}${kv(
    'ಕಾರ್ಯವಾಹ/Karyavaha',
    personCell(karyName, s.karyavahaPhone)
  )}${kv('ಶಾಖಾ ಪಾಲಕ್/Shakha palaka', personCell(palakaName, s.shakhaPalakaPhone))}</div>`;
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

const HIERARCHY_CHAIN = [
  { sthara: 'Vibhag', id: 'shakhe-vibhag', next: 'Bhag', wait: 'ಮೊದಲು ವಿಭಾಗ ಆಯ್ಕೆಮಾಡಿ/Select a Vibhag first' },
  { sthara: 'Bhag', id: 'shakhe-bhag', next: 'Nagar', wait: 'ಮೊದಲು ಭಾಗ ಆಯ್ಕೆಮಾಡಿ/Select a Bhag first' },
  { sthara: 'Nagar', id: 'shakhe-nagar', next: 'Vasati', wait: 'ಮೊದಲು ನಗರ ಆಯ್ಕೆಮಾಡಿ/Select a Nagara first' },
  { sthara: 'Vasati', id: 'shakhe-vasati', next: 'Upavasati', wait: 'ಮೊದಲು ವಸತಿ ಆಯ್ಕೆಮಾಡಿ/Select a Vasati first' },
  { sthara: 'Upavasati', id: 'shakhe-upavasati', next: null, wait: '' },
];

function setHierarchyLocked(on) {
  formView.classList.toggle('hierarchy-locked', !!on);
  ['shakhe-vibhag', 'shakhe-bhag', 'shakhe-nagar'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = !!on;
    el.required = !on;
  });
}

function resetPublicHierarchy() {
  const bhag = document.getElementById('shakhe-bhag');
  const nagar = document.getElementById('shakhe-nagar');
  const vasati = document.getElementById('shakhe-vasati');
  const upa = document.getElementById('shakhe-upavasati');
  fillSelect(bhag, [], 'ಮೊದಲು ವಿಭಾಗ ಆಯ್ಕೆಮಾಡಿ/Select a Vibhag first');
  bhag.disabled = true;
  fillSelect(nagar, [], 'ಮೊದಲು ಭಾಗ ಆಯ್ಕೆಮಾಡಿ/Select a Bhag first');
  nagar.disabled = true;
  fillSelect(vasati, [], 'ಮೊದಲು ನಗರ ಆಯ್ಕೆಮಾಡಿ/Select a Nagara first');
  vasati.disabled = true;
  fillSelect(upa, [], 'ಮೊದಲು ವಸತಿ ಆಯ್ಕೆಮಾಡಿ/Select a Vasati first');
  upa.disabled = true;
}

async function loadChildOptions(parentId, childSthara, childSelect, waitLabel) {
  if (!parentId) {
    fillSelect(childSelect, [], waitLabel);
    childSelect.disabled = true;
    return;
  }
  childSelect.innerHTML = '<option value="">ಲೋಡ್ ಆಗುತ್ತಿದೆ/Loading…</option>';
  childSelect.disabled = true;
  const res = await fetch(
    `/api/options?parentId=${encodeURIComponent(parentId)}&sthara=${encodeURIComponent(childSthara)}`
  );
  const options = await res.json().catch(() => []);
  if (!res.ok) {
    fillSelect(childSelect, [], 'ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load');
    return;
  }
  fillSelect(childSelect, options, SELECT_PLACEHOLDER);
  childSelect.disabled = false;
}

function clearBelow(sthara) {
  const start = HIERARCHY_CHAIN.findIndex((l) => l.sthara === sthara);
  if (start < 0) return;
  for (let i = start + 1; i < HIERARCHY_CHAIN.length; i++) {
    const level = HIERARCHY_CHAIN[i];
    const prev = HIERARCHY_CHAIN[i - 1];
    const sel = document.getElementById(level.id);
    fillSelect(sel, [], prev.wait);
    sel.disabled = true;
  }
}

async function loadFormHierarchy() {
  const res = await fetch('/api/form');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    formError.textContent = data.error || 'ಫಾರ್ಮ್ ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load form';
    formError.classList.remove('hidden');
    return null;
  }
  const bySthara = Object.fromEntries((data.levels || []).map((l) => [l.sthara, l]));
  const locked =
    Boolean(nagaraId) &&
    Boolean(bySthara.Nagar && bySthara.Nagar.locked && bySthara.Nagar.value);
  setHierarchyLocked(locked);
  document.getElementById('locked-vibhag').textContent = (bySthara.Vibhag && bySthara.Vibhag.value && bySthara.Vibhag.value.name) || '—';
  document.getElementById('locked-bhag').textContent = (bySthara.Bhag && bySthara.Bhag.value && bySthara.Bhag.value.name) || '—';
  document.getElementById('locked-nagar').textContent = (bySthara.Nagar && bySthara.Nagar.value && bySthara.Nagar.value.name) || '—';
  nagaraVibhagName = (bySthara.Vibhag && bySthara.Vibhag.value && bySthara.Vibhag.value.name) || '';
  nagaraBhagName = (bySthara.Bhag && bySthara.Bhag.value && bySthara.Bhag.value.name) || '';
  lockedIds = {
    vibhagId: bySthara.Vibhag && bySthara.Vibhag.value ? bySthara.Vibhag.value.id : '',
    bhagId: bySthara.Bhag && bySthara.Bhag.value ? bySthara.Bhag.value.id : '',
    nagarId: bySthara.Nagar && bySthara.Nagar.value ? bySthara.Nagar.value.id : nagaraId || '',
  };
  if (!locked) {
    fillSelect(
      document.getElementById('shakhe-vibhag'),
      (bySthara.Vibhag && bySthara.Vibhag.options) || [],
      SELECT_PLACEHOLDER
    );
    document.getElementById('shakhe-vibhag').disabled = false;
    resetPublicHierarchy();
  }
  return bySthara;
}

async function openForm() {
  formMode = 'create';
  editingShakheId = null;
  successPanel.classList.add('hidden');
  shakheForm.classList.remove('hidden');
  formError.classList.add('hidden');
  document.getElementById('form-title').textContent = 'ಶಾಖೆ ರಚಿಸಿ/Create Shakhe';
  document.getElementById('success-title').textContent = 'ಶಾಖೆ ರಚಿಸಲಾಗಿದೆ/Shakhe created';
  document.getElementById('success-path').textContent = '';
  document.getElementById('success-shakhe').textContent = '';
  shakheForm.reset();
  closeUpavasatiExists();
  closePhoneExists();
  resetBearer('mukhashikshak', 'mukhashikshak-block');
  resetBearer('karyavaha', 'karyavaha-block');
  resetBearer('palaka', 'palaka-block');
  formPlace.reset();
  fillSelect(document.getElementById('shakhe-upavasati'), [], 'ಮೊದಲು ವಸತಿ ಆಯ್ಕೆಮಾಡಿ/Select a Vasati first');
  document.getElementById('shakhe-upavasati').disabled = true;
  setShakheStep(1);
  showScreen(formView);

  const bySthara = await loadFormHierarchy();
  if (!bySthara) return;
  if (hierarchyLocked()) {
    const vasati = document.getElementById('shakhe-vasati');
    fillSelect(vasati, (bySthara.Vasati && bySthara.Vasati.options) || [], SELECT_PLACEHOLDER);
    vasati.disabled = false;
  }
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
  document.getElementById('success-title').textContent = 'ಶಾಖೆ ಉಳಿಸಲಾಗಿದೆ/Shakhe saved';
  document.getElementById('success-path').textContent = '';
  document.getElementById('success-shakhe').textContent = '';
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
    setHierarchyLocked(true);
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
    formPlace.reset();
    document.getElementById('shakhe-stana-name').value = row.stanaName || '';
    const loc = row.location || {};
    if (Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng)) && loc.lat != null && loc.lng != null) {
      formPlace.showExisting(Number(loc.lat), Number(loc.lng));
    }
    setShakheStep(1);
    refreshSubmit();
  } finally {
    formFilling = false;
    setFormLoading(false);
  }
}

const listFilters = {
  vasatiId: '',
  upavasatiId: '',
  shakheType: '',
  timing: '',
};

function fillFilterSelect(select, options, selectedValue) {
  if (!select) return;
  const current = selectedValue == null ? select.value : selectedValue;
  select.innerHTML =
    `<option value="">ಎಲ್ಲಾ/All</option>` +
    options
      .map((opt) => {
        const selected = String(opt.id) === String(current) ? ' selected' : '';
        return `<option value="${escapeHtml(String(opt.id))}"${selected}>${escapeHtml(opt.name)}</option>`;
      })
      .join('');
  if (current && !options.some((opt) => String(opt.id) === String(current))) {
    select.value = '';
  } else {
    select.value = current || '';
  }
}

function uniqueEntityOptions(rows, getter) {
  const map = new Map();
  (rows || []).forEach((row) => {
    const item = getter(row);
    if (!item || !item.id) return;
    map.set(String(item.id), { id: String(item.id), name: item.name || String(item.id) });
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

function refreshListFilterOptions() {
  const vasatiEl = document.getElementById('list-filter-vasati');
  const upavasatiEl = document.getElementById('list-filter-upavasati');
  const typeEl = document.getElementById('list-filter-type');
  const timingEl = document.getElementById('list-filter-timing');
  const vasatiOptions = uniqueEntityOptions(listShakhes, (s) => s.vasati);
  fillFilterSelect(vasatiEl, vasatiOptions, listFilters.vasatiId);
  listFilters.vasatiId = vasatiEl ? vasatiEl.value : '';

  const upavasatiSource = listFilters.vasatiId
    ? listShakhes.filter((s) => s.vasati && String(s.vasati.id) === listFilters.vasatiId)
    : listShakhes;
  const upavasatiOptions = uniqueEntityOptions(upavasatiSource, (s) => s.upavasati);
  fillFilterSelect(upavasatiEl, upavasatiOptions, listFilters.upavasatiId);
  listFilters.upavasatiId = upavasatiEl ? upavasatiEl.value : '';

  const typeOptions = Object.keys(TYPE_LABEL).map((id) => ({ id, name: TYPE_LABEL[id] }));
  fillFilterSelect(typeEl, typeOptions, listFilters.shakheType);
  listFilters.shakheType = typeEl ? typeEl.value : '';

  const timingOptions = Object.keys(TIMING_LABEL).map((id) => ({ id, name: TIMING_LABEL[id] }));
  fillFilterSelect(timingEl, timingOptions, listFilters.timing);
  listFilters.timing = timingEl ? timingEl.value : '';
}

function filteredListShakhes() {
  return (listShakhes || []).filter((s) => {
    if (listFilters.vasatiId && !(s.vasati && String(s.vasati.id) === listFilters.vasatiId)) return false;
    if (listFilters.upavasatiId && !(s.upavasati && String(s.upavasati.id) === listFilters.upavasatiId)) {
      return false;
    }
    if (listFilters.shakheType && s.shakheType !== listFilters.shakheType) return false;
    if (listFilters.timing && s.timing !== listFilters.timing) return false;
    return true;
  });
}

function readListFiltersFromDom() {
  listFilters.vasatiId = document.getElementById('list-filter-vasati').value || '';
  listFilters.upavasatiId = document.getElementById('list-filter-upavasati').value || '';
  listFilters.shakheType = document.getElementById('list-filter-type').value || '';
  listFilters.timing = document.getElementById('list-filter-timing').value || '';
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
  if (bounceIfVaradiAuth(res, data)) return;
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
  refreshListFilterOptions();
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

function personDetailHtml(person) {
  if (!person) return escapeHtml('—');
  const name = person.name || '';
  const phone = person.phone || '';
  const responsibility = person.responsibility || '';
  const place = [person.nagarName, person.shakhe].filter(Boolean).join(' · ');
  const title = name && phone ? `${name} — ${phone}` : name || phone || '—';
  let html = `<div class="pravasi-detail-name">${escapeHtml(title)}</div>`;
  if (responsibility) {
    html += `<div class="pravasi-detail-role">${escapeHtml(responsibility)}</div>`;
  }
  if (place) {
    html += `<div class="pravasi-detail-place">${escapeHtml(place)}</div>`;
  }
  return html;
}

function personDetailText(person) {
  if (!person) return '—';
  const name = person.name || '';
  const phone = person.phone || '';
  const responsibility = person.responsibility || '';
  const base = name && phone ? `${name} — ${phone}` : name || phone || '—';
  return responsibility ? `${base} · ${responsibility}` : base;
}

function mapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
}

function stackedLabel(text) {
  const raw = String(text || '');
  const i = raw.indexOf('/');
  if (i < 0) return escapeHtml(raw);
  return (
    `<span class="th-stack"><span class="th-kn">${escapeHtml(raw.slice(0, i))}</span>` +
    `<span class="th-en">${escapeHtml(raw.slice(i + 1))}</span></span>`
  );
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

function shakheListHeadHtml(opts) {
  const withCheck = !!(opts && opts.withCheck);
  const withUnhide = !!(opts && opts.withUnhide);
  const cols = [
    'ಶಾಖೆ/Shakhe',
    'ವಸತಿ/Vasati',
    'ಉಪವಸತಿ/Upavasati',
    'ಸಮಯ/Timing',
    'ಪ್ರಕಾರ/Type',
    'ಮುಖ್ಯ ಶಿಕ್ಷಕ್/Mukhya Shikshak',
    'ಕಾರ್ಯವಾಹ/Karyavaha',
    'ಶಾಖಾ ಪಾಲಕ್/Shakha palaka',
    'ಸ್ಥಾನ/Sthana',
    'ಸ್ಥಳ/Location',
    'ತಿದ್ದುಪಡಿ/Edit',
  ];
  const checkTh = withCheck ? '<th class="col-check"></th>' : '';
  const unhideTh = withUnhide ? `<th>${stackedLabel('ತೋರಿಸು/Unhide')}</th>` : '';
  return (
    `<thead><tr>${checkTh}` +
    cols.map((label) => `<th>${stackedLabel(label)}</th>`).join('') +
    `${unhideTh}</tr></thead>`
  );
}

function shakheListCells(s) {
  const timing = TIMING_LABEL[s.timing] || s.timing || '—';
  const time = s.time || '';
  const timingHtml = time
    ? `${escapeHtml(timing)}<span class="cell-sub">${escapeHtml(time)}</span>`
    : escapeHtml(timing);
  return (
    `<td class="cell-name"><button type="button" class="num-link" data-shakhe-id="${escapeHtml(s.id)}">${escapeHtml(
      s.name || '—'
    )}</button></td>` +
    `<td class="cell-text">${escapeHtml((s.vasati && s.vasati.name) || '—')}</td>` +
    `<td class="cell-text">${escapeHtml((s.upavasati && s.upavasati.name) || '—')}</td>` +
    `<td class="cell-timing">${timingHtml}</td>` +
    `<td class="cell-text">${escapeHtml(TYPE_LABEL[s.shakheType] || s.shakheType || '—')}</td>` +
    `<td class="cell-person">${escapeHtml(personCell(s.mukhashikshakName, s.mukhashikshakPhone))}</td>` +
    `<td class="cell-person">${escapeHtml(personCell(s.karyavahaName, s.karyavahaPhone))}</td>` +
    `<td class="cell-person">${escapeHtml(personCell(s.shakhaPalakaName, s.shakhaPalakaPhone))}</td>` +
    `<td class="cell-text">${escapeHtml(s.stanaName || 'ಇಲ್ಲ/Not set')}</td>` +
    `<td class="cell-loc">${locationCellHtml(s)}</td>` +
    `<td><button type="button" class="edit-link" data-edit-id="${escapeHtml(s.id)}"><span class="th-stack"><span class="th-kn">ತಿದ್ದುಪಡಿ</span><span class="th-en">Edit</span></span></button></td>`
  );
}

function paintShakheList() {
  const body = document.getElementById('list-body');
  const hidden = loadHiddenIds();
  const filtered = filteredListShakhes();
  const visible = filtered.filter((s) => !hidden.has(String(s.id)));
  const hiddenItems = filtered.filter((s) => hidden.has(String(s.id)));
  const head = shakheListHeadHtml({ withCheck: true });
  const visibleRows = visible
    .map(
      (s) =>
        `<tr><td class="col-check"><input type="checkbox" data-hide-id="${escapeHtml(s.id)}"></td>${shakheListCells(
          s
        )}</tr>`
    )
    .join('');
  const tableHtml = visible.length
    ? `<table class="varadi-table shakhe-list-table">${head}<tbody>${visibleRows}</tbody></table>`
    : '<p class="username">ತೋರಿಸುವ ಶಾಖೆಗಳಿಲ್ಲ/No visible shakhes</p>';
  const hiddenTable = hiddenItems.length
    ? `<table class="varadi-table shakhe-list-table">${shakheListHeadHtml({ withUnhide: true })}<tbody>${hiddenItems
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

document.getElementById('open-create-shakhe-btn').addEventListener('click', openForm);
document.getElementById('open-nagara-login-btn').addEventListener('click', async () => {
  try {
    const res = await fetch('/api/varadi/session');
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok && data.level === 'nagara') {
      await openFromSession(data);
      return;
    }
    if (data.reason === 'superseded') {
      await clearStaleVaradiCookie();
      logoutLocal();
      showVaradiGate({ message: VARADI_MSG_SUPERSEDED_FROM_HOME });
      return;
    }
    if (data.reason === 'expired') {
      await clearStaleVaradiCookie();
      logoutLocal();
      showVaradiGate({ message: VARADI_MSG_EXPIRED });
      return;
    }
  } catch (_) {}
  showVaradiGate();
});

async function openVolunteerEntry(purpose) {
  setHomeSessionMessage('');
  try {
    const res = await fetch('/api/phone/session');
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok && data.phone) {
      await restorePhoneSession({ ...data, purpose: purpose || data.purpose || 'upasthiti' });
      const selected = resolveSelectedShakhe(phoneShakhes);
      if (selected) {
        enterShakhe(selected);
        return;
      }
      openLookup({
        reset: false,
        purpose: purpose || lookupPurpose,
        keepResults: phoneShakhes.length > 0,
      });
      return;
    }
    if (data.reason === 'superseded' || data.reason === 'expired' || data.reason === 'invalid') {
      await clearStalePhoneCookie();
      logoutPhoneLocal();
      openLookup({ purpose });
      const errorEl = document.getElementById('lookup-error');
      errorEl.textContent =
        data.reason === 'superseded' ? PHONE_MSG_SUPERSEDED_FROM_HOME : PHONE_MSG_EXPIRED;
      errorEl.classList.remove('hidden');
      return;
    }
  } catch (_) {}
  openLookup({ purpose });
}

document.getElementById('open-upasthiti-btn').addEventListener('click', () => openVolunteerEntry('upasthiti'));
document.getElementById('open-varadi-btn').addEventListener('click', () => openVolunteerEntry('varadi'));
document.getElementById('lookup-back').addEventListener('click', showHome);
document.getElementById('setup-back').addEventListener('click', () => {
  if (phoneSessionActive) {
    showHome();
    return;
  }
  openLookup({ reset: false });
});
document.getElementById('upasthiti-back').addEventListener('click', () => {
  if (upasthitiSource === 'varadi') {
    openVaradiReport(linkedShakhe);
    return;
  }
  if (phoneSessionActive) {
    showHome();
    return;
  }
  openLookup({ reset: false });
});
document.getElementById('varadi-back').addEventListener('click', () => {
  if (phoneSessionActive) {
    showHome();
    return;
  }
  openLookup({ reset: false, purpose: 'varadi' });
});
document.getElementById('varadi-detail-close').addEventListener('click', closeVaradiDetail);
document.getElementById('varadi-detail-dismiss').addEventListener('click', closeVaradiDetail);
document.getElementById('upasthiti-done').addEventListener('click', () => {
  document.getElementById('upasthiti-success').classList.add('hidden');
  showHome();
});
document.getElementById('upasthiti-samparka').addEventListener('click', () => {
  document.getElementById('upasthiti-success').classList.add('hidden');
  document.getElementById('samparka-success').classList.add('hidden');
  document.getElementById('samparka-manegalu').value = document.getElementById('count-manegalu').value || '';
  document.getElementById('samparka-vyaktigalu').value = document.getElementById('count-vyaktigalu').value || '';
  document.getElementById('samparka-error').classList.add('hidden');
  document.getElementById('upasthiti-samparka-view').classList.remove('hidden');
});

document.getElementById('open-form-btn').addEventListener('click', openForm);
document.getElementById('open-list-btn').addEventListener('click', openList);
document.getElementById('form-back').addEventListener('click', () => {
  if (shakheStep === 2) {
    setShakheStep(1);
    return;
  }
  if (formMode === 'edit') {
    openList();
    return;
  }
  showHome();
});
document.getElementById('list-back').addEventListener('click', showHome);
document.getElementById('list-filter-vasati').addEventListener('change', () => {
  readListFiltersFromDom();
  listFilters.upavasatiId = '';
  refreshListFilterOptions();
  paintShakheList();
});
['list-filter-upavasati', 'list-filter-type', 'list-filter-timing'].forEach((id) => {
  document.getElementById(id).addEventListener('change', () => {
    readListFiltersFromDom();
    paintShakheList();
  });
});
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
  setHomeSessionMessage('');
  showHome();
});

document.getElementById('phone-logout').addEventListener('click', async () => {
  try {
    await fetch('/api/phone/logout', { method: 'POST' });
  } catch (_) {}
  logoutPhoneLocal();
  setHomeSessionMessage('');
  showHome();
});

['upasthiti-switch-shakhe', 'varadi-switch-shakhe', 'setup-switch-shakhe'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', openSwitchShakhe);
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

HIERARCHY_CHAIN.forEach((level) => {
  if (!level.next) return;
  const sel = document.getElementById(level.id);
  sel.addEventListener('change', async () => {
    if (formFilling) return;
    closeUpavasatiExists();
    clearBelow(level.sthara);
    refreshSubmit();
    const child = HIERARCHY_CHAIN.find((l) => l.sthara === level.next);
    if (!child || !sel.value) return;
    await loadChildOptions(sel.value, child.sthara, document.getElementById(child.id), level.wait);
    refreshSubmit();
  });
});

['shakhe-vibhag', 'shakhe-bhag', 'shakhe-nagar', 'shakhe-vasati', 'shakhe-upavasati', 'shakhe-name', 'shakhe-timing', 'shakhe-time', 'shakhe-type', 'shakhe-stana-name'].forEach((id) => {
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
    return;
  }
  if (!document.getElementById('varadi-detail').classList.contains('hidden')) {
    closeVaradiDetail();
  }
});

shakheForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (shakheStep === 1) {
    if (!step1Complete()) {
      refreshSubmit();
      return;
    }
    setShakheStep(2);
    return;
  }
  formError.classList.add('hidden');
  ['shakhe-vasati', 'shakhe-upavasati', 'shakhe-name', 'shakhe-timing', 'shakhe-time', 'shakhe-type', 'mukhashikshak-phone', 'karyavaha-phone', 'palaka-phone', 'shakhe-stana-name', 'shakhe-location'].forEach(
    (id) => setFieldError(id, '')
  );
  if (!formComplete()) {
    if (!step1Complete()) setShakheStep(1);
    else setShakheStep(2);
    if (!hierarchyLocked()) {
      if (!document.getElementById('shakhe-vibhag').value) setFieldError('shakhe-vibhag', 'ಆಯ್ಕೆಮಾಡಿ/Select');
      if (!document.getElementById('shakhe-bhag').value) setFieldError('shakhe-bhag', 'ಆಯ್ಕೆಮಾಡಿ/Select');
      if (!document.getElementById('shakhe-nagar').value) setFieldError('shakhe-nagar', 'ಆಯ್ಕೆಮಾಡಿ/Select');
    }
    if (!document.getElementById('shakhe-vasati').value) setFieldError('shakhe-vasati', 'ಆಯ್ಕೆಮಾಡಿ/Select');
    if (!document.getElementById('shakhe-upavasati').value) setFieldError('shakhe-upavasati', 'ಆಯ್ಕೆಮಾಡಿ/Select');
    if (!document.getElementById('shakhe-name').value.trim()) setFieldError('shakhe-name', 'ಹೆಸರು ನಮೂದಿಸಿ/Enter name');
    if (!document.getElementById('shakhe-timing').value) setFieldError('shakhe-timing', 'ಆಯ್ಕೆಮಾಡಿ/Select');
    if (!document.getElementById('shakhe-time').value) setFieldError('shakhe-time', 'ಸಮಯ ಆಯ್ಕೆಮಾಡಿ/Select time');
    if (!document.getElementById('shakhe-type').value) setFieldError('shakhe-type', 'ಆಯ್ಕೆಮಾಡಿ/Select');
    if (!phoneOk(personPhone(bearers.mukhashikshak), false)) {
      setFieldError('mukhashikshak-phone', 'ಹುಡುಕಿ ಆಯ್ಕೆಮಾಡಿ/Search and select');
    }
    const stana = document.getElementById('shakhe-stana-name').value.trim();
    if (stana.length < 5 || stana.length > 15) {
      setFieldError('shakhe-stana-name', 'ಸ್ಥಾನದ ಹೆಸರು 5 ರಿಂದ 15 ಅಕ್ಷರ/Sthana name must be 5 to 15 characters');
    }
    if (!formPlace.isConfirmed()) setFieldError('shakhe-location', 'ಸ್ಥಳ ಖಚಿತಪಡಿಸಿ/Confirm location');
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
      vibhagId: lockedIds.vibhagId || document.getElementById('shakhe-vibhag').value,
      bhagId: lockedIds.bhagId || document.getElementById('shakhe-bhag').value,
      nagarId: lockedIds.nagarId || document.getElementById('shakhe-nagar').value,
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
      stanaName: document.getElementById('shakhe-stana-name').value.trim(),
      location: formPlace.coords(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (bounceIfVaradiAuth(res, data)) {
    refreshSubmit();
    return;
  }
  if (res.status === 401) {
    if (editing) {
      logoutLocal();
      showVaradiGate();
      return;
    }
    formError.textContent = data.error || 'ಶಾಖೆ ರಚಿಸಲಾಗಲಿಲ್ಲ/Could not create Shakhe';
    formError.classList.remove('hidden');
    refreshSubmit();
    return;
  }
  if (!res.ok) {
    formError.textContent =
      data.error || (editing ? 'ಶಾಖೆ ಉಳಿಸಲಾಗಲಿಲ್ಲ/Could not save Shakhe' : 'ಶಾಖೆ ರಚಿಸಲಾಗಲಿಲ್ಲ/Could not create Shakhe');
    formError.classList.remove('hidden');
    refreshSubmit();
    return;
  }
  document.getElementById('success-title').textContent = editing
    ? 'ಶಾಖೆ ಉಳಿಸಲಾಗಿದೆ/Shakhe saved'
    : 'ಶಾಖೆ ರಚಿಸಲಾಗಿದೆ/Shakhe created';
  document.getElementById('success-path').textContent = shakhePathLine(data);
  document.getElementById('success-shakhe').textContent = data.name || '';
  shakheForm.classList.add('hidden');
  successPanel.classList.remove('hidden');
});

let confirmPhone = '';
let linkedShakhe = null;
let viewMap = null;
let viewMarker = null;
let checksBuilt = false;

function todayIst() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function addDaysIso(iso, n) {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

function programLabelList(ids, catalog) {
  return (ids || [])
    .map((id) => {
      const item = catalog.find((row) => row.id === id);
      return item ? `${item.kn}/${item.en}` : id;
    })
    .filter(Boolean)
    .join(', ');
}

function formatDateDisplay(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso || '';
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function weekdayParts(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00+05:30`);
  if (Number.isNaN(d.getTime())) return null;
  const day = WEEKDAY_LABEL[d.getDay()] || '';
  return day ? { label: 'ದಿನ/Day', value: day } : null;
}

function dateLineHtml(label, value) {
  if (!value) return '';
  return `<span class="date-kicker">${escapeHtml(label)}</span><span class="date-value">${escapeHtml(value)}</span>`;
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
    kv('ಮುಖ್ಯ ಶಿಕ್ಷಕ್/Mukhya Shikshak', personCell(s.mukhashikshakName, s.mukhashikshakPhone)) +
    kv('ಕಾರ್ಯವಾಹ/Karyavaha', personCell(s.karyavahaName, s.karyavahaPhone)) +
    kv('ಶಾಖಾ ಪಾಲಕ್/Shakha palaka', personCell(s.shakhaPalakaName, s.shakhaPalakaPhone))
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
  if (bounceIfVaradiAuth(res, data) || bounceIfPhoneAuth(res, data)) return;
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

let lookupPurpose = 'upasthiti';
let upasthitiSource = 'lookup';

function syncSwitchShakheButtons() {
  const show = phoneShakhes.length > 1;
  ['upasthiti-switch-shakhe', 'varadi-switch-shakhe', 'setup-switch-shakhe'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !show);
  });
}

function paintPhoneShakheResults(list) {
  const results = document.getElementById('lookup-results');
  results.innerHTML = '';
  const rows = Array.isArray(list) ? list : [];
  if (!rows.length) {
    results.innerHTML = '<li class="no-match">ಶಾಖೆ ಸಿಗಲಿಲ್ಲ/No shakhe for this phone.</li>';
    return;
  }
  const selected = resolveSelectedShakhe(rows);
  rows.forEach((s) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    const place = [s.upavasati && s.upavasati.name, s.vasati && s.vasati.name, TIMING_LABEL[s.timing] || s.timing]
      .filter(Boolean)
      .join(' · ');
    btn.textContent = place ? `${s.name} — ${place}` : s.name;
    if (selected && selected.id === s.id) btn.classList.add('is-current');
    btn.addEventListener('click', () => enterShakhe(s));
    li.appendChild(btn);
    results.appendChild(li);
  });
}

async function establishPhoneSession(phone, purpose) {
  const res = await fetch('/api/phone/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, purpose: purpose || lookupPurpose }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || 'ಸೆಷನ್ ಉಳಿಸಲಾಗಲಿಲ್ಲ/Could not save session', status: res.status };
  }
  confirmPhone = data.phone || phone;
  setPhoneAuthed(true);
  armPhoneLogout(data.expiresIn);
  return { ok: true, phone: confirmPhone, expiresIn: data.expiresIn };
}

async function loadPhoneShakhes(phone) {
  const res = await fetch(`/api/shakhe/by-phone?phone=${encodeURIComponent(phone)}`);
  const data = await res.json().catch(() => ({}));
  return data.shakhes || [];
}

function openSwitchShakhe() {
  openLookup({ reset: false, purpose: lookupPurpose, keepResults: true });
}

function openLookup(opts) {
  const reset = !opts || opts.reset !== false;
  if (opts && opts.purpose) lookupPurpose = opts.purpose;
  const varadi = lookupPurpose === 'varadi';
  document.getElementById('lookup-title').textContent = varadi
    ? 'ಶಾಖೆ ವರದಿ/Shakhe Varadi'
    : 'ಉಪಸ್ಥಿತಿ/Upasthiti';
  document.getElementById('lookup-hint').textContent =
    'ಮುಖ್ಯ ಶಿಕ್ಷಕ್ ದೂರವಾಣಿ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ/Enter Mukhya Shikshak phone number';
  document.getElementById('lookup-error').classList.add('hidden');
  if (reset) {
    document.getElementById('lookup-phone').value = '';
    document.getElementById('lookup-results').innerHTML = '';
  } else if (confirmPhone) {
    document.getElementById('lookup-phone').value = confirmPhone;
  }
  showScreen(lookupView);
  if (opts && opts.keepResults && phoneShakhes.length) {
    paintPhoneShakheResults(phoneShakhes);
  }
}

async function restorePhoneSession(data) {
  if (!data || !data.ok || !data.phone) return false;
  confirmPhone = data.phone;
  if (data.purpose === 'varadi' || data.purpose === 'upasthiti') {
    lookupPurpose = data.purpose;
  }
  setPhoneAuthed(true);
  armPhoneLogout(data.expiresIn);
  phoneShakhes = await loadPhoneShakhes(confirmPhone);
  const selected = resolveSelectedShakhe(phoneShakhes);
  if (selected) linkedShakhe = selected;
  syncSwitchShakheButtons();
  return true;
}

function setVaradiDayCount(selected) {
  const selectedEl = document.getElementById('varadi-day-count');
  if (selectedEl) {
    selectedEl.innerHTML = `ಆಯ್ಕೆ ಮಾಡಿದ ದಿನಗಳು/Days selected <strong>${escapeHtml(String(selected || 0))}</strong>`;
  }
}

function varadiRangeDays() {
  const fromEl = document.getElementById('varadi-from');
  const toEl = document.getElementById('varadi-to');
  let from = fromEl.value;
  let to = toEl.value;
  const today = todayIst();
  if (!from) from = addDaysIso(today, -6);
  if (!to) to = today;
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
    fromEl.value = from;
    toEl.value = to;
  }
  fromEl.value = from;
  toEl.value = to;
  let count = 0;
  let cur = from;
  while (cur <= to && count < 63) {
    count += 1;
    cur = addDaysIso(cur, 1);
  }
  setVaradiDayCount(count);
  return { from, to, count };
}

const varadiDetails = new Map();

function closeVaradiDetail() {
  const modal = document.getElementById('varadi-detail');
  if (modal) modal.classList.add('hidden');
}

function openVaradiDetail(date, kind) {
  const detail = varadiDetails.get(`${date}:${kind}`);
  if (!detail) return;
  document.getElementById('varadi-detail-title').textContent = detail.title;
  document.getElementById('varadi-detail-body').innerHTML = detail.body;
  document.getElementById('varadi-detail').classList.remove('hidden');
}

function varadiDetailBtn(date, kind, label) {
  return `<button type="button" class="num-link" data-varadi-detail="${escapeHtml(date)}" data-varadi-kind="${escapeHtml(
    kind
  )}">${escapeHtml(label)}</button>`;
}

function varadiProgramDetail(ids, catalog, extrasHtml) {
  const picked = new Set(ids || []);
  const items = catalog
    .filter((item) => picked.has(item.id))
    .map((item) => `<li>${escapeHtml(item.kn)}/${escapeHtml(item.en)}</li>`)
    .join('');
  const list = items ? `<ul class="varadi-detail-list">${items}</ul>` : '<p class="username">ಆಯ್ಕೆ ಇಲ್ಲ/None selected</p>';
  return list + (extrasHtml || '');
}

function paintVaradiTable(days) {
  varadiDetails.clear();
  const body = document.getElementById('varadi-body');
  const head =
    '<thead><tr>' +
    '<th>ದಿನಾಂಕ/Date</th>' +
    '<th>ತರುಣ/Taruna</th>' +
    '<th>ಬಾಲಕ/Balaka</th>' +
    '<th>ಶಿಶು/Shishu</th>' +
    '<th>ಮಾತಾ-ಭಗಿನಿ/Mata Bhagini</th>' +
    '<th>ಒಟ್ಟು/Total</th>' +
    '<th>ಪ್ರವಾಸಿ/Pravasi</th>' +
    '<th>ಮನೆಗಳು/Manegalu</th>' +
    '<th>ವ್ಯಕ್ತಿಗಳು/Vyaktigalu</th>' +
    '<th>ಬೌದ್ಧಿಕ್/Boudhik</th>' +
    '<th>ಶಾರೀರಿಕ/Sharirik</th>' +
    '<th>ಸೇವಾ/Seva</th>' +
    '<th>ತಿದ್ದುಪಡಿ/Edit</th>' +
    '</tr></thead>';
  const rows = (days || [])
    .map((row) => {
      const u = row.upasthiti;
      const dateLabel = `${formatDateDisplay(row.date)}`;
      const editCell = `<td><button type="button" class="edit-link" data-varadi-edit="${escapeHtml(row.date)}"><span class="th-stack"><span class="th-kn">ತಿದ್ದುಪಡಿ</span><span class="th-en">Edit</span></span></button></td>`;
      if (!u) {
        return (
          `<tr><td>${escapeHtml(dateLabel)}</td>` +
          `<td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td>` +
          editCell +
          `</tr>`
        );
      }
      const pravasiList = Array.isArray(u.pravasis) && u.pravasis.length
        ? u.pravasis
        : u.pravasiPerson || u.pravasiPhone
          ? [u.pravasiPerson || { name: u.pravasiName, phone: u.pravasiPhone }]
          : [];
      const boudhikIds = u.boudhik || [];
      const sharirikIds = u.sharirik || [];
      const boudhikLabel = `${boudhikIds.length}/${BOUDHIK_ITEMS.length}`;
      const sharirikLabel = `${sharirikIds.length}/${SHARIRIK_ITEMS.length}`;
      const boudhikExtras =
        (u.sannaKatheText ? kv('ಸಣ್ಣ ಕಥೆ/Sanna Kathe', u.sannaKatheText) : '') +
        (u.deerghaKatheText ? kv('ದೀರ್ಘ ಕಥೆ/Deergha Kathe', u.deerghaKatheText) : '') +
        (personSnapLine(u.boudhikPerson)
          ? kv('ಬೌದ್ಧಿಕ್ ತೆಗೆದುಕೊಂಡವರು/Boudhik taken by', personCell(u.boudhikPerson.name, u.boudhikPerson.phone))
          : '') +
        (personSnapLine(u.charchePerson)
          ? kv('ಚರ್ಚೆ/Charche', personCell(u.charchePerson.name, u.charchePerson.phone))
          : '') +
        (u.boudhikItara ? kv('ಇತರೆ/Itara', u.boudhikItara) : '');
      const sharirikExtras = u.sharirikItara ? kv('ಇತರೆ/Itara', u.sharirikItara) : '';
      varadiDetails.set(`${row.date}:boudhik`, {
        title: `ಬೌದ್ಧಿಕ್/Boudhik · ${dateLabel}`,
        body: varadiProgramDetail(boudhikIds, BOUDHIK_ITEMS, boudhikExtras),
      });
      varadiDetails.set(`${row.date}:sharirik`, {
        title: `ಶಾರೀರಿಕ/Sharirik · ${dateLabel}`,
        body: varadiProgramDetail(sharirikIds, SHARIRIK_ITEMS, sharirikExtras),
      });
      if (u.seva) {
        varadiDetails.set(`${row.date}:seva`, {
          title: `ಸೇವಾ/Seva · ${dateLabel}`,
          body: `<p class="username">${escapeHtml(u.seva)}</p>`,
        });
      }
      if (pravasiList.length) {
        varadiDetails.set(`${row.date}:pravasi`, {
          title: `ಪ್ರವಾಸಿ/Pravasi · ${dateLabel}`,
          body:
            `<ul class="varadi-detail-list pravasi-detail-list">` +
            pravasiList.map((p) => `<li>${personDetailHtml(p)}</li>`).join('') +
            `</ul>`,
        });
      }
      const pravasiCell = pravasiList.length
        ? varadiDetailBtn(row.date, 'pravasi', String(pravasiList.length))
        : '0';
      const boudhikCell = boudhikIds.length
        ? varadiDetailBtn(row.date, 'boudhik', boudhikLabel)
        : boudhikLabel;
      const sharirikCell = sharirikIds.length
        ? varadiDetailBtn(row.date, 'sharirik', sharirikLabel)
        : sharirikLabel;
      const sevaCell = u.seva ? varadiDetailBtn(row.date, 'seva', 'ನಡೆದಿದೆ/Done') : 'ಆಗಿಲ್ಲ/Not done';
      return (
        `<tr>` +
        `<td>${escapeHtml(dateLabel)}</td>` +
        `<td>${escapeHtml(u.taruna)}</td>` +
        `<td>${escapeHtml(u.balaka)}</td>` +
        `<td>${escapeHtml(u.shishu)}</td>` +
        `<td>${escapeHtml(u.mataBhagi)}</td>` +
        `<td>${escapeHtml(u.total)}</td>` +
        `<td>${pravasiCell}</td>` +
        `<td>${escapeHtml(u.samparkitaManegalu == null ? '—' : u.samparkitaManegalu)}</td>` +
        `<td>${escapeHtml(u.samparkitaVyaktigalu == null ? '—' : u.samparkitaVyaktigalu)}</td>` +
        `<td>${boudhikCell}</td>` +
        `<td>${sharirikCell}</td>` +
        `<td>${sevaCell}</td>` +
        editCell +
        `</tr>`
      );
    })
    .join('');
  body.innerHTML = `<table class="varadi-table">${head}<tbody>${rows}</tbody></table>`;
  body.querySelectorAll('[data-varadi-edit]').forEach((btn) => {
    btn.addEventListener('click', () => editVaradiDay(btn.getAttribute('data-varadi-edit')));
  });
  body.querySelectorAll('[data-varadi-detail]').forEach((btn) => {
    btn.addEventListener('click', () =>
      openVaradiDetail(btn.getAttribute('data-varadi-detail'), btn.getAttribute('data-varadi-kind'))
    );
  });
}

async function loadVaradiRange() {
  const errorEl = document.getElementById('varadi-error');
  const loading = document.getElementById('varadi-loading');
  const body = document.getElementById('varadi-body');
  errorEl.classList.add('hidden');
  const { from, to, count } = varadiRangeDays();
  if (count > 62) {
    errorEl.textContent = 'ಗರಿಷ್ಠ 62 ದಿನ ಆಯ್ಕೆಮಾಡಿ/Select at most 62 days';
    errorEl.classList.remove('hidden');
    body.innerHTML = '';
    return;
  }
  loading.classList.remove('hidden');
  body.innerHTML = '';
  const res = await fetch(
    `/api/upasthiti/range?shakheId=${encodeURIComponent(linkedShakhe.id)}&confirmPhone=${encodeURIComponent(
      confirmPhone
    )}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
  const data = await res.json().catch(() => ({}));
  loading.classList.add('hidden');
  if (bounceIfPhoneAuth(res, data)) return;
  if (res.status === 409) {
    openSetup(data.shakhe || linkedShakhe);
    return;
  }
  if (!res.ok) {
    errorEl.textContent = data.error || 'ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load';
    errorEl.classList.remove('hidden');
    return;
  }
  setVaradiDayCount(data.dayCount || count);
  paintVaradiTable(data.days || []);
}

async function openVaradiReport(shakhe) {
  linkedShakhe = shakhe;
  lookupPurpose = 'varadi';
  upasthitiSource = 'varadi';
  document.getElementById('varadi-path').textContent = shakhePathLine(shakhe);
  document.getElementById('varadi-linked').textContent = shakheTitleLine(shakhe);
  document.getElementById('varadi-error').classList.add('hidden');
  document.getElementById('varadi-body').innerHTML = '';
  syncSwitchShakheButtons();
  const today = todayIst();
  const fromEl = document.getElementById('varadi-from');
  const toEl = document.getElementById('varadi-to');
  fromEl.max = today;
  toEl.max = today;
  if (!fromEl.value) fromEl.value = addDaysIso(today, -6);
  if (!toEl.value) toEl.value = today;
  if (fromEl.value > today) fromEl.value = today;
  if (toEl.value > today) toEl.value = today;
  showScreen(shakheVaradiView);
  await loadVaradiRange();
}

async function editVaradiDay(date) {
  upasthitiSource = 'varadi';
  await openDaily(linkedShakhe, date);
}

async function openSetup(shakhe) {
  linkedShakhe = shakhe;
  document.getElementById('setup-error').classList.add('hidden');
  document.getElementById('setup-linked').textContent = shakhe.name || '';
  document.getElementById('setup-details').innerHTML = shakheSummaryHtml(shakhe);
  syncSwitchShakheButtons();
  setupPlace.reset();
  document.getElementById('setup-stana-name').value = shakhe.stanaName || '';
  showScreen(setupView);
  const loc = shakhe.location || {};
  if (Number.isFinite(loc.lat) && Number.isFinite(loc.lng) && loc.lat != null && loc.lng != null) {
    setupPlace.showExisting(loc.lat, loc.lng);
  } else {
    setupPlace.ensure(MAP_DEFAULT[0], MAP_DEFAULT[1], 12);
    setupPlace.centerFromGps();
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

function setUpasthitiHeaderVisible(visible) {
  ['upasthiti-date-picker-wrap', 'upasthiti-date-bold', 'upasthiti-weekday'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !visible);
  });
  if (visible) {
    syncSwitchShakheButtons();
  } else {
    const el = document.getElementById('upasthiti-switch-shakhe');
    if (el) el.classList.add('hidden');
  }
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
  return {
    personId: person.personId || null,
    name: person.name || '',
    phone: person.phone || '',
    responsibility: person.responsibility || '',
    shakhe: person.shakhe || '',
    nagarName: person.nagarName || '',
  };
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
    countVal('count-taruna') !== null ||
    countVal('count-balaka') !== null ||
    countVal('count-shishu') !== null ||
    countVal('count-mata') !== null
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
  resetPravasiPeople();
  resetBearer('boudhikSpeaker', 'boudhik-speaker-block');
  resetBearer('charcheSpeaker', 'charche-speaker-block');
  syncBoudhikExtras();
  syncSharirikExtras();
  refreshTotal();
  document.getElementById('upasthiti-success').classList.add('hidden');
  document.getElementById('upasthiti-samparka-view').classList.add('hidden');
  document.getElementById('samparka-success').classList.add('hidden');
  document.getElementById('upasthiti-error').classList.add('hidden');
  setDailyStep(1);
  refreshDailySubmit();
}

function setUpasthitiDate(iso) {
  const dateEl = document.getElementById('upasthiti-date');
  const bold = document.getElementById('upasthiti-date-bold');
  const weekday = document.getElementById('upasthiti-weekday');
  const heading = document.getElementById('upasthiti-heading');
  const today = todayIst();
  dateEl.max = today;
  dateEl.value = iso;
  if (bold) bold.innerHTML = dateLineHtml('ದಿನಾಂಕ/Date', formatDateDisplay(iso));
  if (weekday) {
    const parts = weekdayParts(iso);
    weekday.innerHTML = parts ? dateLineHtml(parts.label, parts.value) : '';
  }
  if (heading) {
    heading.textContent =
      iso === today ? "ಇಂದಿನ ಶಾಖಾ ಉಪಸ್ಥಿತಿ/Today's Shakha Upasthiti" : 'ಶಾಖಾ ಉಪಸ್ಥಿತಿ/Shakha Upasthiti';
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

  const pravasiList = Array.isArray(entry.pravasis) && entry.pravasis.length
    ? entry.pravasis
    : entry.pravasiPerson || entry.pravasiPhone || entry.pravasiName
      ? [
          entry.pravasiPerson || {
            name: entry.pravasiName,
            phone: entry.pravasiPhone,
          },
        ]
      : [];
  const pravasiText = pravasiList.length
    ? pravasiList.map((p) => personDetailText(p)).join(' · ')
    : '—';
  const counts =
    `<div class="view-counts">` +
    kv('ತರುಣ/Taruna', entry.taruna) +
    kv('ಬಾಲಕ/Balaka', entry.balaka) +
    kv('ಶಿಶು/Shishu', entry.shishu) +
    kv('ಮಾತಾ-ಭಗಿನಿ/Mata Bhagini', entry.mataBhagi) +
    `</div>` +
    `<p class="total-line">ಒಟ್ಟು/Total <strong>${escapeHtml(entry.total)}</strong></p>` +
    kv('ಉಪಸ್ಥಿತ ಪ್ರವಾಸಿ ಕಾರ್ಯಕರ್ತರು/Upasthitha pravasi karyakartharu', pravasiText) +
    kv('ಒಟ್ಟು ಸಂಪರ್ಕಿತ ಮನೆಗಳು/Ottu samparkitha manegalu', entry.samparkitaManegalu) +
    kv('ಒಟ್ಟು ಸಂಪರ್ಕಿತ ವ್ಯಕ್ತಿಗಳು/Ottu samparkita vyaktigalu', entry.samparkitaVyaktigalu);

  const boudhikExtras =
    (entry.sannaKatheText ? kv('ಸಣ್ಣ ಕಥೆ/Sanna Kathe', entry.sannaKatheText) : '') +
    (entry.deerghaKatheText ? kv('ದೀರ್ಘ ಕಥೆ/Deergha Kathe', entry.deerghaKatheText) : '') +
    (personSnapLine(entry.boudhikPerson)
      ? kv('ಬೌದ್ಧಿಕ್ ತೆಗೆದುಕೊಂಡವರು/Boudhik taken by', personCell(entry.boudhikPerson.name, entry.boudhikPerson.phone))
      : '') +
    (personSnapLine(entry.charchePerson)
      ? kv('ಚರ್ಚೆ/Charche', personCell(entry.charchePerson.name, entry.charchePerson.phone))
      : '') +
    (entry.boudhikItara ? kv('ಇತರೆ/Itara', entry.boudhikItara) : '');
  const sharirikExtras = entry.sharirikItara ? kv('ಇತರೆ/Itara', entry.sharirikItara) : '';
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

  document.getElementById('upasthiti-form').classList.add('hidden');

  const success = document.getElementById('upasthiti-success');
  document.getElementById('upasthiti-samparka-view').classList.add('hidden');
  document.getElementById('samparka-success').classList.add('hidden');
  if (opts && opts.submitted) {
    document.getElementById('upasthiti-saved-view').classList.add('hidden');
    setUpasthitiHeaderVisible(false);
    const shakheName = (linkedShakhe && linkedShakhe.name) || (entry.shakhe && entry.shakhe.name) || '';
    document.getElementById('upasthiti-success-detail').textContent = `${shakheName} · ${formatDateDisplay(dateIso)}`;
    success.classList.remove('hidden');
  } else {
    document.getElementById('upasthiti-saved-view').classList.remove('hidden');
    setUpasthitiHeaderVisible(true);
    setSavedStep(1);
    success.classList.add('hidden');
  }
}

function showDailyForm() {
  document.getElementById('upasthiti-saved-view').classList.add('hidden');
  document.getElementById('upasthiti-success').classList.add('hidden');
  document.getElementById('upasthiti-samparka-view').classList.add('hidden');
  document.getElementById('samparka-success').classList.add('hidden');
  document.getElementById('upasthiti-form').classList.remove('hidden');
  setUpasthitiHeaderVisible(true);
  setDailyStep(1);
  refreshDailySubmit();
}

function fillDaily(entry) {
  if (!entry) return;
  document.getElementById('count-taruna').value = String(entry.taruna);
  document.getElementById('count-balaka').value = String(entry.balaka);
  document.getElementById('count-shishu').value = String(entry.shishu);
  document.getElementById('count-mata').value = String(entry.mataBhagi);
  const pravasiList = Array.isArray(entry.pravasis) && entry.pravasis.length
    ? entry.pravasis
    : entry.pravasiPerson || entry.pravasiPhone || entry.pravasiName
      ? [
          entry.pravasiPerson || {
            name: entry.pravasiName,
            phone: entry.pravasiPhone,
          },
        ]
      : [];
  pravasiPeople = pravasiList
    .filter((p) => p && (p.phone || p.name))
    .map((p) => ({
      personId: p.personId || null,
      name: p.name || '',
      phone: p.phone || '',
      responsibility: p.responsibility || '',
      shakhe: p.shakhe || '',
      nagarName: p.nagarName || '',
    }));
  renderPravasiList();
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
  if (bounceIfPhoneAuth(res, data)) return;
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

async function openDaily(shakhe, date) {
  linkedShakhe = shakhe;
  if (!checksBuilt) {
    fillChecks();
    checksBuilt = true;
  }
  document.getElementById('upasthiti-path').textContent = shakhePathLine(shakhe);
  document.getElementById('upasthiti-linked').textContent = shakheTitleLine(shakhe);
  document.getElementById('upasthiti-saved-view').classList.add('hidden');
  document.getElementById('upasthiti-form').classList.add('hidden');
  syncSwitchShakheButtons();
  showScreen(upasthitiView);
  await loadDailyForDate(date || todayIst());
}

async function enterShakhe(shakhe) {
  linkedShakhe = shakhe;
  if (shakhe && shakhe.id) saveSelectedShakheId(confirmPhone, shakhe.id);
  if (lookupPurpose === 'varadi') {
    await openVaradiReport(shakhe);
    return;
  }
  upasthitiSource = 'lookup';
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
  const session = await establishPhoneSession(phone, lookupPurpose);
  if (!session.ok) {
    errorEl.textContent =
      session.status === 429
        ? 'ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ/Try again later'
        : session.error;
    errorEl.classList.remove('hidden');
    return;
  }
  setHomeSessionMessage('');
  const list = await loadPhoneShakhes(confirmPhone);
  phoneShakhes = list;
  syncSwitchShakheButtons();
  if (!list.length) {
    results.innerHTML = '<li class="no-match">ಶಾಖೆ ಸಿಗಲಿಲ್ಲ/No shakhe for this phone.</li>';
    return;
  }
  if (list.length === 1) {
    enterShakhe(list[0]);
    return;
  }
  paintPhoneShakheResults(list);
});

formPlace.bind();
setupPlace.bind();

document.getElementById('shakhe-step-next').addEventListener('click', () => {
  if (!step1Complete()) {
    refreshSubmit();
    return;
  }
  setShakheStep(2);
});
document.getElementById('shakhe-step-back').addEventListener('click', () => setShakheStep(1));

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
  if (!setupPlace.isConfirmed()) {
    errorEl.textContent = 'ಸ್ಥಳ ಖಚಿತಪಡಿಸಿ/Confirm location';
    errorEl.classList.remove('hidden');
    return;
  }
  const loc = setupPlace.coords() || {};
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
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
  if (bounceIfPhoneAuth(res, data)) {
    return;
  }
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
['varadi-from', 'varadi-to'].forEach((id) => {
  document.getElementById(id).addEventListener('change', () => {
    varadiRangeDays();
    if (linkedShakhe) loadVaradiRange();
  });
});

document.getElementById('saved-step-next').addEventListener('click', () => setSavedStep(2));
document.getElementById('saved-step-back').addEventListener('click', () => setSavedStep(1));
document.getElementById('upasthiti-edit').addEventListener('click', () => {
  showDailyForm();
});

async function submitUpasthiti(errorElId) {
  const errorEl = document.getElementById(errorElId || 'upasthiti-error');
  errorEl.classList.add('hidden');
  if (!dailyComplete()) {
    refreshDailySubmit();
    return null;
  }
  const res = await fetch('/api/upasthiti', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shakheId: linkedShakhe.id,
      confirmPhone,
      date: document.getElementById('upasthiti-date').value || todayIst(),
      taruna: countVal('count-taruna') ?? 0,
      balaka: countVal('count-balaka') ?? 0,
      shishu: countVal('count-shishu') ?? 0,
      mataBhagi: countVal('count-mata') ?? 0,
      pravasis: pravasiPeople.map((p) => personSnapPayload(p)).filter(Boolean),
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
  if (bounceIfPhoneAuth(res, data)) {
    refreshDailySubmit();
    return null;
  }
  if (!res.ok) {
    errorEl.textContent = data.error || 'ಉಪಸ್ಥಿತಿ ಉಳಿಸಲಾಗಲಿಲ್ಲ/Could not save Upasthiti';
    errorEl.classList.remove('hidden');
    refreshDailySubmit();
    return null;
  }
  return data;
}

document.getElementById('upasthiti-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('upasthiti-submit');
  submitBtn.disabled = true;
  const data = await submitUpasthiti('upasthiti-error');
  if (!data) return;
  fillDaily(data);
  showSavedUpasthiti(data, { submitted: true });
});

document.getElementById('samparka-submit').addEventListener('click', async () => {
  const btn = document.getElementById('samparka-submit');
  document.getElementById('count-manegalu').value = document.getElementById('samparka-manegalu').value;
  document.getElementById('count-vyaktigalu').value = document.getElementById('samparka-vyaktigalu').value;
  btn.disabled = true;
  const data = await submitUpasthiti('samparka-error');
  btn.disabled = false;
  if (!data) return;
  fillDaily(data);
  document.getElementById('upasthiti-samparka-view').classList.add('hidden');
  const dateIso = (data && data.date) || document.getElementById('upasthiti-date').value || todayIst();
  const shakheName = (linkedShakhe && linkedShakhe.name) || (data.shakhe && data.shakhe.name) || '';
  document.getElementById('samparka-success-detail').textContent = `${shakheName} · ${formatDateDisplay(dateIso)}`;
  document.getElementById('samparka-success').classList.remove('hidden');
});

document.getElementById('samparka-done').addEventListener('click', () => {
  document.getElementById('samparka-success').classList.add('hidden');
  showHome();
});

(async function boot() {
  try {
    const res = await fetch('/api/varadi/session');
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok && data.level === 'nagara') {
      await openFromSession(data);
      return;
    }
    if (data.reason === 'superseded') {
      await clearStaleVaradiCookie();
      logoutLocal();
      setHomeSessionMessage(VARADI_MSG_SUPERSEDED_FROM_HOME);
      showHome();
      return;
    }
    if (data.reason === 'expired') {
      await clearStaleVaradiCookie();
      logoutLocal();
      setHomeSessionMessage(VARADI_MSG_EXPIRED);
      showHome();
      return;
    }
  } catch (_) {}

  try {
    const res = await fetch('/api/phone/session');
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok && data.phone) {
      await restorePhoneSession(data);
      showHome();
      return;
    }
    if (data.reason === 'superseded') {
      await clearStalePhoneCookie();
      logoutPhoneLocal();
      setHomeSessionMessage(PHONE_MSG_SUPERSEDED_FROM_HOME);
    } else if (data.reason === 'expired' || data.reason === 'invalid') {
      await clearStalePhoneCookie();
      logoutPhoneLocal();
      setHomeSessionMessage(PHONE_MSG_EXPIRED);
    }
  } catch (_) {}

  showHome();
})();
