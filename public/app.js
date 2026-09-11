const homeView = document.getElementById('home-view');
const formView = document.getElementById('form-view');
const listView = document.getElementById('list-view');
const viewShakheView = document.getElementById('view-shakhe-view');
const varadiGateView = document.getElementById('varadi-gate-view');
const varadiChoiceView = document.getElementById('varadi-choice-view');
const lookupView = document.getElementById('lookup-view');
const setupView = document.getElementById('setup-view');
const shakheVaradiView = document.getElementById('shakhe-varadi-view');
const nagaraReportView = document.getElementById('nagara-report-view');
const nagaraListView = document.getElementById('nagara-list-view');
const varadiPlaceholderView = document.getElementById('varadi-placeholder-view');
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
  'ಈ ಸೆಷನ್ ಮುಗಿದಿದೆ (ಗರಿಷ್ಠ 5 ಸಾಧನಗಳು ಅಥವಾ ಹೊಸ ಲಾಗಿನ್)/This session ended (max 5 devices or a newer login)';
const VARADI_MSG_SUPERSEDED_FROM_HOME =
  'ಈ ಸೆಷನ್ ಮುಗಿದಿದೆ (ಗರಿಷ್ಠ 5 ಸಾಧನಗಳು ಅಥವಾ ಹೊಸ ಲಾಗಿನ್) — ಮತ್ತೆ ಲಾಗಿನ್ ಮಾಡಿ/This session ended (max 5 devices or a newer login) — please sign in again';
const VARADI_MSG_EXPIRED =
  'ಸೆಷನ್ ಅವಧಿ ಮುಗಿದಿದೆ — ಮತ್ತೆ ಲಾಗಿನ್ ಮಾಡಿ/Session expired — please sign in again';
const PHONE_MSG_SUPERSEDED_ON_SCREEN = VARADI_MSG_SUPERSEDED_ON_SCREEN;
const PHONE_MSG_SUPERSEDED_FROM_HOME = VARADI_MSG_SUPERSEDED_FROM_HOME;
const PHONE_MSG_EXPIRED = VARADI_MSG_EXPIRED;

const SELECT_PLACEHOLDER = 'ಆಯ್ಕೆಮಾಡಿ/Select';
/** Hierarchy display labels (Kannada variants / English). */
const LABEL_BHAG = 'ಜಿಲ್ಲಾ/ಭಾಗ/Bhag';
const LABEL_NAGARA = 'ತಾಲ್ಲೂಕು/ನಗರ/Nagara';
const LABEL_VASATI = 'ವಸತಿ/ಮಂಡಲ/Vasati';
const LABEL_UPAVASATI = 'ಗ್ರಾಮ/ಉಪವಸತಿ/Upavasati';
const LABEL_VIBHAG = 'ವಿಭಾಗ/Vibhag';
const WAIT_SELECT_VIBHAG = 'ಮೊದಲು ವಿಭಾಗ ಆಯ್ಕೆಮಾಡಿ/Select a Vibhag first';
const WAIT_SELECT_BHAG = 'ಮೊದಲು ಜಿಲ್ಲಾ/ಭಾಗ ಆಯ್ಕೆಮಾಡಿ/Select a Bhag first';
const WAIT_SELECT_NAGARA = 'ಮೊದಲು ತಾಲ್ಲೂಕು/ನಗರ ಆಯ್ಕೆಮಾಡಿ/Select a Nagara first';
const WAIT_SELECT_VASATI = 'ಮೊದಲು ವಸತಿ/ಮಂಡಲ ಆಯ್ಕೆಮಾಡಿ/Select a Vasati first';
const TIMING_LABEL = {
  prabhat: 'ಪ್ರಭಾತ್/Prabhat',
  madhyana: 'ಮಧ್ಯಾಹ್ನ/Madhyana',
  sayam: 'ಸಾಯಂ/Sayam',
  ratri: 'ರಾತ್ರಿ/Ratri',
};

/** [04:00,11:00) prabhat, [11:00,16:00) madhyana, [16:00,19:00) sayam, else ratri. */
function timingFromTime(time) {
  const match = String(time || '').trim().match(/^(\d{2}):(\d{2})/);
  if (!match) return '';
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  if (minutes >= 4 * 60 && minutes < 11 * 60) return 'prabhat';
  if (minutes >= 11 * 60 && minutes < 16 * 60) return 'madhyana';
  if (minutes >= 16 * 60 && minutes < 19 * 60) return 'sayam';
  return 'ratri';
}
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
let sessionLevel = null; // prant|vibhag|bhag|nagara
let sessionEntityId = null;
let sessionEntityName = null;
let varadiDrillStack = []; // [{ level, entityId, entityName }]
let reportScopeLevel = 'nagara';
let reportScopeEntityId = null;
let reportScopeEntityName = null;
const VARADI_LEVELS = ['prant', 'vibhag', 'bhag', 'nagara'];
const NEXT_VARADI_LEVEL = { prant: 'vibhag', vibhag: 'bhag', bhag: 'nagara' };
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
let viewingShakheId = null;
let lastVaradiChoices = [];
let nagaraListContext = null;
let nagaraReportCache = null;
let nagaraReportLoadSeq = 0;
/** Active nagara report: 'shakhe' | 'boudhik' | 'sharirik' */
let nagaraReportKind = 'shakhe';
/** Excel-style expand/collapse for days-ran bucket columns on Shakhe Varadi. */
let shakheDaysColumnsOpen = false;
/** Where view/edit should return: 'patti' | 'nagara-varadi-list' | 'nagara-varadi' */
let shakheReturnTo = 'patti';
let navSeq = 0;
let historyInitialized = false;
let restoringHistory = false;
const navViewBySeq = new Map();

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
  const prevView = currentView;
  [
    homeView,
    formView,
    listView,
    viewShakheView,
    varadiGateView,
    varadiChoiceView,
    lookupView,
    setupView,
    shakheVaradiView,
    nagaraReportView,
    nagaraListView,
    varadiPlaceholderView,
    upasthitiView,
  ].forEach((v) => v.classList.add('hidden'));
  view.classList.remove('hidden');
  updateSignOutFooters(view);
  recordHistoryForView(view, prevView);
}

function recordHistoryForView(view, prevView) {
  if (restoringHistory) return;
  if (!historyInitialized) {
    historyInitialized = true;
    navViewBySeq.set(navSeq, view);
    history.replaceState({ navSeq }, '', location.href);
    return;
  }
  if (view === prevView) return;
  navSeq += 1;
  navViewBySeq.set(navSeq, view);
  history.pushState({ navSeq }, '', location.href);
}

function restoreView(view) {
  if (view === formView) {
    if (formMode === 'edit' && editingShakheId) return openEditShakhe(editingShakheId);
    return openForm();
  }
  if (view === listView) return openList();
  if (view === viewShakheView) {
    if (viewingShakheId) return openShakheView(viewingShakheId);
    return returnFromShakheBrowse();
  }
  if (view === varadiGateView) return showVaradiGate();
  if (view === varadiChoiceView) {
    if (lastVaradiChoices.length) return showVaradiChoices(lastVaradiChoices);
    return showVaradiGate();
  }
  if (view === lookupView) {
    return openLookup({ reset: false, purpose: lookupPurpose, keepResults: true });
  }
  if (view === setupView) {
    if (linkedShakhe) return openSetup(linkedShakhe);
    return showHome();
  }
  if (view === shakheVaradiView) {
    if (linkedShakhe) return openVaradiReport(linkedShakhe);
    return showHome();
  }
  if (view === nagaraReportView) return openNagaraShakheVaradi({ useCache: true });
  if (view === nagaraListView) {
    if (nagaraListContext) {
      if (nagaraListContext.mode === 'program-item-split' && nagaraListContext.itemId) {
        return openProgramItemShakheSplit({
          itemId: nagaraListContext.itemId,
          itemLabel: nagaraListContext.itemLabel || '',
          entityLevel: nagaraListContext.entityLevel,
          entityId: nagaraListContext.entityId,
          entityName: nagaraListContext.entityName || '',
          vasatiId: nagaraListContext.vasatiId || '',
          titleName: nagaraListContext.titleName || '',
        });
      }
      if (nagaraListContext.mode === 'shakhe-status-split' && nagaraListContext.entityId) {
        return openShakheStatusSplit({
          entityLevel: nagaraListContext.entityLevel,
          entityId: nagaraListContext.entityId,
          entityName: nagaraListContext.entityName || '',
          vasatiId: nagaraListContext.vasatiId || '',
          itemFilter: nagaraListContext.itemFilter || 'all',
        });
      }
      if (
        nagaraListContext.mode === 'shakhe-days-ran' &&
        nagaraListContext.entityId &&
        nagaraListContext.daysRanExact != null
      ) {
        return openShakheDaysRanList({
          daysRanExact: nagaraListContext.daysRanExact,
          entityLevel: nagaraListContext.entityLevel,
          entityId: nagaraListContext.entityId,
          entityName: nagaraListContext.entityName || '',
          vasatiId: nagaraListContext.vasatiId || '',
        });
      }
      if (nagaraListContext.mode === 'program-item' && nagaraListContext.itemId) {
        return openNagaraProgramItemHits(
          nagaraListContext.vasatiId,
          nagaraListContext.titleName,
          nagaraListContext.itemId,
          nagaraListContext.itemLabel || ''
        );
      }
      if (nagaraListContext.mode === 'shakhe-varadi' && nagaraListContext.shakheId) {
        return openNagaraShakheDayVaradi(
          nagaraListContext.shakheId,
          nagaraListContext.nagarId || ''
        );
      }
      if (nagaraListContext.mode === 'shakhes') {
        return openNagaraShakheDrilldown(
          nagaraListContext.vasatiId,
          nagaraListContext.titleName,
          nagaraListContext.filter || 'all'
        );
      }
      return openNagaraUpavasatiList(
        nagaraListContext.vasatiId,
        nagaraListContext.titleName,
        nagaraListContext.filter || 'all'
      );
    }
    return openNagaraShakheVaradi({ useCache: true });
  }
  if (view === varadiPlaceholderView) return showHome();
  if (view === upasthitiView) {
    if (linkedShakhe) return openDaily(linkedShakhe);
    return showHome();
  }
  return showHome();
}

window.addEventListener('popstate', (e) => {
  const state = e.state;
  const seq = state && typeof state.navSeq === 'number' ? state.navSeq : null;
  const view = seq !== null ? navViewBySeq.get(seq) : null;
  restoringHistory = true;
  try {
    restoreView(view);
  } finally {
    restoringHistory = false;
  }
});

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
    } catch (_) { }
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
    } catch (_) { }
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
  sessionLevel = null;
  sessionEntityId = null;
  sessionEntityName = null;
  varadiDrillStack = [];
  reportScopeLevel = 'nagara';
  reportScopeEntityId = null;
  reportScopeEntityName = null;
  varadiPendingCredentials = null;
  nagaraReportCache = null;
  nagaraListContext = null;
  nagaraReportKind = 'shakhe';
  shakheDaysColumnsOpen = false;
  shakheReturnTo = 'patti';
  setNagaraAuthed(false);
  syncHomeActionsForLevel(null);
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
  } catch (_) { }
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
  } catch (_) { }
}

const RECENT_SHAKHE_KEY = 'shakhe-phone-recent:v1';
const RECENT_SHAKHE_MAX = 5;

function loadRecentShakhes() {
  try {
    const raw = localStorage.getItem(RECENT_SHAKHE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((r) => r && r.id && r.phone).slice(0, RECENT_SHAKHE_MAX) : [];
  } catch (_) {
    return [];
  }
}

function saveRecentShakhe(shakhe, phone) {
  if (!shakhe || !shakhe.id) return;
  const digits = String(phone || confirmPhone || '').replace(/\D/g, '');
  if (digits.length < 6) return;
  const entry = {
    id: String(shakhe.id),
    name: shakhe.name || '',
    phone: digits,
    upavasatiName: (shakhe.upavasati && shakhe.upavasati.name) || '',
    vasatiName: (shakhe.vasati && shakhe.vasati.name) || '',
    timing: shakhe.timing || '',
    time: shakhe.time || '',
    setupComplete: Boolean(shakhe.setupComplete),
    at: Date.now(),
  };
  const next = [entry, ...loadRecentShakhes().filter((r) => String(r.id) !== entry.id)].slice(
    0,
    RECENT_SHAKHE_MAX
  );
  try {
    localStorage.setItem(RECENT_SHAKHE_KEY, JSON.stringify(next));
  } catch (_) { }
}

function hideLookupRecent() {
  const wrap = document.getElementById('lookup-recent');
  if (wrap) wrap.classList.add('hidden');
}

function paintLookupRecent() {
  const wrap = document.getElementById('lookup-recent');
  const listEl = document.getElementById('lookup-recent-list');
  if (!wrap || !listEl) return;
  const phoneInput = document.getElementById('lookup-phone');
  const results = document.getElementById('lookup-results');
  const typing = phoneInput && String(phoneInput.value || '').replace(/\D/g, '').length > 0;
  const hasResults = results && results.children.length > 0;
  if (typing || hasResults) {
    wrap.classList.add('hidden');
    return;
  }
  const recent = loadRecentShakhes();
  if (!recent.length) {
    wrap.classList.add('hidden');
    listEl.innerHTML = '';
    return;
  }
  listEl.innerHTML = '';
  recent.forEach((r) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    const place = [r.upavasatiName, r.vasatiName, TIMING_LABEL[r.timing] || r.timing]
      .filter(Boolean)
      .join(' · ');
    btn.textContent = place ? `${r.name} — ${place}` : r.name || r.phone;
    btn.addEventListener('click', () => enterRecentShakhe(r));
    li.appendChild(btn);
    listEl.appendChild(li);
  });
  wrap.classList.remove('hidden');
}

async function enterRecentShakhe(entry) {
  if (!entry || !entry.id || !entry.phone) return;
  const errorEl = document.getElementById('lookup-error');
  errorEl.classList.add('hidden');
  hideLookupRecent();
  const session = await establishPhoneSession(entry.phone, lookupPurpose);
  if (!session.ok) {
    errorEl.textContent =
      session.status === 429
        ? 'ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ/Try again later'
        : session.error || 'ಸೆಷನ್ ಉಳಿಸಲಾಗಲಿಲ್ಲ/Could not save session';
    errorEl.classList.remove('hidden');
    paintLookupRecent();
    return;
  }
  setHomeSessionMessage('');
  document.getElementById('lookup-phone').value = entry.phone;
  const list = await loadPhoneShakhes(confirmPhone);
  phoneShakhes = list;
  syncSwitchShakheButtons();
  const shakhe = list.find((s) => s && String(s.id) === String(entry.id));
  if (!shakhe) {
    document.getElementById('lookup-results').innerHTML =
      '<li class="no-match">ಶಾಖೆ ಸಿಗಲಿಲ್ಲ/No shakhe for this phone.</li>';
    return;
  }
  await enterShakhe(shakhe);
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
  } catch (_) { }
}

async function clearStalePhoneCookie() {
  try {
    await fetch('/api/phone/logout', { method: 'POST' });
  } catch (_) { }
}

function bounceIfVaradiAuth(res, data) {
  if (!(res && res.status === 401)) return false;
  if (
    !document.documentElement.classList.contains('nagara-authed') &&
    !nagaraId &&
    !sessionEntityId
  ) {
    return false;
  }
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
  openLookup({ reset: true, purpose: lookupPurpose || 'upasthiti' });
  return true;
}

function showHome() {
  const place = document.getElementById('nagara-home-place');
  if (place) {
    const label = sessionEntityName
      ? reportPlaceLabel(sessionLevel || 'nagara', sessionEntityName)
      : nagaraName || '';
    place.textContent = label;
    place.classList.toggle('hidden', !label);
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

function syncHomeActionsForLevel(level) {
  const nagaraActions = document.getElementById('nagara-actions');
  if (!nagaraActions) return;
  const createBtn = document.getElementById('open-form-btn');
  const listBtn = document.getElementById('open-list-btn');
  const isNagara = level === 'nagara';
  if (createBtn) createBtn.classList.toggle('hidden', level && !isNagara);
  if (listBtn) listBtn.classList.toggle('hidden', level && !isNagara);
}

function resetReportScopeToSession() {
  varadiDrillStack = [];
  reportScopeLevel = sessionLevel || 'nagara';
  reportScopeEntityId = sessionEntityId || nagaraId;
  reportScopeEntityName = sessionEntityName || nagaraName || '';
  if (reportScopeLevel === 'nagara') {
    nagaraId = reportScopeEntityId;
    nagaraName = reportScopeEntityName;
  } else {
    nagaraId = null;
    nagaraName = '';
  }
  nagaraReportCache = null;
}

async function openFromSession(data) {
  if (!data || !data.level || !data.entityId) {
    showVaradiGate({ message: 'ಈ ಖಾತೆಗೆ ವರದಿ ಇಲ್ಲ/No Varadi access for this account' });
    return;
  }
  if (!VARADI_LEVELS.includes(data.level)) {
    showVaradiGate({ message: 'ಈ ಖಾತೆಗೆ ವರದಿ ಇಲ್ಲ/No Varadi access for this account' });
    return;
  }
  setHomeSessionMessage('');
  sessionLevel = data.level;
  sessionEntityId = data.entityId;
  sessionEntityName = data.entityName || '';
  resetReportScopeToSession();
  setNagaraAuthed(true);
  syncHomeActionsForLevel(data.level);
  armVaradiLogout(data.expiresIn);
  showHome();
  // Higher scopes land on Shakhe Varadi immediately so the hierarchy is visible.
  if (data.level !== 'nagara') {
    openNagaraShakheVaradi({ kind: 'shakhe' });
  }
}

function showVaradiChoices(choices) {
  lastVaradiChoices = choices || [];
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
  } catch (_) { }
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
  function clearBearerSelection(focusSearch) {
    resetBearer(key, blockId);
    if (key === 'mukhashikshak') closePhoneExists();
    refreshSubmit();
    if (typeof refreshDailySubmit === 'function') refreshDailySubmit();
    if (focusSearch) {
      const search = block.querySelector('.ob-search');
      if (search) search.focus();
    }
  }
  block.querySelector('.ob-clear').addEventListener('click', () => clearBearerSelection(true));
  const removeBtn = block.querySelector('.ob-remove');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => clearBearerSelection(false));
  }
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

const FIELD_ENTER_MSG = 'ನಮೂದಿಸಿ/Enter';
const FIELD_SELECT_MSG = 'ಆಯ್ಕೆಮಾಡಿ/Select';
const STANA_LEN_MSG = 'ಸ್ಥಳದ ಹೆಸರು 5 ರಿಂದ 60 ಅಕ್ಷರ/Sthala name must be 5 to 60 characters';
const COUNT_MAX = 1000;

function clearFieldErrors(ids) {
  (ids || []).forEach((id) => setFieldError(id, ''));
}

function showShakheStep1Errors() {
  clearFieldErrors([
    'shakhe-vibhag',
    'shakhe-bhag',
    'shakhe-nagar',
    'shakhe-vasati',
    'shakhe-upavasati',
    'shakhe-name',
    'shakhe-timing',
    'shakhe-time',
    'shakhe-type',
  ]);
  let ok = true;
  if (!hierarchyLocked()) {
    if (!document.getElementById('shakhe-vibhag').value) {
      setFieldError('shakhe-vibhag', FIELD_SELECT_MSG);
      ok = false;
    }
    if (!document.getElementById('shakhe-bhag').value) {
      setFieldError('shakhe-bhag', FIELD_SELECT_MSG);
      ok = false;
    }
    if (!document.getElementById('shakhe-nagar').value) {
      setFieldError('shakhe-nagar', FIELD_SELECT_MSG);
      ok = false;
    }
  }
  if (!document.getElementById('shakhe-vasati').value) {
    setFieldError('shakhe-vasati', FIELD_SELECT_MSG);
    ok = false;
  }
  if (!document.getElementById('shakhe-upavasati').value) {
    setFieldError('shakhe-upavasati', FIELD_SELECT_MSG);
    ok = false;
  }
  if (!document.getElementById('shakhe-name').value.trim()) {
    setFieldError('shakhe-name', FIELD_ENTER_MSG);
    ok = false;
  }
  if (!document.getElementById('shakhe-time').value) {
    setFieldError('shakhe-time', FIELD_SELECT_MSG);
    ok = false;
  }
  if (!document.getElementById('shakhe-type').value) {
    setFieldError('shakhe-type', FIELD_SELECT_MSG);
    ok = false;
  }
  return ok;
}

function showShakheStep2Errors() {
  clearFieldErrors([
    'mukhashikshak-phone',
    'karyavaha-phone',
    'palaka-phone',
    'shakhe-stana-name',
    'shakhe-location',
  ]);
  let ok = true;
  if (!phoneOk(personPhone(bearers.mukhashikshak), false)) {
    setFieldError('mukhashikshak-phone', 'ಹುಡುಕಿ ಆಯ್ಕೆಮಾಡಿ/Search and select');
    ok = false;
  }
  const stana = document.getElementById('shakhe-stana-name').value.trim();
  if (!stana) {
    setFieldError('shakhe-stana-name', FIELD_ENTER_MSG);
    ok = false;
  } else if (stana.length < 5 || stana.length > 60) {
    setFieldError('shakhe-stana-name', STANA_LEN_MSG);
    ok = false;
  }
  // Google location is optional.
  return ok;
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
    stana.length <= 60
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
  // Keep Next/Submit clickable so empty required fields can show under-field warnings.
  const next = document.getElementById('shakhe-step-next');
  const submit = document.getElementById('shakhe-submit');
  if (next) next.disabled = false;
  if (submit) submit.disabled = false;
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
  } catch (_) { }
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
  } catch (_) { }
}

const HIERARCHY_CHAIN = [
  { sthara: 'Vibhag', id: 'shakhe-vibhag', next: 'Bhag', wait: WAIT_SELECT_VIBHAG },
  { sthara: 'Bhag', id: 'shakhe-bhag', next: 'Nagar', wait: WAIT_SELECT_BHAG },
  { sthara: 'Nagar', id: 'shakhe-nagar', next: 'Vasati', wait: WAIT_SELECT_NAGARA },
  { sthara: 'Vasati', id: 'shakhe-vasati', next: 'Upavasati', wait: WAIT_SELECT_VASATI },
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
  fillSelect(bhag, [], WAIT_SELECT_VIBHAG);
  bhag.disabled = true;
  fillSelect(nagar, [], WAIT_SELECT_BHAG);
  nagar.disabled = true;
  fillSelect(vasati, [], WAIT_SELECT_NAGARA);
  vasati.disabled = true;
  fillSelect(upa, [], WAIT_SELECT_VASATI);
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
  fillSelect(document.getElementById('shakhe-upavasati'), [], WAIT_SELECT_VASATI);
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
    await loadFormHierarchy();

    const res = await fetch(`/api/shakhe/${encodeURIComponent(id)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      formError.textContent = data.error || 'ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load';
      formError.classList.remove('hidden');
      return;
    }
    const row = { ...cached, ...data };

    // Lock hierarchy to this shakhe's place (works for prant/vibhag/bhag/nagara varadi).
    setHierarchyLocked(true);
    document.getElementById('locked-vibhag').textContent = (row.vibhag && row.vibhag.name) || '—';
    document.getElementById('locked-bhag').textContent = (row.bhag && row.bhag.name) || '—';
    document.getElementById('locked-nagar').textContent = (row.nagar && row.nagar.name) || '—';
    lockedIds = {
      vibhagId: (row.vibhag && row.vibhag.id) || '',
      bhagId: (row.bhag && row.bhag.id) || '',
      nagarId: (row.nagar && row.nagar.id) || '',
    };

    const vasati = document.getElementById('shakhe-vasati');
    const nagarIdForVasati = lockedIds.nagarId;
    if (nagarIdForVasati) {
      await loadChildOptions(nagarIdForVasati, 'Vasati', vasati, SELECT_PLACEHOLDER);
    } else {
      fillSelect(vasati, [], SELECT_PLACEHOLDER);
      vasati.disabled = false;
    }
    if (row.vasati && row.vasati.id) {
      vasati.value = row.vasati.id;
      const upa = document.getElementById('shakhe-upavasati');
      await loadChildOptions(vasati.value, 'Upavasati', upa, SELECT_PLACEHOLDER);
      if (row.upavasati && row.upavasati.id) upa.value = row.upavasati.id;
    }
    document.getElementById('shakhe-name').value = row.name || '';
    document.getElementById('shakhe-time').value = row.time || '';
    document.getElementById('shakhe-timing').value = timingFromTime(row.time) || row.timing || '';
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

function returnToNagaraListContext() {
  const ctx = nagaraListContext;
  if (!ctx) return openNagaraShakheVaradi({ useCache: true, kind: nagaraReportKind });
  if (ctx.mode === 'program-item-split' && ctx.itemId && ctx.entityId) {
    return openProgramItemShakheSplit({
      itemId: ctx.itemId,
      itemLabel: ctx.itemLabel || '',
      entityLevel: ctx.entityLevel,
      entityId: ctx.entityId,
      entityName: ctx.entityName || '',
      vasatiId: ctx.vasatiId || '',
      titleName: ctx.titleName || '',
    });
  }
  if (ctx.mode === 'shakhe-status-split' && ctx.entityId && ctx.entityLevel) {
    return openShakheStatusSplit({
      entityLevel: ctx.entityLevel,
      entityId: ctx.entityId,
      entityName: ctx.entityName || '',
      vasatiId: ctx.vasatiId || '',
      itemFilter: ctx.itemFilter || 'all',
    });
  }
  if (ctx.mode === 'shakhe-days-ran' && ctx.entityId && ctx.entityLevel && ctx.daysRanExact != null) {
    return openShakheDaysRanList({
      daysRanExact: ctx.daysRanExact,
      entityLevel: ctx.entityLevel,
      entityId: ctx.entityId,
      entityName: ctx.entityName || '',
      vasatiId: ctx.vasatiId || '',
    });
  }
  if (ctx.mode === 'program-item' && ctx.itemId) {
    return openNagaraProgramItemHits(
      ctx.vasatiId,
      ctx.titleName,
      ctx.itemId,
      ctx.itemLabel || ''
    );
  }
  if (ctx.mode === 'shakhe-varadi' && ctx.shakheId) {
    return openNagaraShakheDayVaradi(ctx.shakheId, ctx.nagarId || '');
  }
  if (ctx.mode === 'shakhes') {
    return openNagaraShakheDrilldown(ctx.vasatiId, ctx.titleName, ctx.filter || 'all');
  }
  if (ctx.mode === 'upavasatis') {
    return openNagaraUpavasatiList(ctx.vasatiId, ctx.titleName, ctx.filter || 'all');
  }
  return openNagaraShakheVaradi({ useCache: true, kind: nagaraReportKind });
}

function returnFromShakheBrowse() {
  if (shakheReturnTo === 'nagara-varadi-list' && nagaraListContext) {
    return returnToNagaraListContext();
  }
  if (shakheReturnTo === 'nagara-varadi') {
    return openNagaraShakheVaradi({ useCache: true, kind: nagaraReportKind });
  }
  return openList();
}

async function openList() {
  shakheReturnTo = 'patti';
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
    body.innerHTML = '<p class="username">ಈ ತಾಲ್ಲೂಕು/ನಗರದಲ್ಲಿ ಶಾಖೆಗಳಿಲ್ಲ/No shakhes in this nagara yet.</p>';
    return;
  }
  paintShakheList();
}

function isReportHidden(s) {
  return !!(s && s.reportHidden);
}

function mergeListShakhe(updated) {
  if (!updated || !updated.id) return;
  const idx = listShakhes.findIndex((s) => String(s.id) === String(updated.id));
  if (idx >= 0) listShakhes[idx] = { ...listShakhes[idx], ...updated };
  else listShakhes.push(updated);
}

async function setShakheReportHidden(id, hidden) {
  const res = await fetch(
    `/api/shakhe/${encodeURIComponent(id)}/report-${hidden ? 'hide' : 'unhide'}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: todayIst() }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (bounceIfVaradiAuth(res, data)) return null;
  if (!res.ok) {
    window.alert((data && data.error) || 'Could not update hide state');
    return null;
  }
  mergeListShakhe(data);
  return data;
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
  // Split at first "/" where left has Kannada/non-ASCII and right starts in Latin.
  // Supports English that itself contains "/":
  // ಶಾಖಾಯುಕ್ತ ಗ್ರಾಮ/ಉಪವಸತಿ/Shakhayuktha Grama/Upavasati
  // → kn "ಶಾಖಾಯುಕ್ತ ಗ್ರಾಮ/ಉಪವಸತಿ", en "Shakhayuktha Grama/Upavasati"
  let split = -1;
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] !== '/') continue;
    const left = raw.slice(0, i);
    const right = raw.slice(i + 1);
    if (/[^\x00-\x7F]/.test(left) && /^[A-Za-z]/.test(right)) {
      split = i;
      break;
    }
  }
  if (split < 0) {
    const i = raw.indexOf('/');
    if (i < 0) return escapeHtml(raw);
    split = i;
  }
  return (
    `<span class="th-stack"><span class="th-kn">${escapeHtml(raw.slice(0, split))}</span>` +
    `<span class="th-en">${escapeHtml(raw.slice(split + 1))}</span></span>`
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
  const omitPlace = !!(opts && opts.omitPlace);
  const cols = omitPlace
    ? [
      'ಶಾಖೆ/Shakhe',
      'ಸಮಯ/Timing',
      'ಪ್ರಕಾರ/Type',
      'ಸ್ಥಳ/Sthala',
      'ತಿದ್ದುಪಡಿ/Edit',
    ]
    : [
      LABEL_VASATI,
      LABEL_UPAVASATI,
      'ಶಾಖೆ/Shakhe',
      'ಸಮಯ/Timing',
      'ಪ್ರಕಾರ/Type',
      'ಸ್ಥಳ/Sthala',
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

function shakheListCells(s, opts) {
  const omitPlace = !!(opts && opts.omitPlace);
  const timing = TIMING_LABEL[s.timing] || s.timing || '—';
  const time = s.time || '';
  const timingHtml = time
    ? `${escapeHtml(timing)}<span class="cell-sub">${escapeHtml(time)}</span>`
    : escapeHtml(timing);
  const nagarAttr = (s.nagar && s.nagar.id) || '';
  const plainName = !!(opts && opts.plainName);
  const place =
    omitPlace
      ? ''
      : `<td class="cell-text">${escapeHtml((s.vasati && s.vasati.name) || '—')}</td>` +
      `<td class="cell-text">${escapeHtml((s.upavasati && s.upavasati.name) || '—')}</td>`;
  const nameCell = plainName
    ? `<td class="cell-name">${escapeHtml(s.name || '—')}</td>`
    : `<td class="cell-name"><button type="button" class="num-link" data-shakhe-id="${escapeHtml(
      s.id
    )}" data-nagar-id="${escapeHtml(nagarAttr)}">${escapeHtml(s.name || '—')}</button></td>`;
  return (
    place +
    nameCell +
    `<td class="cell-timing">${timingHtml}</td>` +
    `<td class="cell-text">${escapeHtml(TYPE_LABEL[s.shakheType] || s.shakheType || '—')}</td>` +
    `<td class="cell-text">${escapeHtml(s.stanaName || 'ಇಲ್ಲ/Not set')}</td>` +
    `<td><button type="button" class="edit-link" data-edit-id="${escapeHtml(s.id)}"><span class="th-stack"><span class="th-kn">ತಿದ್ದುಪಡಿ</span><span class="th-en">Edit</span></span></button></td>`
  );
}

function paintShakheList() {
  const body = document.getElementById('list-body');
  const filtered = filteredListShakhes();
  const visible = filtered.filter((s) => !isReportHidden(s));
  const hiddenItems = filtered.filter((s) => isReportHidden(s));
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
    `<button type="button" class="secondary" data-list-hidden-toggle>ಮರೆಯಾದವು/Hidden (${hiddenItems.length})</button>` +
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
    hideBtn.addEventListener('click', async () => {
      const ids = [...body.querySelectorAll('input[data-hide-id]:checked')].map((el) =>
        String(el.getAttribute('data-hide-id'))
      );
      if (!ids.length) return;
      hideBtn.disabled = true;
      for (const id of ids) {
        await setShakheReportHidden(id, true);
      }
      paintShakheList();
    });
  }
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => panel.classList.toggle('hidden'));
  }
  body.querySelectorAll('[data-unhide-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await setShakheReportHidden(btn.getAttribute('data-unhide-id'), false);
      paintShakheList();
    });
  });
}

document.getElementById('open-create-shakhe-btn').addEventListener('click', openForm);
document.getElementById('open-nagara-login-btn').addEventListener('click', async () => {
  try {
    const res = await fetch('/api/varadi/session');
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok && VARADI_LEVELS.includes(data.level)) {
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
  } catch (_) { }
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
  } catch (_) { }
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
document.getElementById('open-nagara-shakhe-varadi-btn').addEventListener('click', () => {
  resetReportScopeToSession();
  openNagaraShakheVaradi({ kind: 'shakhe' });
});
document.getElementById('open-nagara-sharirik-varadi-btn').addEventListener('click', () => {
  resetReportScopeToSession();
  openNagaraShakheVaradi({ kind: 'sharirik' });
});
document.getElementById('open-nagara-boudhik-varadi-btn').addEventListener('click', () => {
  resetReportScopeToSession();
  openNagaraShakheVaradi({ kind: 'boudhik' });
});
document.getElementById('nagara-report-back').addEventListener('click', () => popReportDrill());
document.getElementById('nagara-list-back').addEventListener('click', () => {
  if (nagaraListContext && nagaraListContext.mode === 'program-item-split' && nagaraListContext.selectedHitId) {
    nagaraListContext.selectedHitId = null;
    paintProgramItemShakheSplitBody();
    return;
  }
  if (nagaraListContext && nagaraListContext.mode === 'shakhe-varadi') {
    const ret = nagaraListContext.listReturn || {};
    if (ret.mode === 'shakhe-status-split' && ret.entityId && ret.entityLevel) {
      return openShakheStatusSplit({
        entityLevel: ret.entityLevel,
        entityId: ret.entityId,
        entityName: ret.entityName || '',
        vasatiId: ret.vasatiId || '',
        itemFilter: ret.itemFilter || 'all',
      });
    }
    if (ret.mode === 'shakhe-days-ran' && ret.entityId && ret.entityLevel && ret.daysRanExact != null) {
      return openShakheDaysRanList({
        daysRanExact: ret.daysRanExact,
        entityLevel: ret.entityLevel,
        entityId: ret.entityId,
        entityName: ret.entityName || '',
        vasatiId: ret.vasatiId || '',
      });
    }
    if (ret.mode === 'program-item-split' && ret.itemId && ret.entityId) {
      return openProgramItemShakheSplit({
        itemId: ret.itemId,
        itemLabel: ret.itemLabel || '',
        entityLevel: ret.entityLevel,
        entityId: ret.entityId,
        entityName: ret.entityName || '',
        vasatiId: ret.vasatiId || '',
        titleName: ret.titleName || '',
      });
    }
    if (nagaraId || reportScopeLevel === 'nagara') {
      return openNagaraShakheDrilldown(
        nagaraListContext.vasatiId,
        nagaraListContext.titleName,
        nagaraListContext.filter || 'all'
      );
    }
    shakheReturnTo = 'nagara-varadi';
    return openNagaraShakheVaradi({ useCache: true, kind: nagaraReportKind });
  }
  if (nagaraListContext && nagaraListContext.mode === 'shakhe-status-split') {
    const path = Array.isArray(nagaraListContext.splitPath) ? nagaraListContext.splitPath : [];
    if (path.length) {
      // Leave hierarchy drill (All › …) first; stay on Yojita/Nadayuthiruva list.
      nagaraListContext.splitPath = [];
      paintShakheStatusSplitBody();
      return;
    }
    shakheReturnTo = 'nagara-varadi';
    return openNagaraShakheVaradi({ useCache: true, kind: nagaraReportKind });
  }
  if (nagaraListContext && nagaraListContext.mode === 'program-item-split') {
    const path = Array.isArray(nagaraListContext.splitPath) ? nagaraListContext.splitPath : [];
    if (path.length) {
      nagaraListContext.splitPath = [];
      paintProgramItemShakheSplitBody();
      return;
    }
    shakheReturnTo = 'nagara-varadi';
    return openNagaraShakheVaradi({ useCache: true, kind: nagaraReportKind });
  }
  if (
    nagaraListContext &&
    (nagaraListContext.mode === 'program-item' || nagaraListContext.mode === 'shakhe-days-ran')
  ) {
    shakheReturnTo = 'nagara-varadi';
    return openNagaraShakheVaradi({ useCache: true, kind: nagaraReportKind });
  }
  shakheReturnTo = 'nagara-varadi';
  openNagaraShakheVaradi({ useCache: true });
});
document.getElementById('varadi-placeholder-back').addEventListener('click', showHome);
['nagara-varadi-from', 'nagara-varadi-to'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', () => openNagaraShakheVaradi({ kind: nagaraReportKind }));
});
const nagaraExcludeSundayEl = document.getElementById('nagara-exclude-sunday');
if (nagaraExcludeSundayEl) {
  nagaraExcludeSundayEl.addEventListener('change', () => {
    nagaraReportCache = null;
    openNagaraShakheVaradi({ kind: nagaraReportKind });
  });
}
const nagaraProgramDayFilterEl = document.getElementById('nagara-program-day-filter');
if (nagaraProgramDayFilterEl) {
  nagaraProgramDayFilterEl.addEventListener('change', () => {
    nagaraReportCache = null;
    openNagaraShakheVaradi({ kind: nagaraReportKind });
  });
}
document.getElementById('form-back').addEventListener('click', () => {
  if (shakheStep === 2) {
    setShakheStep(1);
    return;
  }
  if (formMode === 'edit') {
    returnFromShakheBrowse();
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
document.getElementById('view-shakhe-back').addEventListener('click', () => returnFromShakheBrowse());
document.getElementById('success-done').addEventListener('click', () => {
  if (formMode === 'edit') {
    returnFromShakheBrowse();
    return;
  }
  showHome();
});

document.getElementById('nagara-logout').addEventListener('click', async () => {
  try {
    await fetch('/api/varadi/logout', { method: 'POST' });
  } catch (_) { }
  logoutLocal();
  setHomeSessionMessage('');
  showHome();
});

document.getElementById('phone-logout').addEventListener('click', async () => {
  try {
    await fetch('/api/phone/logout', { method: 'POST' });
  } catch (_) { }
  const purpose = lookupPurpose || 'upasthiti';
  logoutPhoneLocal();
  setHomeSessionMessage('');
  openLookup({ reset: true, purpose });
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
            ? 'ಈ ಖಾತೆಗೆ ವರದಿ ಇಲ್ಲ/No Varadi access for this account'
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

['shakhe-vibhag', 'shakhe-bhag', 'shakhe-nagar', 'shakhe-vasati', 'shakhe-upavasati', 'shakhe-name', 'shakhe-time', 'shakhe-type', 'shakhe-stana-name'].forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener('input', refreshSubmit);
  el.addEventListener('change', refreshSubmit);
});
document.getElementById('shakhe-time').addEventListener('change', () => {
  document.getElementById('shakhe-timing').value = timingFromTime(document.getElementById('shakhe-time').value);
});
document.getElementById('shakhe-time').addEventListener('input', () => {
  document.getElementById('shakhe-timing').value = timingFromTime(document.getElementById('shakhe-time').value);
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
    if (!showShakheStep1Errors()) {
      refreshSubmit();
      return;
    }
    setShakheStep(2);
    return;
  }
  formError.classList.add('hidden');
  if (!step1Complete()) {
    setShakheStep(1);
    showShakheStep1Errors();
    refreshSubmit();
    return;
  }
  if (!showShakheStep2Errors()) {
    setShakheStep(2);
    refreshSubmit();
    return;
  }

  const submit = document.getElementById('shakhe-submit');
  submit.disabled = true;
  const timeVal = document.getElementById('shakhe-time').value;
  const time = timeVal.length >= 5 ? timeVal.slice(0, 5) : timeVal;
  const timing = timingFromTime(time);
  document.getElementById('shakhe-timing').value = timing;
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
      timing,
      time,
      shakheType: document.getElementById('shakhe-type').value,
      mukhashikshakPhone: personPhone(bearers.mukhashikshak),
      mukhashikshakName: (bearers.mukhashikshak && bearers.mukhashikshak.name) || '',
      karyavahaPhone: personPhone(bearers.karyavaha),
      karyavahaName: (bearers.karyavaha && bearers.karyavaha.name) || '',
      shakhaPalakaPhone: personPhone(bearers.palaka),
      shakhaPalakaName: (bearers.palaka && bearers.palaka.name) || '',
      stanaName: document.getElementById('shakhe-stana-name').value.trim(),
      location: formPlace.isConfirmed() ? formPlace.coords() : { lat: null, lng: null },
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
    kv(LABEL_VIBHAG, s.vibhag && s.vibhag.name) +
    kv(LABEL_BHAG, s.bhag && s.bhag.name) +
    kv(LABEL_NAGARA, s.nagar && s.nagar.name) +
    kv(LABEL_VASATI, s.vasati && s.vasati.name) +
    kv(LABEL_UPAVASATI, s.upavasati && s.upavasati.name) +
    kv('ಸಮಯ ವಿಭಾಗ/Timing', TIMING_LABEL[s.timing] || s.timing) +
    kv('ಸಮಯ/Time', s.time) +
    kv('ಪ್ರಕಾರ/Type', TYPE_LABEL[s.shakheType] || s.shakheType) +
    kv('ಸ್ಥಳದ ಹೆಸರು/Sthala name', s.stanaName || '—') +
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
  viewingShakheId = id;
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
  // Google map/location row stays hidden; Sthala name is in the summary above.
  if (!data.setupComplete && !data.stanaName) {
    pending.classList.remove('hidden');
  }
}

function bindDigitField(el, maxLen, maxValue) {
  if (!el) return;
  el.addEventListener('input', () => {
    let digits = String(el.value || '').replace(/\D/g, '').slice(0, maxLen);
    if (maxValue != null && digits !== '') {
      const n = Number(digits);
      if (Number.isFinite(n) && n > maxValue) digits = String(maxValue);
    }
    el.value = digits;
  });
}

function countVal(id) {
  const raw = document.getElementById(id).value.trim();
  if (raw === '') return null;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > COUNT_MAX) return null;
  return n;
}

/** Empty Taruna/Balaka/Shishu/Mata → 0 (keeps totals / sarisumaru stable). */
function ensureUpasthitiCountDefaults() {
  ['count-taruna', 'count-balaka', 'count-shishu', 'count-mata'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (String(el.value || '').trim() === '') el.value = '0';
    setFieldError(id, '');
  });
  refreshTotal();
}

const UPASTHITI_COUNT_IDS = ['count-taruna', 'count-balaka', 'count-shishu', 'count-mata'];
const UPASTHITI_COUNT_GT0_MSG =
  'ಕನಿಷ್ಠ ಒಂದು ಸಂಖ್ಯೆ > 0 ನಮೂದಿಸಿ/Enter at least one number greater than 0';

/** At least one of Taruna/Balaka/Shishu/Mata must be > 0. Empty fields become 0 first. */
function validateUpasthitiCounts() {
  ensureUpasthitiCountDefaults();
  const values = UPASTHITI_COUNT_IDS.map((id) => countVal(id) ?? 0);
  const ok = values.some((n) => n > 0);
  if (ok) {
    UPASTHITI_COUNT_IDS.forEach((id) => setFieldError(id, ''));
    return true;
  }
  UPASTHITI_COUNT_IDS.forEach((id) => setFieldError(id, UPASTHITI_COUNT_GT0_MSG));
  return false;
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
  hideLookupRecent();
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
    hideLookupRecent();
    paintPhoneShakheResults(phoneShakhes);
  } else {
    paintLookupRecent();
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

function openVaradiPlaceholder(kn, en) {
  const title = document.getElementById('varadi-placeholder-title');
  if (title) {
    title.innerHTML =
      `<span class="title-kn">${escapeHtml(kn)}</span>` +
      `<span class="title-en">${escapeHtml(en)}</span>`;
  }
  showScreen(varadiPlaceholderView);
}

function isSundayIso(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return false;
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay() === 0;
}

function nagaraExcludeSunday() {
  const el = document.getElementById('nagara-exclude-sunday');
  return Boolean(el && el.checked);
}

function syncNagaraProgramDayFilter(dayCount, enabled) {
  const wrap = document.getElementById('nagara-program-day-filter-wrap');
  const select = document.getElementById('nagara-program-day-filter');
  if (!wrap || !select) return;
  wrap.classList.toggle('hidden', !enabled);
  if (!enabled) return;
  const prior = select.value;
  const max = Math.max(0, Number(dayCount) || 0);
  select.innerHTML =
    `<option value="">ನಡೆದಿದೆ/Happened</option>` +
    Array.from({ length: max }, (_, i) => {
      const days = i + 1;
      return `<option value="${days}">${escapeHtml(programItemDayLabel(days))}</option>`;
    }).join('');
  select.value = prior && Number(prior) <= max ? prior : '';
}

function nagaraProgramItemDayCount() {
  const select = document.getElementById('nagara-program-day-filter');
  return select && select.value ? select.value : '';
}

function setNagaraVaradiDayCount(selected) {
  const selectedEl = document.getElementById('nagara-varadi-day-count');
  if (selectedEl) {
    selectedEl.innerHTML = `ಆಯ್ಕೆ ಮಾಡಿದ ದಿನಗಳು/Days selected <strong>${escapeHtml(String(selected || 0))}</strong>`;
  }
}

function nagaraVaradiRangeDays() {
  const fromEl = document.getElementById('nagara-varadi-from');
  const toEl = document.getElementById('nagara-varadi-to');
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
  const excludeSunday = nagaraExcludeSunday();
  let count = 0;
  let cur = from;
  while (cur <= to && count < 63) {
    if (!excludeSunday || !isSundayIso(cur)) count += 1;
    cur = addDaysIso(cur, 1);
  }
  // Cap: if calendar span > 62, keep prior validation elsewhere
  let calendarCount = 0;
  cur = from;
  while (cur <= to && calendarCount < 63) {
    calendarCount += 1;
    cur = addDaysIso(cur, 1);
  }
  setNagaraVaradiDayCount(count);
  return { from, to, count, calendarCount, excludeSunday };
}

function setNagaraReportLoading(on) {
  if (!nagaraReportView) return;
  nagaraReportView.classList.toggle('is-loading', !!on);
  const loading = document.getElementById('nagara-report-loading');
  if (loading) loading.classList.toggle('hidden', !on);
}

function setNagaraListLoading(on) {
  if (!nagaraListView) return;
  nagaraListView.classList.toggle('is-loading', !!on);
  const loading = document.getElementById('nagara-list-loading');
  if (loading) loading.classList.toggle('hidden', !on);
}

/** Match server sarisumaru: exact ints stay; otherwise round up. */
function formatAvg(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const nearest = Math.round(n);
  if (Math.abs(n - nearest) < 1e-9) return String(nearest < 0 ? 0 : nearest);
  return String(Math.ceil(n));
}

function reportPlaceLabel(level, name) {
  const prefix =
    level === 'prant'
      ? 'ಪ್ರಾಂತ'
      : level === 'vibhag'
        ? 'ವಿಭಾಗ'
        : level === 'bhag'
          ? 'ಜಿಲ್ಲಾ/ಭಾಗ'
          : level === 'nagara'
            ? 'ತಾಲ್ಲೂಕು/ನಗರ'
            : '';
  const text = String(name || '').trim();
  return text ? `${prefix} - ${text}` : prefix;
}

function reportFirstColLabel(level) {
  if (level === 'prant') return LABEL_VIBHAG;
  if (level === 'vibhag') return LABEL_BHAG;
  if (level === 'bhag') return LABEL_NAGARA;
  return LABEL_VASATI;
}

function reportRowChild(row) {
  if (!row) return null;
  return row.vasati || row.nagar || row.bhag || row.vibhag || null;
}

function scopedNagarId() {
  return (
    nagaraId ||
    (reportScopeLevel === 'nagara' ? reportScopeEntityId : '') ||
    (nagaraListContext && nagaraListContext.nagarId) ||
    ''
  );
}

function withScopedNagarId(params) {
  const id = scopedNagarId();
  if (id) params.set('nagarId', id);
  return params;
}

function requireScopedNagarOrBounce(errorEl) {
  if (scopedNagarId()) return true;
  if (errorEl) {
    errorEl.textContent = 'ತಾಲ್ಲೂಕು/ನಗರ ವರದಿಯಿಂದ ತೆರೆಯಿರಿ/Open this from a Nagara report';
    errorEl.classList.remove('hidden');
  }
  openNagaraShakheVaradi({ useCache: true, kind: nagaraReportKind });
  return false;
}

function setNagaraReportPlace(data) {
  const leftEl = document.getElementById('report-bhag');
  const rightEl = document.getElementById('report-nagar');
  if (!leftEl || !rightEl) return;
  if (data && data.bhag && data.bhag.name) nagaraBhagName = data.bhag.name;
  if (data && data.vibhag && data.vibhag.name) nagaraVibhagName = data.vibhag.name;
  if (data && data.nagar && data.nagar.name) nagaraName = data.nagar.name;

  const level = (data && data.level) || reportScopeLevel || 'nagara';
  if (level === 'prant') {
    leftEl.textContent = reportPlaceLabel(
      'prant',
      (data && data.prant && data.prant.name) || reportScopeEntityName || ''
    );
    rightEl.textContent = '';
    return;
  }
  if (level === 'vibhag') {
    leftEl.textContent =
      data && data.prant && data.prant.name ? reportPlaceLabel('prant', data.prant.name) : '';
    rightEl.textContent = reportPlaceLabel(
      'vibhag',
      (data && data.vibhag && data.vibhag.name) || reportScopeEntityName || ''
    );
    return;
  }
  if (level === 'bhag') {
    leftEl.textContent =
      data && data.vibhag && data.vibhag.name
        ? reportPlaceLabel('vibhag', data.vibhag.name)
        : nagaraVibhagName
          ? reportPlaceLabel('vibhag', nagaraVibhagName)
          : '';
    rightEl.textContent = reportPlaceLabel(
      'bhag',
      (data && data.bhag && data.bhag.name) || reportScopeEntityName || ''
    );
    return;
  }
  leftEl.textContent = nagaraBhagName
    ? reportPlaceLabel('bhag', nagaraBhagName)
    : data && data.bhag && data.bhag.name
      ? reportPlaceLabel('bhag', data.bhag.name)
      : '';
  rightEl.textContent = nagaraName
    ? reportPlaceLabel('nagara', nagaraName)
    : data && data.nagar && data.nagar.name
      ? reportPlaceLabel('nagara', data.nagar.name)
      : reportPlaceLabel('nagara', reportScopeEntityName || '');
}

function drillReportInto(childLevel, entityId, entityName) {
  if (!childLevel || !entityId) return;
  varadiDrillStack.push({
    level: reportScopeLevel,
    entityId: reportScopeEntityId,
    entityName: reportScopeEntityName,
  });
  reportScopeLevel = childLevel;
  reportScopeEntityId = entityId;
  reportScopeEntityName = entityName || '';
  if (childLevel === 'nagara') {
    nagaraId = entityId;
    nagaraName = entityName || '';
  } else {
    nagaraId = null;
    nagaraName = '';
  }
  nagaraReportCache = null;
  openNagaraShakheVaradi({ kind: nagaraReportKind });
}

function popReportDrill() {
  const prev = varadiDrillStack.pop();
  if (!prev) {
    showHome();
    return;
  }
  reportScopeLevel = prev.level;
  reportScopeEntityId = prev.entityId;
  reportScopeEntityName = prev.entityName || '';
  if (prev.level === 'nagara') {
    nagaraId = prev.entityId;
    nagaraName = prev.entityName || '';
  } else {
    nagaraId = null;
    nagaraName = '';
  }
  nagaraReportCache = null;
  openNagaraShakheVaradi({ kind: nagaraReportKind });
}

function nagaraCountLink(count, kind, vasatiId, titleName) {
  const n = count || 0;
  if (n <= 0) return '0';
  return `<button type="button" class="num-link" data-list-kind="${escapeHtml(kind)}" data-vasati-id="${escapeHtml(
    vasatiId || ''
  )}" data-list-title="${escapeHtml(titleName || '')}">${n}</button>`;
}

function setNagaraReportTitle(kind) {
  const title = document.getElementById('nagara-report-title');
  if (!title) return;
  if (kind === 'boudhik') {
    title.innerHTML =
      '<span class="title-kn">ಬೌದ್ಧಿಕ್ ವರದಿ</span><span class="title-en">Boudhik Varadi</span>';
  } else if (kind === 'sharirik') {
    title.innerHTML =
      '<span class="title-kn">ಶಾರೀರಿಕ ವರದಿ</span><span class="title-en">Sharirik Varadi</span>';
  } else {
    title.innerHTML =
      '<span class="title-kn">ಶಾಖೆ ವರದಿ</span><span class="title-en">Shakhe Varadi</span>';
  }
}

function shakheStatusCountLink(count, filter, entityLevel, entityId, entityName, vasatiId) {
  const n = count || 0;
  if (n <= 0 || !entityLevel || !entityId) return String(n);
  return (
    `<button type="button" class="num-link shakhe-status-split-link" ` +
    `data-status-filter="${escapeHtml(filter || 'all')}" ` +
    `data-entity-level="${escapeHtml(entityLevel)}" ` +
    `data-entity-id="${escapeHtml(entityId)}" ` +
    `data-entity-name="${escapeHtml(entityName || '')}" ` +
    `data-vasati-id="${escapeHtml(vasatiId || '')}">${n}</button>`
  );
}

/** running/yojita ratio, opens shakhe status split. */
function shakheRunningRatioLink(running, yojita, opts) {
  const label = programRatioText(running, yojita);
  if (!opts || !opts.entityLevel || !opts.entityId) return label;
  if (!(yojita > 0)) return label;
  return (
    `<button type="button" class="num-link shakhe-status-split-link" ` +
    `data-status-filter="${escapeHtml(opts.filter || 'all')}" ` +
    `data-entity-level="${escapeHtml(opts.entityLevel)}" ` +
    `data-entity-id="${escapeHtml(opts.entityId)}" ` +
    `data-entity-name="${escapeHtml(opts.entityName || '')}" ` +
    `data-vasati-id="${escapeHtml(opts.vasatiId || '')}">${escapeHtml(label)}</button>`
  );
}

function bindNagaraReportListClicks(table) {
  table.querySelectorAll('button.num-link[data-list-kind]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.getAttribute('data-list-kind') || 'upavasati';
      const vasatiId = btn.getAttribute('data-vasati-id');
      const title = btn.getAttribute('data-list-title') || '';
      if (kind === 'upavasati') {
        openNagaraUpavasatiList(vasatiId, title, 'all');
        return;
      }
      openNagaraShakheDrilldown(vasatiId, title, kind);
    });
  });
  table.querySelectorAll('button.entity-drill-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      drillReportInto(
        btn.getAttribute('data-child-level'),
        btn.getAttribute('data-entity-id'),
        btn.getAttribute('data-entity-name') || ''
      );
    });
  });
  table.querySelectorAll('button.shakhe-status-split-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      openShakheStatusSplit({
        entityLevel: btn.getAttribute('data-entity-level'),
        entityId: btn.getAttribute('data-entity-id'),
        entityName: btn.getAttribute('data-entity-name') || '',
        vasatiId: btn.getAttribute('data-vasati-id') || '',
        itemFilter: btn.getAttribute('data-status-filter') || 'all',
      });
    });
  });
}

function daysRanBucketLabel(days) {
  const n = Number(days) || 0;
  if (n === 1) return stackedLabel('1 ದಿನ ನಡೆದಿದೆ/1 day ran');
  return stackedLabel(`${n} ದಿನ ನಡೆದಿದೆ/${n} days ran`);
}

function daysRanBucketLink(count, daysExact, opts) {
  const n = count || 0;
  if (n <= 0 || !opts || !opts.entityLevel || !opts.entityId) return String(n);
  return (
    `<button type="button" class="num-link shakhe-days-ran-link" ` +
    `data-days-ran="${escapeHtml(String(daysExact))}" ` +
    `data-entity-level="${escapeHtml(opts.entityLevel)}" ` +
    `data-entity-id="${escapeHtml(opts.entityId)}" ` +
    `data-entity-name="${escapeHtml(opts.entityName || '')}" ` +
    `data-vasati-id="${escapeHtml(opts.vasatiId || '')}">${n}</button>`
  );
}

function paintNagaraShakheVaradi(data) {
  const table = document.getElementById('nagara-report-table');
  const cell = (v) => (v == null ? '—' : String(v));
  const avgCell = (v) => formatAvg(v);
  const level = (data && data.level) || reportScopeLevel || 'nagara';
  const isLeaf = level === 'nagara';
  const nextLevel = NEXT_VARADI_LEVEL[level] || null;
  const emptyMsg = isLeaf ? 'ವಸತಿ/ಮಂಡಲಗಳಿಲ್ಲ/No vasatis' : 'ಘಟಕಗಳಿಲ್ಲ/No entities';
  const dayCount = Math.max(0, Number((data && data.dayCount) || nagaraVaradiRangeDays().count || 0));
  const daysOpen = Boolean(shakheDaysColumnsOpen);
  const daysColspan = daysOpen ? dayCount + 1 : 1;
  const toggleLabel = daysOpen ? '−' : '+';
  const daysGroupHead = daysOpen
    ? `<th class="num group-head days-ran-group-head" colspan="${daysColspan}">` +
    `<div class="days-ran-head-inner">` +
    `<span class="days-ran-group-title">${stackedLabel(
      'ಶಾಖೆ ನಡೆದಿರುವ ದಿನ ಪ್ರಕಾರ/Shakhe Nadediruva Dina Prakara'
    )}</span>` +
    `<button type="button" class="days-ran-toggle" data-days-ran-toggle="1" aria-expanded="true" title="Hide">${toggleLabel}</button>` +
    `</div></th>`
    : `<th class="num days-ran-group-head days-ran-group-collapsed" rowspan="2">` +
    `<button type="button" class="days-ran-toggle" data-days-ran-toggle="1" aria-expanded="false" title="Show">${toggleLabel}</button>` +
    `</th>`;
  const daysSubHeads = daysOpen
    ? Array.from({ length: dayCount + 1 }, (_, i) => `<th class="num">${daysRanBucketLabel(i)}</th>`).join(
      ''
    )
    : '';
  const thead =
    `<thead>` +
    `<tr>` +
    `<th rowspan="2">${stackedLabel(reportFirstColLabel(level))}</th>` +
    `<th class="num" rowspan="2">${stackedLabel('ಯೋಜಿತ ಶಾಖೆ/Yojita Shakhe')}</th>` +
    `<th class="num" rowspan="2">${stackedLabel('ನಡೆಯುತ್ತಿರುವ ಶಾಖೆಗಳು/Nadayuthiruva Shakhegalu')}</th>` +
    daysGroupHead +
    `<th class="num" rowspan="2">${stackedLabel('ನಡೆಯದ ಶಾಖೆ/Nadayada Shakhe')}</th>` +
    `<th class="num group-head" colspan="5">${stackedLabel('ಸರಾಸರಿ/Average')}</th>` +
    `<th class="num group-head" colspan="2">${stackedLabel('ಒಟ್ಟು ಸಂಪರ್ಕ/Ottu samparka')}</th>` +
    `</tr>` +
    `<tr>` +
    daysSubHeads +
    `<th class="num">${stackedLabel('ತರುಣ/Taruna')}</th>` +
    `<th class="num">${stackedLabel('ಬಾಲಕ/Balaka')}</th>` +
    `<th class="num">${stackedLabel('ಒಟ್ಟು/Total')}</th>` +
    `<th class="num">${stackedLabel('ಶಿಶು/Shishu')}</th>` +
    `<th class="num">${stackedLabel('ಮಾತಾ-ಭಗಿನಿ/Mata Bhagini')}</th>` +
    `<th class="num">${stackedLabel('ಮನೆಗಳು/Manegalu')}</th>` +
    `<th class="num">${stackedLabel('ವ್ಯಕ್ತಿಗಳು/Vyaktigalu')}</th>` +
    `</tr>` +
    `</thead>`;

  const body = (data.rows || [])
    .map((row) => {
      const a = row.averages || {};
      const s = row.ottuSamparka || {};
      const child = reportRowChild(row);
      const title = (child && child.name) || '—';
      const cid = (child && child.id) || '';
      const buckets = row.daysRanBuckets || [];
      let nameCell;
      if (isLeaf) {
        nameCell =
          `<button type="button" class="num-link vasati-name-link" data-list-kind="upavasati" ` +
          `data-vasati-id="${escapeHtml(cid)}" data-list-title="${escapeHtml(title)}">` +
          `${escapeHtml(title)}</button>`;
      } else if (nextLevel && cid) {
        nameCell =
          `<button type="button" class="num-link entity-drill-link" ` +
          `data-child-level="${escapeHtml(nextLevel)}" data-entity-id="${escapeHtml(cid)}" ` +
          `data-entity-name="${escapeHtml(title)}">${escapeHtml(title)}</button>`;
      } else {
        nameCell = escapeHtml(title);
      }
      const leafStatusOpts = isLeaf
        ? {
          entityLevel: 'nagara',
          entityId: reportScopeEntityId || nagaraId || '',
          entityName: reportScopeEntityName || nagaraName || '',
          vasatiId: cid,
        }
        : null;
      const yojita = isLeaf
        ? leafStatusOpts && leafStatusOpts.entityId
          ? shakheStatusCountLink(
            row.yojitaShakheCount,
            'all',
            leafStatusOpts.entityLevel,
            leafStatusOpts.entityId,
            title,
            leafStatusOpts.vasatiId
          )
          : cell(row.yojitaShakheCount)
        : nextLevel && cid
          ? shakheStatusCountLink(row.yojitaShakheCount, 'all', nextLevel, cid, title)
          : cell(row.yojitaShakheCount);
      const running = isLeaf
        ? leafStatusOpts && leafStatusOpts.entityId
          ? shakheStatusCountLink(
            row.nadayuthiruvaShakheCount,
            'yes',
            leafStatusOpts.entityLevel,
            leafStatusOpts.entityId,
            title,
            leafStatusOpts.vasatiId
          )
          : cell(row.nadayuthiruvaShakheCount)
        : nextLevel && cid
          ? shakheStatusCountLink(row.nadayuthiruvaShakheCount, 'yes', nextLevel, cid, title)
          : cell(row.nadayuthiruvaShakheCount);
      const notRunning = isLeaf
        ? leafStatusOpts && leafStatusOpts.entityId
          ? shakheStatusCountLink(
            row.nadayadaShakheCount,
            'no',
            leafStatusOpts.entityLevel,
            leafStatusOpts.entityId,
            title,
            leafStatusOpts.vasatiId
          )
          : cell(row.nadayadaShakheCount)
        : nextLevel && cid
          ? shakheStatusCountLink(row.nadayadaShakheCount, 'no', nextLevel, cid, title)
          : cell(row.nadayadaShakheCount);
      const daysOpts = isLeaf
        ? {
          entityLevel: 'nagara',
          entityId: reportScopeEntityId || nagaraId || '',
          entityName: reportScopeEntityName || nagaraName || '',
          vasatiId: cid,
        }
        : cid
          ? {
            entityLevel: nextLevel || level,
            entityId: cid,
            entityName: title,
          }
          : null;
      const daysCells = daysOpen
        ? Array.from({ length: dayCount + 1 }, (_, i) => {
          const count = buckets[i] || 0;
          return `<td class="num">${daysRanBucketLink(count, i, daysOpts)}</td>`;
        }).join('')
        : '';
      return (
        `<tr>` +
        `<td>${nameCell}</td>` +
        `<td class="num">${yojita}</td>` +
        `<td class="num">${running}</td>` +
        (daysOpen ? daysCells : `<td class="num days-ran-placeholder">·</td>`) +
        `<td class="num">${notRunning}</td>` +
        `<td class="num">${avgCell(a.taruna)}</td>` +
        `<td class="num">${avgCell(a.balaka)}</td>` +
        `<td class="num">${avgCell(a.total)}</td>` +
        `<td class="num">${avgCell(a.shishu)}</td>` +
        `<td class="num">${avgCell(a.mataBhagi)}</td>` +
        `<td class="num">${cell(s.manegalu)}</td>` +
        `<td class="num">${cell(s.vyaktigalu)}</td>` +
        `</tr>`
      );
    })
    .join('');

  const tot = data.totals || {};
  const ta = tot.averages || {};
  const ts = tot.ottuSamparka || {};
  const totBuckets = tot.daysRanBuckets || [];
  const totDaysCells = daysOpen
    ? Array.from({ length: dayCount + 1 }, (_, i) => {
      return `<td class="num">${cell(totBuckets[i] || 0)}</td>`;
    }).join('')
    : `<td class="num days-ran-placeholder">·</td>`;
  const colCount = 10 + (daysOpen ? dayCount + 1 : 1);
  const foot =
    `<tr class="report-total-row">` +
    `<td>${stackedLabel('ಒಟ್ಟು/Total')}</td>` +
    `<td class="num">${cell(tot.yojitaShakheCount)}</td>` +
    `<td class="num">${cell(tot.nadayuthiruvaShakheCount)}</td>` +
    totDaysCells +
    `<td class="num">${cell(tot.nadayadaShakheCount)}</td>` +
    `<td class="num">${avgCell(ta.taruna)}</td>` +
    `<td class="num">${avgCell(ta.balaka)}</td>` +
    `<td class="num">${avgCell(ta.total)}</td>` +
    `<td class="num">${avgCell(ta.shishu)}</td>` +
    `<td class="num">${avgCell(ta.mataBhagi)}</td>` +
    `<td class="num">${cell(ts.manegalu)}</td>` +
    `<td class="num">${cell(ts.vyaktigalu)}</td>` +
    `</tr>`;

  table.innerHTML =
    thead +
    `<tbody>${body || `<tr><td colspan="${colCount}">${emptyMsg}</td></tr>`}</tbody>` +
    (data.rows && data.rows.length ? `<tfoot>${foot}</tfoot>` : '');
  bindNagaraReportListClicks(table);
  table.querySelectorAll('[data-days-ran-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      shakheDaysColumnsOpen = !shakheDaysColumnsOpen;
      paintNagaraShakheVaradi(nagaraReportCache || data);
    });
  });
  table.querySelectorAll('button.shakhe-days-ran-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      openShakheDaysRanList({
        daysRanExact: Number(btn.getAttribute('data-days-ran')),
        entityLevel: btn.getAttribute('data-entity-level'),
        entityId: btn.getAttribute('data-entity-id'),
        entityName: btn.getAttribute('data-entity-name') || '',
        vasatiId: btn.getAttribute('data-vasati-id') || '',
      });
    });
  });
}

function programRatioText(done, running) {
  return `${done || 0}/${running || 0}`;
}

/** Clickable done/running ratio → split list (nadediruva / nadedilla). */
function programItemRatioCell(done, running, opts) {
  const label = programRatioText(done, running);
  if (!opts || !opts.itemId || !opts.entityId || !opts.entityLevel) return label;
  if (!(running > 0)) return label;
  return (
    `<button type="button" class="num-link program-item-split-link" ` +
    `data-program-item="${escapeHtml(opts.itemId)}" ` +
    `data-program-item-label="${escapeHtml(opts.itemLabel || '')}" ` +
    `data-entity-level="${escapeHtml(opts.entityLevel)}" ` +
    `data-entity-id="${escapeHtml(opts.entityId)}" ` +
    `data-entity-name="${escapeHtml(opts.entityName || '')}" ` +
    `data-vasati-id="${escapeHtml(opts.vasatiId || '')}" ` +
    `data-item-day-count="${escapeHtml(String(opts.itemDayCount || ''))}" ` +
    `data-list-title="${escapeHtml(opts.titleName || opts.entityName || '')}">` +
    `${escapeHtml(label)}</button>`
  );
}

function paintNagaraProgramVaradi(data) {
  const table = document.getElementById('nagara-report-table');
  const catalog = data.catalog || [];
  const cell = (v) => (v == null ? '—' : String(v));
  const level = (data && data.level) || reportScopeLevel || 'nagara';
  const isLeaf = level === 'nagara';
  const itemDayCount = data.itemDayCount || '';
  const nextLevel = NEXT_VARADI_LEVEL[level] || null;
  const emptyMsg = isLeaf ? 'ವಸತಿ/ಮಂಡಲಗಳಿಲ್ಲ/No vasatis' : 'ಘಟಕಗಳಿಲ್ಲ/No entities';
  const itemHeads = catalog
    .map((item) => `<th class="num">${stackedLabel(`${item.kn}/${item.en}`)}</th>`)
    .join('');
  const thead =
    `<thead><tr>` +
    `<th>${stackedLabel(reportFirstColLabel(level))}</th>` +
    `<th class="num">${stackedLabel('ನಡೆಯುತ್ತಿರುವ ಶಾಖೆಗಳು/Nadayuthiruva Shakhegalu')}</th>` +
    `<th class="num">${stackedLabel('ನಡೆಯದ ಶಾಖೆಗಳು/Nadayada Shakhegalu')}</th>` +
    itemHeads +
    `</tr></thead>`;

  const body = (data.rows || [])
    .map((row) => {
      const child = reportRowChild(row);
      const title = (child && child.name) || '—';
      const cid = (child && child.id) || '';
      const counts = row.itemCounts || {};
      const running = row.nadayuthiruvaShakheCount || 0;
      const yojita = row.yojitaShakheCount || 0;
      const nadayada =
        row.nadayadaShakheCount != null
          ? row.nadayadaShakheCount
          : Math.max(0, yojita - running);
      let nameCell;
      if (isLeaf && cid) {
        nameCell =
          `<button type="button" class="num-link vasati-name-link" data-list-kind="upavasati" ` +
          `data-vasati-id="${escapeHtml(cid)}" data-list-title="${escapeHtml(title)}">` +
          `${escapeHtml(title)}</button>`;
      } else if (nextLevel && cid) {
        nameCell =
          `<button type="button" class="num-link entity-drill-link" ` +
          `data-child-level="${escapeHtml(nextLevel)}" data-entity-id="${escapeHtml(cid)}" ` +
          `data-entity-name="${escapeHtml(title)}">${escapeHtml(title)}</button>`;
      } else {
        nameCell = escapeHtml(title);
      }
      const statusBase = isLeaf
        ? {
          entityLevel: 'nagara',
          entityId: reportScopeEntityId || nagaraId || '',
          entityName: reportScopeEntityName || nagaraName || '',
          vasatiId: cid,
        }
        : cid
          ? {
            entityLevel: nextLevel || level,
            entityId: cid,
            entityName: title,
          }
          : null;
      const runningOpts = statusBase ? { ...statusBase, filter: 'yes' } : null;
      const nadayadaOpts = statusBase ? { ...statusBase, filter: 'no' } : null;
      const itemCells = catalog
        .map((item) => {
          const label = `${item.kn}/${item.en}`;
          const done = counts[item.id] || 0;
          const opts = isLeaf
            ? {
              itemId: item.id,
              itemLabel: label,
              entityLevel: 'nagara',
              entityId: reportScopeEntityId || nagaraId || '',
              entityName: reportScopeEntityName || nagaraName || '',
              vasatiId: cid,
              titleName: title,
              itemDayCount,
            }
            : cid
              ? {
                itemId: item.id,
                itemLabel: label,
                entityLevel: nextLevel || level,
                entityId: cid,
                entityName: title,
                titleName: title,
                itemDayCount,
              }
              : null;
          return `<td class="num">${programItemRatioCell(done, running, opts)}</td>`;
        })
        .join('');
      return (
        `<tr>` +
        `<td>${nameCell}</td>` +
        `<td class="num">${shakheRunningRatioLink(running, yojita, runningOpts)}</td>` +
        `<td class="num">${shakheRunningRatioLink(nadayada, yojita, nadayadaOpts)}</td>` +
        itemCells +
        `</tr>`
      );
    })
    .join('');

  const tot = data.totals || {};
  const totCounts = tot.itemCounts || {};
  const totRunning = tot.nadayuthiruvaShakheCount || 0;
  const totYojita = tot.yojitaShakheCount || 0;
  const totNadayada =
    tot.nadayadaShakheCount != null
      ? tot.nadayadaShakheCount
      : Math.max(0, totYojita - totRunning);
  const footItems = catalog
    .map((item) => `<td class="num">${programRatioText(totCounts[item.id] || 0, totRunning)}</td>`)
    .join('');
  const colCount = 3 + catalog.length;
  const foot =
    `<tr class="report-total-row">` +
    `<td>${stackedLabel('ಒಟ್ಟು/Total')}</td>` +
    `<td class="num">${programRatioText(totRunning, totYojita)}</td>` +
    `<td class="num">${programRatioText(totNadayada, totYojita)}</td>` +
    footItems +
    `</tr>`;

  table.innerHTML =
    thead +
    `<tbody>${body || `<tr><td colspan="${colCount}">${emptyMsg}</td></tr>`}</tbody>` +
    (data.rows && data.rows.length ? `<tfoot>${foot}</tfoot>` : '');
  bindNagaraReportListClicks(table);
  table.querySelectorAll('button.program-item-split-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      openProgramItemShakheSplit({
        itemId: btn.getAttribute('data-program-item'),
        itemLabel: btn.getAttribute('data-program-item-label') || '',
        entityLevel: btn.getAttribute('data-entity-level'),
        entityId: btn.getAttribute('data-entity-id'),
        entityName: btn.getAttribute('data-entity-name') || '',
        vasatiId: btn.getAttribute('data-vasati-id') || '',
        titleName: btn.getAttribute('data-list-title') || '',
        itemDayCount: btn.getAttribute('data-item-day-count') || '',
      });
    });
  });
}

function programShakheYesNo(hasItem, kind, shakheId) {
  if (kind === 'running') {
    return hasItem
      ? `<span class="program-check-yes">${stackedLabel('ನಡೆಯುತ್ತಿದೆ/Running')}</span>`
      : `<span class="program-check-no">${stackedLabel('ನಡೆಯದು/Not running')}</span>`;
  }
  return hasItem
    ? shakheId
      ? `<button type="button" class="program-check-yes num-link" data-program-hit-id="${escapeHtml(
          shakheId
        )}">${stackedLabel('ಹೌದು/Yes')}</button>`
      : `<span class="program-check-yes">${stackedLabel('ಹೌದು/Yes')}</span>`
    : `<span class="program-check-no">${stackedLabel('ಇಲ್ಲ/No')}</span>`;
}

function flattenProgramSplitShakhes(node, out) {
  const list = out || [];
  if (!node) return list;
  if (Array.isArray(node.shakhes)) {
    for (const s of node.shakhes) list.push(s);
    return list;
  }
  for (const g of node.groups || []) flattenProgramSplitShakhes(g, list);
  return list;
}

function programSplitEntityName(ent) {
  return ent && ent.name ? String(ent.name) : '—';
}

function sortProgramSplitShakhes(shakhes) {
  return (shakhes || []).slice().sort((a, b) => {
    const keys = ['vibhag', 'bhag', 'nagar', 'vasati', 'upavasati'];
    for (const key of keys) {
      const av = programSplitEntityName(a[key]);
      const bv = programSplitEntityName(b[key]);
      if (av !== bv) return av.localeCompare(bv);
    }
    const an = String(a.name || '');
    const bn = String(b.name || '');
    if (an !== bn) return an.localeCompare(bn);
    return Number(Boolean(b.hasItem)) - Number(Boolean(a.hasItem));
  });
}

const PROGRAM_SPLIT_HIER_FIELDS = [
  { key: 'vibhag', label: LABEL_VIBHAG },
  { key: 'bhag', label: LABEL_BHAG },
  { key: 'nagar', label: LABEL_NAGARA },
  { key: 'vasati', label: LABEL_VASATI },
  { key: 'upavasati', label: LABEL_UPAVASATI },
];

/**
 * Hierarchy columns start at the child of the current report/login level
 * (prant→vibhag…, vibhag→bhag…, bhag→nagar…, nagara→vasati…).
 */
function hierarchyKeysForScopeLevel(level) {
  const lv =
    level ||
    (nagaraListContext && nagaraListContext.entityLevel) ||
    reportScopeLevel ||
    sessionLevel ||
    'nagara';
  if (lv === 'prant') return ['vibhag', 'bhag', 'nagar', 'vasati', 'upavasati'];
  if (lv === 'vibhag') return ['bhag', 'nagar', 'vasati', 'upavasati'];
  if (lv === 'bhag') return ['nagar', 'vasati', 'upavasati'];
  return ['vasati', 'upavasati'];
}

function programSplitBaseFieldIndex(level) {
  const keys = hierarchyKeysForScopeLevel(level);
  const idx = PROGRAM_SPLIT_HIER_FIELDS.findIndex((f) => f.key === keys[0]);
  return idx < 0 ? 0 : idx;
}

/** Build rowspan map for consecutive equal hierarchy values (by id). */
function programSplitRowspans(rows, fields) {
  const spans = fields.map(() => new Array(rows.length).fill(0));
  for (let c = 0; c < fields.length; c += 1) {
    const idKey = `${fields[c]}Id`;
    let i = 0;
    while (i < rows.length) {
      let j = i + 1;
      const value = rows[i][idKey];
      while (j < rows.length && rows[j][idKey] === value) j += 1;
      spans[c][i] = j - i;
      for (let k = i + 1; k < j; k += 1) spans[c][k] = 0;
      i = j;
    }
  }
  return spans;
}

function programSplitScopeFilter(shakhes, path) {
  let list = shakhes || [];
  for (const step of path || []) {
    if (!step || !step.key || !step.id) continue;
    list = list.filter((s) => s && s[step.key] && s[step.key].id === step.id);
  }
  return list;
}

function programSplitFlatTableHtml(shakhes, itemLabel, visibleFields, statusKind) {
  const sorted = sortProgramSplitShakhes(shakhes);
  const fields = (visibleFields || PROGRAM_SPLIT_HIER_FIELDS).map((f) => f.key);
  const kind = statusKind || 'program';
  const statusHead =
    kind === 'running'
      ? stackedLabel('ಸ್ಥಿತಿ/Status')
      : stackedLabel(itemLabel || 'ಆಯ್ಕೆ/Item');
  const display = sorted.map((s) => {
    const row = {
      shakheId: s.id || '',
      name: s.name || '—',
      timing: TIMING_LABEL[s.timing] || s.timing || '—',
      time: s.time || '—',
      hasItem: Boolean(s.hasItem),
    };
    PROGRAM_SPLIT_HIER_FIELDS.forEach(({ key }) => {
      row[key] = programSplitEntityName(s[key]);
      row[`${key}Id`] = (s[key] && s[key].id) || '';
    });
    return row;
  });
  const spans = programSplitRowspans(display, fields);
  const body = display
    .map((row, idx) => {
      let cells = '';
      fields.forEach((field, c) => {
        const span = spans[c][idx];
        if (!span) return;
        const id = row[`${field}Id`];
        const name = row[field];
        const canDrill = Boolean(id) && name !== '—';
        const inner = canDrill
          ? `<button type="button" class="num-link program-split-drill" ` +
          `data-split-key="${escapeHtml(field)}" data-split-id="${escapeHtml(id)}" ` +
          `data-split-name="${escapeHtml(name)}">${escapeHtml(name)}</button>`
          : escapeHtml(name);
        cells += `<td class="cell-group" rowspan="${span}">${inner}</td>`;
      });
      cells +=
        `<td class="cell-name">${escapeHtml(row.name)}</td>` +
        `<td>${escapeHtml(row.timing)}</td>` +
        `<td>${escapeHtml(row.time)}</td>` +
        `<td class="num">${programShakheYesNo(row.hasItem, kind, row.shakheId)}</td>`;
      return `<tr>${cells}</tr>`;
    })
    .join('');
  const hierHeads = (visibleFields || PROGRAM_SPLIT_HIER_FIELDS)
    .map((f) => `<th>${stackedLabel(f.label)}</th>`)
    .join('');
  const colCount = fields.length + 4;
  return (
    `<div class="table-wrap">` +
    `<table class="varadi-table program-split-flat-table">` +
    `<thead><tr>` +
    hierHeads +
    `<th>${stackedLabel('ಶಾಖೆ/Shakhe')}</th>` +
    `<th>${stackedLabel('ಸಮಯ/Timing')}</th>` +
    `<th>${stackedLabel('ಗಂಟೆ/Time')}</th>` +
    `<th class="num">${statusHead}</th>` +
    `</tr></thead>` +
    `<tbody>${body || `<tr><td colspan="${colCount}">ಶಾಖೆಗಳಿಲ್ಲ/No shakhes</td></tr>`
    }</tbody>` +
    `</table></div>`
  );
}

function programSplitItemParts(itemLabel) {
  const raw = String(itemLabel || '').trim();
  if (!raw) return { kn: 'ಆಯ್ಕೆ', en: 'Item' };
  const parts = raw.split('/').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return { kn: parts[0], en: parts[parts.length - 1] };
  return { kn: raw, en: raw };
}

function programSplitItemFilterLabel(itemLabel) {
  const { kn, en } = programSplitItemParts(itemLabel);
  return kn === en ? kn : `${kn}/${en}`;
}

function filterProgramSplitShakhes(shakhes, filter) {
  const list = shakhes || [];
  if (filter === 'yes') return list.filter((s) => s && s.hasItem);
  if (filter === 'no') return list.filter((s) => s && !s.hasItem);
  return list;
}

function programItemDayLabel(days) {
  const n = Number(days) || 0;
  const kannada = {
    1: 'ಒಂದು',
    2: 'ಎರಡು',
    3: 'ಮೂರು',
    4: 'ನಾಲ್ಕು',
    5: 'ಐದು',
    6: 'ಆರು',
    7: 'ಏಳು',
    8: 'ಎಂಟು',
    9: 'ಒಂಬತ್ತು',
    10: 'ಹತ್ತು',
  }[n] || String(n);
  return `${kannada} ದಿನ/${n} ${n === 1 ? 'day' : 'days'}`;
}

function programSplitVisibleFields(path, level) {
  const base = programSplitBaseFieldIndex(level);
  const steps = path || [];
  if (!steps.length) return PROGRAM_SPLIT_HIER_FIELDS.slice(base);
  const last = steps[steps.length - 1];
  const idx = PROGRAM_SPLIT_HIER_FIELDS.findIndex((f) => f.key === last.key);
  if (idx < 0) return PROGRAM_SPLIT_HIER_FIELDS.slice(base);
  // Hide columns above the drilled level; never show above the login/report scope.
  return PROGRAM_SPLIT_HIER_FIELDS.slice(Math.max(idx, base));
}

function programSplitPathHtml(path) {
  const steps = path || [];
  if (!steps.length) return '';
  const crumbs = [
    `<button type="button" class="num-link program-split-path" data-split-path-index="-1">${stackedLabel(
      'ಎಲ್ಲಾ/All'
    )}</button>`,
  ];
  steps.forEach((step, i) => {
    crumbs.push(`<span class="program-split-path-sep">›</span>`);
    crumbs.push(
      `<button type="button" class="num-link program-split-path" data-split-path-index="${i}">${escapeHtml(
        step.name || '—'
      )}</button>`
    );
  });
  return `<div class="program-split-path-row">${crumbs.join('')}</div>`;
}

function programItemHitDaysTableHtml(shakhe, itemLabel, programKind) {
  const days = (shakhe.days || []).slice().sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  const rows = days
    .map((day) => {
      const weekday = weekdayParts(day.date);
      return (
        `<tr>` +
        `<td class="cell-name">${escapeHtml(shakhe.name || '—')}</td>` +
        `<td>${escapeHtml(formatDateDisplay(day.date))}</td>` +
        `<td>${escapeHtml((weekday && weekday.value) || '—')}</td>` +
        `<td>${escapeHtml(itemLabel || '—')}</td>` +
        `<td class="cell-details">${programHitExtrasHtml(day, programKind)}</td>` +
        `</tr>`
      );
    })
    .join('');
  return (
    `<div class="table-wrap"><table class="varadi-table program-hit-table">` +
    `<thead><tr>` +
    `<th>${stackedLabel('ಶಾಖೆ/Shakhe')}</th>` +
    `<th>${stackedLabel('ದಿನಾಂಕ/Date')}</th>` +
    `<th>${stackedLabel('ದಿನ/Day')}</th>` +
    `<th>${stackedLabel('ಆಯ್ಕೆ/Item')}</th>` +
    `<th>${stackedLabel('ವಿವರ/Details')}</th>` +
    `</tr></thead><tbody>${rows}</tbody></table></div>`
  );
}

function paintProgramItemShakheSplitBody() {
  const body = document.getElementById('nagara-list-body');
  if (!body || !nagaraListContext || nagaraListContext.mode !== 'program-item-split') return;
  const itemLabel = nagaraListContext.itemLabel || nagaraListContext.itemId || '';
  const filterName = programSplitItemFilterLabel(itemLabel);
  const filter = nagaraListContext.itemFilter || 'all';
  const dayFilter = nagaraListContext.itemDayFilter || 'all';
  const path = Array.isArray(nagaraListContext.splitPath) ? nagaraListContext.splitPath : [];
  const allShakhes = nagaraListContext.splitShakhes || [];
  const selectedHit = allShakhes.find((s) => s && s.id === nagaraListContext.selectedHitId);
  if (nagaraListContext.selectedHitId && selectedHit) {
    body.innerHTML =
      `<button type="button" class="back-link" id="program-hit-days-back">← ಹಿಂದೆ/Back</button>` +
      `<h2 class="shakhe-head">${escapeHtml(itemLabel)} — ${escapeHtml(selectedHit.name || '')}</h2>` +
      programItemHitDaysTableHtml(selectedHit, itemLabel, nagaraListContext.programKind);
    document.getElementById('program-hit-days-back').addEventListener('click', () => {
      nagaraListContext.selectedHitId = null;
      paintProgramItemShakheSplitBody();
    });
    return;
  }
  nagaraListContext.selectedHitId = null;
  const scoped = programSplitScopeFilter(allShakhes, path);
  const yesCount = scoped.filter((s) => s && s.hasItem).length;
  const noCount = scoped.length - yesCount;
  const selectedDays = Math.max(0, Number(nagaraListContext.dayCount) || nagaraVaradiRangeDays().count || 0);
  const filtered = filterProgramSplitShakhes(scoped, filter).filter((s) => {
    if (dayFilter === 'happened') return s && s.hasItem;
    const exact = Number(dayFilter);
    return !Number.isInteger(exact) || exact < 1 ? true : (s.days || []).length === exact;
  });
  const shownYesCount = filtered.filter((s) => s && s.hasItem).length;
  const visibleFields = programSplitVisibleFields(path, nagaraListContext.entityLevel);
  const filterHtml =
    `<div class="list-filters program-split-filters">` +
    `<div class="field">` +
    `<label for="program-split-item-filter">${stackedLabel(filterName)}</label>` +
    `<select id="program-split-item-filter" aria-label="${escapeHtml(filterName)}">` +
    `<option value="all"${filter === 'all' ? ' selected' : ''}>ಎಲ್ಲಾ/All (${scoped.length})</option>` +
    `<option value="yes"${filter === 'yes' ? ' selected' : ''}>ಹೌದು/Yes (${yesCount})</option>` +
    `<option value="no"${filter === 'no' ? ' selected' : ''}>ಇಲ್ಲ/No (${noCount})</option>` +
    `</select>` +
    `</div>` +
    `<div class="field">` +
    `<label for="program-split-day-filter">ಎಷ್ಟು ದಿನ ನಡೆದಿದೆ/Number of days happened</label>` +
    `<select id="program-split-day-filter">` +
    `<option value="all"${dayFilter === 'all' ? ' selected' : ''}>ಎಲ್ಲಾ/All</option>` +
    `<option value="happened"${dayFilter === 'happened' ? ' selected' : ''}>ನಡೆದಿದೆ/Happened (${yesCount})</option>` +
    Array.from({ length: selectedDays }, (_, i) => {
      const days = i + 1;
      const count = scoped.filter((s) => s && (s.days || []).length === days).length;
      return `<option value="${days}"${String(dayFilter) === String(days) ? ' selected' : ''}>${escapeHtml(
        programItemDayLabel(days)
      )} (${count})</option>`;
    }).join('') +
    `</select>` +
    `</div>` +
    `</div>`;
  const itemParts = programSplitItemParts(itemLabel);
  const summary =
    `<div class="list-summary program-split-summary">` +
    `<div class="list-summary-item"><span class="list-summary-label">${stackedLabel(
      `${itemParts.kn} ನಡೆದಿರುವ ಶಾಖೆಗಳು/${itemParts.en} Nadediruva Shakhegalu`
    )}</span><strong class="list-summary-value">${escapeHtml(
      String(dayFilter === 'all' ? yesCount : shownYesCount)
    )}</strong></div>` +
    `<div class="list-summary-item"><span class="list-summary-label">${stackedLabel(
      'ನಡೆಯುತ್ತಿರುವ ಶಾಖೆ/Nadayuthiruva Shakhe'
    )}</span><strong class="list-summary-value">${escapeHtml(
      String(scoped.length)
    )}</strong></div>` +
    `</div>`;
  body.innerHTML =
    summary +
    filterHtml +
    programSplitPathHtml(path) +
    programSplitFlatTableHtml(filtered, itemLabel, visibleFields);

  const sel = document.getElementById('program-split-item-filter');
  if (sel) {
    sel.addEventListener('change', () => {
      nagaraListContext.itemFilter = sel.value || 'all';
      paintProgramItemShakheSplitBody();
    });
  }
  const daySel = document.getElementById('program-split-day-filter');
  if (daySel) {
    daySel.addEventListener('change', () => {
      nagaraListContext.itemDayFilter = daySel.value || 'all';
      if (nagaraListContext.itemDayFilter !== 'all') nagaraListContext.itemFilter = 'yes';
      paintProgramItemShakheSplitBody();
    });
  }
  body.querySelectorAll('button[data-program-hit-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      nagaraListContext.selectedHitId = btn.getAttribute('data-program-hit-id') || null;
      paintProgramItemShakheSplitBody();
    });
  });
  body.querySelectorAll('button.program-split-drill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-split-key');
      const id = btn.getAttribute('data-split-id');
      const name = btn.getAttribute('data-split-name') || '';
      if (!key || !id) return;
      const keyIdx = PROGRAM_SPLIT_HIER_FIELDS.findIndex((f) => f.key === key);
      if (keyIdx < 0) return;
      const prev = Array.isArray(nagaraListContext.splitPath) ? nagaraListContext.splitPath : [];
      // Keep higher-level path steps, replace/set this level, drop deeper ones.
      const next = prev.filter((step) => {
        const si = PROGRAM_SPLIT_HIER_FIELDS.findIndex((f) => f.key === step.key);
        return si >= 0 && si < keyIdx;
      });
      next.push({ key, id, name });
      nagaraListContext.splitPath = next;
      paintProgramItemShakheSplitBody();
    });
  });
  body.querySelectorAll('button.program-split-path').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-split-path-index'));
      if (!Number.isFinite(idx) || idx < 0) {
        nagaraListContext.splitPath = [];
      } else {
        nagaraListContext.splitPath = (nagaraListContext.splitPath || []).slice(0, idx + 1);
      }
      paintProgramItemShakheSplitBody();
    });
  });
}

async function openProgramItemShakheSplit(opts) {
  const itemId = opts && opts.itemId;
  const entityId = opts && opts.entityId;
  const entityLevel = opts && opts.entityLevel;
  if (!itemId || !entityId || !entityLevel) return;
  const programKind =
    nagaraReportKind === 'sharirik' || nagaraReportKind === 'boudhik' ? nagaraReportKind : 'boudhik';
  const itemLabel = (opts && opts.itemLabel) || itemId;
  const titleName = (opts && opts.titleName) || (opts && opts.entityName) || '';
  const keepFilter =
    nagaraListContext &&
      nagaraListContext.mode === 'program-item-split' &&
      nagaraListContext.itemId === itemId
      ? nagaraListContext.itemFilter || 'yes'
      : 'yes';
  const selectedItemDayFilter =
    opts && opts.itemDayCount
      ? String(opts.itemDayCount)
      : 'all';
  shakheReturnTo = 'nagara-varadi-list';
  nagaraListContext = {
    mode: 'program-item-split',
    itemId,
    itemLabel,
    entityLevel,
    entityId,
    entityName: (opts && opts.entityName) || '',
    vasatiId: (opts && opts.vasatiId) || null,
    titleName,
    programKind,
    itemFilter: keepFilter,
    itemDayFilter: selectedItemDayFilter,
    splitPath: [],
    splitShakhes: [],
    splitRunningCount: 0,
  };
  const errorEl = document.getElementById('nagara-list-error');
  const body = document.getElementById('nagara-list-body');
  errorEl.classList.add('hidden');
  body.innerHTML = '';
  document.getElementById('nagara-list-title').textContent = `${itemLabel} — ${titleName}`;
  showScreen(nagaraListView);
  setNagaraListLoading(true);
  try {
    const range = nagaraVaradiRangeDays();
    const params = new URLSearchParams({
      level: entityLevel,
      entityId,
      kind: programKind,
      itemId,
      from: range.from,
      to: range.to,
    });
    if (opts.vasatiId) params.set('vasatiId', opts.vasatiId);
    if (range.excludeSunday) params.set('excludeSunday', '1');
    const res = await fetch(`/api/varadi/program-item-shakhes?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (bounceIfVaradiAuth(res, data)) return;
    if (!res.ok) {
      errorEl.textContent = data.error || 'ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load';
      errorEl.classList.remove('hidden');
      return;
    }
    const withBlock = data.withItem || { count: 0 };
    const withoutBlock = data.withoutItem || { count: 0 };
    const allShakhes = sortProgramSplitShakhes([
      ...flattenProgramSplitShakhes(withBlock),
      ...flattenProgramSplitShakhes(withoutBlock),
    ]);
    nagaraListContext.splitShakhes = allShakhes;
    nagaraListContext.splitRunningCount =
      data.nadayuthiruvaShakheCount || allShakhes.length || 0;
    nagaraListContext.dayCount = data.dayCount || 0;
    paintProgramItemShakheSplitBody();
  } finally {
    setNagaraListLoading(false);
  }
}

function bindShakheSplitPathClicks(body, repaint) {
  body.querySelectorAll('button.program-split-drill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-split-key');
      const id = btn.getAttribute('data-split-id');
      const name = btn.getAttribute('data-split-name') || '';
      if (!key || !id) return;
      const keyIdx = PROGRAM_SPLIT_HIER_FIELDS.findIndex((f) => f.key === key);
      if (keyIdx < 0) return;
      const prev = Array.isArray(nagaraListContext.splitPath) ? nagaraListContext.splitPath : [];
      const next = prev.filter((step) => {
        const si = PROGRAM_SPLIT_HIER_FIELDS.findIndex((f) => f.key === step.key);
        return si >= 0 && si < keyIdx;
      });
      next.push({ key, id, name });
      nagaraListContext.splitPath = next;
      repaint();
    });
  });
  body.querySelectorAll('button.program-split-path').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-split-path-index'));
      if (!Number.isFinite(idx) || idx < 0) {
        nagaraListContext.splitPath = [];
      } else {
        nagaraListContext.splitPath = (nagaraListContext.splitPath || []).slice(0, idx + 1);
      }
      repaint();
    });
  });
}

function shakheHierarchyVisibleFields(shakhes, keys) {
  const allowed = keys || hierarchyKeysForScopeLevel();
  const hierFields = PROGRAM_SPLIT_HIER_FIELDS.filter((f) => allowed.includes(f.key));
  const visibleFields = hierFields.slice();
  const list = shakhes || [];
  // Keep at least the first in-scope column (e.g. Vasati for nagara) even if identical.
  while (visibleFields.length > 1 && list.length) {
    const key = visibleFields[0].key;
    const first = programSplitEntityName(list[0] && list[0][key]);
    if (list.every((s) => programSplitEntityName(s[key]) === first)) visibleFields.shift();
    else break;
  }
  return visibleFields;
}

/** Build rowspan-grouped hierarchy cells for one sorted row index. */
function shakheGroupedHierCells(displayRows, spans, fields, idx) {
  let cells = '';
  fields.forEach((field, c) => {
    const span = spans[c][idx];
    if (!span) return;
    const row = displayRows[idx];
    const name = row[field];
    const id = row[`${field}Id`];
    const canDrill = Boolean(id) && name !== '—';
    const inner = canDrill
      ? `<button type="button" class="num-link program-split-drill" ` +
      `data-split-key="${escapeHtml(field)}" data-split-id="${escapeHtml(id)}" ` +
      `data-split-name="${escapeHtml(name)}">${escapeHtml(name)}</button>`
      : escapeHtml(name);
    cells += `<td class="cell-group" rowspan="${span}">${inner}</td>`;
  });
  return cells;
}

function shakhesToHierDisplayRows(shakhes, fields) {
  return (shakhes || []).map((s) => {
    const row = { _shakhe: s };
    fields.forEach((key) => {
      row[key] = programSplitEntityName(s[key]);
      row[`${key}Id`] = (s[key] && s[key].id) || '';
    });
    return row;
  });
}

function paintShakheYojitaListTable(shakhes) {
  const sorted = sortProgramSplitShakhes(shakhes);
  // Start at login/report child level; may drop further identical leading columns.
  const visibleFields = shakheHierarchyVisibleFields(
    sorted,
    hierarchyKeysForScopeLevel(nagaraListContext && nagaraListContext.entityLevel)
  );
  const fieldKeys = visibleFields.map((f) => f.key);
  const display = shakhesToHierDisplayRows(sorted, fieldKeys);
  const spans = programSplitRowspans(display, fieldKeys);
  const hierHeads = visibleFields.map((f) => `<th>${stackedLabel(f.label)}</th>`).join('');
  const listHead =
    `<th>${stackedLabel('ಶಾಖೆ/Shakhe')}</th>` +
    `<th>${stackedLabel('ಸಮಯ/Timing')}</th>` +
    `<th>${stackedLabel('ಪ್ರಕಾರ/Type')}</th>` +
    `<th>${stackedLabel('ಸ್ಥಳ/Sthala')}</th>` +
    `<th>${stackedLabel('ತಿದ್ದುಪಡಿ/Edit')}</th>`;
  const rows = display
    .map((row, idx) => {
      const hier = shakheGroupedHierCells(display, spans, fieldKeys, idx);
      return `<tr>${hier}${shakheListCells(row._shakhe, { omitPlace: true, plainName: true })}</tr>`;
    })
    .join('');
  return (
    `<div class="table-wrap"><table class="varadi-table shakhe-list-table shakhe-yojita-table"><thead><tr>` +
    hierHeads +
    listHead +
    `</tr></thead><tbody>${rows || `<tr><td colspan="${visibleFields.length + 5}">ಶಾಖೆಗಳಿಲ್ಲ/No shakhes</td></tr>`
    }</tbody></table></div>`
  );
}

function paintShakheStatusSplitBody() {
  const body = document.getElementById('nagara-list-body');
  if (!body || !nagaraListContext || nagaraListContext.mode !== 'shakhe-status-split') return;
  const filter = nagaraListContext.itemFilter || 'all';
  const path = Array.isArray(nagaraListContext.splitPath) ? nagaraListContext.splitPath : [];
  const allShakhes = nagaraListContext.splitShakhes || [];
  const scoped = programSplitScopeFilter(allShakhes, path);
  const filtered = filterProgramSplitShakhes(scoped, filter);
  const daysSelected =
    filtered[0] && filtered[0].daysSelected != null
      ? filtered[0].daysSelected
      : nagaraVaradiRangeDays().count || 0;
  let summary;
  let tableHtml;
  if (filter === 'yes') {
    // Nadayuthiruva: hierarchy (grouped) + upasthiti metrics columns.
    summary =
      `<div class="list-summary program-split-summary">` +
      `<div class="list-summary-item"><span class="list-summary-label">${stackedLabel(
        'ನಡೆಯುತ್ತಿರುವ/Running'
      )}</span><strong class="list-summary-value">${escapeHtml(
        String(filtered.length)
      )}</strong></div>` +
      `<div class="list-summary-item"><span class="list-summary-label">${stackedLabel(
        'ಆಯ್ಕೆ ಮಾಡಿದ ದಿನಗಳು/Days selected'
      )}</span><strong class="list-summary-value">${escapeHtml(
        String(daysSelected)
      )}</strong></div>` +
      `</div>`;
    tableHtml = paintShakheDaysRanDetailTable(filtered);
  } else {
    const summaryLabel =
      filter === 'no' ? 'ನಡೆಯದ ಶಾಖೆಗಳು/Nadayada Shakhegalu' : 'ಯೋಜಿತ ಶಾಖೆ/Yojita Shakhe';
    summary =
      `<div class="list-summary program-split-summary">` +
      `<div class="list-summary-item"><span class="list-summary-label">${stackedLabel(
        summaryLabel
      )}</span><strong class="list-summary-value">${escapeHtml(
        String(filtered.length)
      )}</strong></div>` +
      `</div>`;
    tableHtml = paintShakheYojitaListTable(filtered);
  }
  body.innerHTML = summary + programSplitPathHtml(path) + tableHtml;
  bindShakheSplitPathClicks(body, paintShakheStatusSplitBody);
  body.querySelectorAll('button[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => openEditShakhe(btn.getAttribute('data-edit-id')));
  });
  // Days-ran links only (shakhe names stay plain text on these lists).
  body.querySelectorAll('button[data-shakhe-varadi]').forEach((btn) => {
    btn.addEventListener('click', () =>
      openNagaraShakheDayVaradi(
        btn.getAttribute('data-shakhe-varadi'),
        btn.getAttribute('data-nagar-id') || ''
      )
    );
  });
}

/** In varadi list screens, shakhe name opens day varadi — not phone-gated shakhe details. */
function bindNagaraListShakheNameClicks(root) {
  if (!root) return;
  root.querySelectorAll('button[data-shakhe-id]').forEach((btn) => {
    btn.addEventListener('click', () =>
      openNagaraShakheDayVaradi(
        btn.getAttribute('data-shakhe-id'),
        btn.getAttribute('data-nagar-id') || ''
      )
    );
  });
}

async function openShakheStatusSplit(opts) {
  const entityId = opts && opts.entityId;
  const entityLevel = opts && opts.entityLevel;
  if (!entityId || !entityLevel) return;
  const entityName = (opts && opts.entityName) || '';
  const keepFilter =
    opts && opts.itemFilter
      ? opts.itemFilter
      : nagaraListContext &&
        nagaraListContext.mode === 'shakhe-status-split' &&
        nagaraListContext.entityId === entityId
        ? nagaraListContext.itemFilter || 'all'
        : 'all';
  shakheReturnTo = 'nagara-varadi-list';
  nagaraListContext = {
    mode: 'shakhe-status-split',
    entityLevel,
    entityId,
    entityName,
    vasatiId: (opts && opts.vasatiId) || null,
    titleName: entityName,
    itemFilter: keepFilter === 'yojita' ? 'all' : keepFilter,
    splitPath: [],
    splitShakhes: [],
    splitRunningCount: 0,
    splitYojitaCount: 0,
  };
  const errorEl = document.getElementById('nagara-list-error');
  const body = document.getElementById('nagara-list-body');
  errorEl.classList.add('hidden');
  body.innerHTML = '';
  const titlePrefix =
    keepFilter === 'no'
      ? 'ನಡೆಯದ ಶಾಖೆಗಳು/Nadayada Shakhegalu'
      : keepFilter === 'yes'
        ? 'ನಡೆಯುತ್ತಿರುವ ಶಾಖೆಗಳು/Nadayuthiruva Shakhegalu'
        : 'ಯೋಜಿತ ಶಾಖೆ/Yojita Shakhe';
  document.getElementById('nagara-list-title').textContent = `${titlePrefix} — ${entityName}`;
  showScreen(nagaraListView);
  setNagaraListLoading(true);
  try {
    const range = nagaraVaradiRangeDays();
    const params = new URLSearchParams({
      level: entityLevel,
      entityId,
      from: range.from,
      to: range.to,
    });
    if (opts && opts.vasatiId) params.set('vasatiId', opts.vasatiId);
    if (range.excludeSunday) params.set('excludeSunday', '1');
    const res = await fetch(`/api/varadi/shakhe-status-shakhes?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (bounceIfVaradiAuth(res, data)) return;
    if (!res.ok) {
      errorEl.textContent = data.error || 'ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load';
      errorEl.classList.remove('hidden');
      return;
    }
    const withBlock = data.withItem || { count: 0 };
    const withoutBlock = data.withoutItem || { count: 0 };
    const allShakhes = sortProgramSplitShakhes([
      ...flattenProgramSplitShakhes(withBlock),
      ...flattenProgramSplitShakhes(withoutBlock),
    ]);
    nagaraListContext.splitShakhes = allShakhes;
    nagaraListContext.splitRunningCount = data.nadayuthiruvaShakheCount || withBlock.count || 0;
    nagaraListContext.splitYojitaCount = data.yojitaShakheCount || allShakhes.length || 0;
    paintShakheStatusSplitBody();
  } finally {
    setNagaraListLoading(false);
  }
}

/** Metrics cells after hierarchy: Shakhe | Days ran | Average (ಸರಾಸರಿ) | Ottu samparka. */
function shakheRunningMetricsCells(s) {
  const cell = (v) => (v == null ? '—' : String(v));
  const avgCell = (v) => formatAvg(v);
  const a = s.averages || {};
  const sam = s.ottuSamparka || {};
  const ran = s.daysRan || 0;
  const selected = s.daysSelected != null ? s.daysSelected : nagaraVaradiRangeDays().count || 0;
  const nagarAttr = (s.nagar && s.nagar.id) || '';
  // Shakhe name is plain text; Days ran opens day varadi.
  return (
    `<td class="cell-name">${escapeHtml(s.name || '—')}</td>` +
    `<td class="num"><button type="button" class="num-link" data-shakhe-varadi="${escapeHtml(
      s.id
    )}" data-nagar-id="${escapeHtml(nagarAttr)}">${escapeHtml(String(ran))}/${escapeHtml(
      String(selected)
    )}</button></td>` +
    `<td class="num">${avgCell(a.taruna)}</td>` +
    `<td class="num">${avgCell(a.balaka)}</td>` +
    `<td class="num">${avgCell(a.total)}</td>` +
    `<td class="num">${avgCell(a.shishu)}</td>` +
    `<td class="num">${avgCell(a.mataBhagi)}</td>` +
    `<td class="num">${cell(sam.manegalu)}</td>` +
    `<td class="num">${cell(sam.vyaktigalu)}</td>`
  );
}

function shakheDaysRanDetailRowHtml(s, visibleFields) {
  const fields = (visibleFields || PROGRAM_SPLIT_HIER_FIELDS).map((f) => f.key);
  let hier = '';
  fields.forEach((key) => {
    const name = programSplitEntityName(s[key]);
    const id = (s[key] && s[key].id) || '';
    const canDrill = Boolean(id) && name !== '—';
    const inner = canDrill
      ? `<button type="button" class="num-link program-split-drill" ` +
      `data-split-key="${escapeHtml(key)}" data-split-id="${escapeHtml(id)}" ` +
      `data-split-name="${escapeHtml(name)}">${escapeHtml(name)}</button>`
      : escapeHtml(name);
    hier += `<td class="cell-group">${inner}</td>`;
  });
  return `<tr>${hier}${shakheRunningMetricsCells(s)}</tr>`;
}

function shakheDaysRanListTotals(shakhes) {
  const items = shakhes || [];
  const cell = (v) => (v == null ? '—' : String(v));
  // Footer Average (ಸರಾಸರಿ) = sum of each row’s displayed averages (same rule as bhag totals).
  const avgCell = (v) => (v == null || Number.isNaN(Number(v)) ? '—' : String(Number(v)));
  let daysRanSum = 0;
  let daysSelected = nagaraVaradiRangeDays().count || 0;
  let taruna = 0;
  let balaka = 0;
  let total = 0;
  let shishu = 0;
  let mataBhagi = 0;
  let manegalu = 0;
  let vyaktigalu = 0;
  let anyAvg = false;
  for (const s of items) {
    const d = Number(s.daysRan) || 0;
    daysRanSum += d;
    if (s.daysSelected != null) daysSelected = s.daysSelected;
    const a = s.averages || {};
    const sam = s.ottuSamparka || {};
    manegalu += Number(sam.manegalu) || 0;
    vyaktigalu += Number(sam.vyaktigalu) || 0;
    if (a && (a.taruna != null || a.balaka != null || a.total != null || a.shishu != null || a.mataBhagi != null)) {
      anyAvg = true;
      taruna += Number(a.taruna) || 0;
      balaka += Number(a.balaka) || 0;
      total += Number(a.total) || 0;
      shishu += Number(a.shishu) || 0;
      mataBhagi += Number(a.mataBhagi) || 0;
    }
  }
  return {
    daysRanSum,
    daysSelected,
    averages: anyAvg
      ? { taruna, balaka, total, shishu, mataBhagi }
      : { taruna: null, balaka: null, total: null, shishu: null, mataBhagi: null },
    ottuSamparka: { manegalu, vyaktigalu },
    cell,
    avgCell,
  };
}

function paintShakheDaysRanDetailTable(shakhes) {
  const sorted = sortProgramSplitShakhes(shakhes);
  const visibleFields = programSplitVisibleFields(
    (nagaraListContext && nagaraListContext.splitPath) || [],
    nagaraListContext && nagaraListContext.entityLevel
  ).slice();
  // Drop further identical leading columns within the in-scope set; keep ≥1.
  while (visibleFields.length > 1) {
    const key = visibleFields[0].key;
    const first = programSplitEntityName(sorted[0] && sorted[0][key]);
    if (sorted.every((s) => programSplitEntityName(s[key]) === first)) {
      visibleFields.shift();
    } else break;
  }
  const fieldKeys = visibleFields.map((f) => f.key);
  const display = shakhesToHierDisplayRows(sorted, fieldKeys);
  const spans = programSplitRowspans(display, fieldKeys);
  const hierHeads = visibleFields.map((f) => `<th rowspan="2">${stackedLabel(f.label)}</th>`).join('');
  const tot = shakheDaysRanListTotals(sorted);
  const foot =
    sorted.length > 0
      ? `<tfoot><tr class="report-total-row">` +
      `<td colspan="${visibleFields.length + 1}">${stackedLabel('ಒಟ್ಟು/Total')}</td>` +
      `<td class="num">—</td>` +
      `<td class="num">${tot.avgCell(tot.averages.taruna)}</td>` +
      `<td class="num">${tot.avgCell(tot.averages.balaka)}</td>` +
      `<td class="num">${tot.avgCell(tot.averages.total)}</td>` +
      `<td class="num">${tot.avgCell(tot.averages.shishu)}</td>` +
      `<td class="num">${tot.avgCell(tot.averages.mataBhagi)}</td>` +
      `<td class="num">${tot.cell(tot.ottuSamparka.manegalu)}</td>` +
      `<td class="num">${tot.cell(tot.ottuSamparka.vyaktigalu)}</td>` +
      `</tr></tfoot>`
      : '';
  const rows = display.length
    ? display
      .map((row, idx) => {
        const hier = shakheGroupedHierCells(display, spans, fieldKeys, idx);
        return `<tr>${hier}${shakheRunningMetricsCells(row._shakhe)}</tr>`;
      })
      .join('')
    : `<tr><td colspan="${visibleFields.length + 9}">ಶಾಖೆಗಳಿಲ್ಲ/No shakhes</td></tr>`;
  return (
    `<div class="table-wrap"><table class="varadi-table program-split-flat-table shakhe-days-ran-table running-shakhe-table"><thead>` +
    `<tr>` +
    hierHeads +
    `<th rowspan="2">${stackedLabel('ಶಾಖೆ/Shakhe')}</th>` +
    `<th class="num" rowspan="2">${stackedLabel('ನಡೆದ ದಿನಗಳು/Days ran')}</th>` +
    `<th class="num group-head" colspan="5">${stackedLabel('ಸರಾಸರಿ/Average')}</th>` +
    `<th class="num group-head" colspan="2">${stackedLabel('ಒಟ್ಟು ಸಂಪರ್ಕ/Ottu samparka')}</th>` +
    `</tr><tr>` +
    `<th class="num">${stackedLabel('ತರುಣ/Taruna')}</th>` +
    `<th class="num">${stackedLabel('ಬಾಲಕ/Balaka')}</th>` +
    `<th class="num">${stackedLabel('ಒಟ್ಟು/Total')}</th>` +
    `<th class="num">${stackedLabel('ಶಿಶು/Shishu')}</th>` +
    `<th class="num">${stackedLabel('ಮಾತಾ-ಭಗಿನಿ/Mata Bhagini')}</th>` +
    `<th class="num">${stackedLabel('ಮನೆಗಳು/Manegalu')}</th>` +
    `<th class="num">${stackedLabel('ವ್ಯಕ್ತಿಗಳು/Vyaktigalu')}</th>` +
    `</tr></thead><tbody>${rows}</tbody>${foot}</table></div>`
  );
}

async function openShakheDaysRanList(opts) {
  const entityId = opts && opts.entityId;
  const entityLevel = opts && opts.entityLevel;
  const daysRanExact = Number(opts && opts.daysRanExact);
  if (!entityId || !entityLevel || !Number.isFinite(daysRanExact) || daysRanExact < 0) return;
  const entityName = (opts && opts.entityName) || '';
  const vasatiId = (opts && opts.vasatiId) || '';
  shakheReturnTo = 'nagara-varadi-list';
  nagaraListContext = {
    mode: 'shakhe-days-ran',
    entityLevel,
    entityId,
    entityName,
    vasatiId: vasatiId || null,
    daysRanExact,
    titleName: entityName,
  };
  const errorEl = document.getElementById('nagara-list-error');
  const body = document.getElementById('nagara-list-body');
  errorEl.classList.add('hidden');
  body.innerHTML = '';
  document.getElementById('nagara-list-title').textContent =
    daysRanExact === 1
      ? `1 ದಿನ ನಡೆದಿದೆ/1 day ran — ${entityName}`
      : `${daysRanExact} ದಿನ ನಡೆದಿದೆ/${daysRanExact} days ran — ${entityName}`;
  showScreen(nagaraListView);
  setNagaraListLoading(true);
  try {
    const range = nagaraVaradiRangeDays();
    if (entityLevel === 'nagara') {
      const params = new URLSearchParams({
        filter: 'days-ran',
        daysRanExact: String(daysRanExact),
        from: range.from,
        to: range.to,
        nagarId: entityId,
      });
      if (vasatiId) params.set('vasatiId', vasatiId);
      if (range.excludeSunday) params.set('excludeSunday', '1');
      const res = await fetch(`/api/nagara/shakhes?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (bounceIfVaradiAuth(res, data)) return;
      if (!res.ok) {
        errorEl.textContent = data.error || 'ಶಾಖೆ ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load shakhes';
        errorEl.classList.remove('hidden');
        return;
      }
      // Reuse running-table painter path via temporary filter swap.
      const items = data.shakhes || [];
      nagaraListContext.filter = 'days-ran';
      // Paint using the same markup as running list.
      const daysSelected = data.dayCount || range.count || 0;
      const cell = (v) => (v == null ? '—' : String(v));
      const avgCell = (v) => formatAvg(v);
      if (!items.length) {
        body.innerHTML = '<p class="view-empty">ಶಾಖೆಗಳಿಲ್ಲ/No shakhes</p>';
        return;
      }
      const head =
        `<table class="varadi-table shakhe-list-table running-shakhe-table"><thead>` +
        `<tr>` +
        `<th rowspan="2">${stackedLabel(LABEL_UPAVASATI)}</th>` +
        `<th rowspan="2">${stackedLabel('ಶಾಖೆ/Shakhe')}</th>` +
        `<th class="num" rowspan="2">${stackedLabel('ನಡೆದ ದಿನಗಳು/Days ran')}</th>` +
        `<th class="num group-head" colspan="5">${stackedLabel('ಸರಾಸರಿ/Average')}</th>` +
        `<th class="num group-head" colspan="2">${stackedLabel('ಒಟ್ಟು ಸಂಪರ್ಕ/Ottu samparka')}</th>` +
        `</tr><tr>` +
        `<th class="num">${stackedLabel('ತರುಣ/Taruna')}</th>` +
        `<th class="num">${stackedLabel('ಬಾಲಕ/Balaka')}</th>` +
        `<th class="num">${stackedLabel('ಒಟ್ಟು/Total')}</th>` +
        `<th class="num">${stackedLabel('ಶಿಶು/Shishu')}</th>` +
        `<th class="num">${stackedLabel('ಮಾತಾ-ಭಗಿನಿ/Mata Bhagini')}</th>` +
        `<th class="num">${stackedLabel('ಮನೆಗಳು/Manegalu')}</th>` +
        `<th class="num">${stackedLabel('ವ್ಯಕ್ತಿಗಳು/Vyaktigalu')}</th>` +
        `</tr></thead><tbody>`;
      const rows = items
        .map((s) => {
          const a = s.averages || {};
          const sam = s.ottuSamparka || {};
          const ran = s.daysRan || 0;
          const selected = s.daysSelected != null ? s.daysSelected : daysSelected;
          const nagarAttr = (s.nagar && s.nagar.id) || nagaraId || '';
          return (
            `<tr>` +
            `<td class="cell-text">${escapeHtml((s.upavasati && s.upavasati.name) || '—')}</td>` +
            `<td class="cell-name">${escapeHtml(s.name || '—')}</td>` +
            `<td class="num"><button type="button" class="num-link" data-shakhe-varadi="${escapeHtml(
              s.id
            )}" data-nagar-id="${escapeHtml(nagarAttr)}">${escapeHtml(String(ran))}/${escapeHtml(
              String(selected)
            )}</button></td>` +
            `<td class="num">${avgCell(a.taruna)}</td>` +
            `<td class="num">${avgCell(a.balaka)}</td>` +
            `<td class="num">${avgCell(a.total)}</td>` +
            `<td class="num">${avgCell(a.shishu)}</td>` +
            `<td class="num">${avgCell(a.mataBhagi)}</td>` +
            `<td class="num">${cell(sam.manegalu)}</td>` +
            `<td class="num">${cell(sam.vyaktigalu)}</td>` +
            `</tr>`
          );
        })
        .join('');
      const tot = shakheDaysRanListTotals(items);
      const foot =
        `<tfoot><tr class="report-total-row">` +
        `<td colspan="2">${stackedLabel('ಒಟ್ಟು/Total')}</td>` +
        `<td class="num">—</td>` +
        `<td class="num">${tot.avgCell(tot.averages.taruna)}</td>` +
        `<td class="num">${tot.avgCell(tot.averages.balaka)}</td>` +
        `<td class="num">${tot.avgCell(tot.averages.total)}</td>` +
        `<td class="num">${tot.avgCell(tot.averages.shishu)}</td>` +
        `<td class="num">${tot.avgCell(tot.averages.mataBhagi)}</td>` +
        `<td class="num">${tot.cell(tot.ottuSamparka.manegalu)}</td>` +
        `<td class="num">${tot.cell(tot.ottuSamparka.vyaktigalu)}</td>` +
        `</tr></tfoot>`;
      body.innerHTML =
        `<div class="list-summary program-split-summary">` +
        `<div class="list-summary-item"><span class="list-summary-label">${stackedLabel(
          'ಶಾಖೆಗಳು/Shakhes'
        )}</span><strong class="list-summary-value">${items.length}</strong></div>` +
        `</div>${head}${rows}</tbody>${foot}</table>`;
      body.querySelectorAll('button[data-shakhe-varadi]').forEach((btn) => {
        btn.addEventListener('click', () =>
          openNagaraShakheDayVaradi(
            btn.getAttribute('data-shakhe-varadi'),
            btn.getAttribute('data-nagar-id') || ''
          )
        );
      });
      return;
    }

    const params = new URLSearchParams({
      level: entityLevel,
      entityId,
      from: range.from,
      to: range.to,
      daysRanExact: String(daysRanExact),
    });
    if (vasatiId) params.set('vasatiId', vasatiId);
    if (range.excludeSunday) params.set('excludeSunday', '1');
    const res = await fetch(`/api/varadi/shakhe-status-shakhes?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (bounceIfVaradiAuth(res, data)) return;
    if (!res.ok) {
      errorEl.textContent = data.error || 'ಶಾಖೆ ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load shakhes';
      errorEl.classList.remove('hidden');
      return;
    }
    const allShakhes = sortProgramSplitShakhes([
      ...flattenProgramSplitShakhes(data.withItem || {}),
      ...flattenProgramSplitShakhes(data.withoutItem || {}),
    ]);
    body.innerHTML =
      `<div class="list-summary program-split-summary">` +
      `<div class="list-summary-item"><span class="list-summary-label">${stackedLabel(
        'ಶಾಖೆಗಳು/Shakhes'
      )}</span><strong class="list-summary-value">${allShakhes.length}</strong></div>` +
      `</div>` +
      paintShakheDaysRanDetailTable(allShakhes);
    body.querySelectorAll('button[data-shakhe-varadi]').forEach((btn) => {
      btn.addEventListener('click', () =>
        openNagaraShakheDayVaradi(
          btn.getAttribute('data-shakhe-varadi'),
          btn.getAttribute('data-nagar-id') || ''
        )
      );
    });
  } finally {
    setNagaraListLoading(false);
  }
}

function programHitExtrasHtml(day, programKind) {
  const parts = [];
  if (programKind === 'boudhik') {
    if (day.boudhikPerson && (day.boudhikPerson.name || day.boudhikPerson.phone)) {
      parts.push(
        `<div class="program-hit-extra">${escapeHtml(
          personCell(day.boudhikPerson.name, day.boudhikPerson.phone)
        )}</div>`
      );
    }
    if (day.charchePerson && (day.charchePerson.name || day.charchePerson.phone)) {
      parts.push(
        `<div class="program-hit-extra">${escapeHtml(
          personCell(day.charchePerson.name, day.charchePerson.phone)
        )}</div>`
      );
    }
    if (day.sannaKatheText) {
      parts.push(
        `<div class="program-hit-extra"><strong>${stackedLabel('ಸಣ್ಣ ಕಥೆ/Sanna Kathe')}</strong>: ${escapeHtml(
          day.sannaKatheText
        )}</div>`
      );
    }
    if (day.deerghaKatheText) {
      parts.push(
        `<div class="program-hit-extra"><strong>${stackedLabel('ದೀರ್ಘ ಕಥೆ/Deergha Kathe')}</strong>: ${escapeHtml(
          day.deerghaKatheText
        )}</div>`
      );
    }
    if (day.boudhikItara) {
      parts.push(
        `<div class="program-hit-extra"><strong>${stackedLabel('ಇತರೆ/Itara')}</strong>: ${escapeHtml(
          day.boudhikItara
        )}</div>`
      );
    }
  } else if (day.sharirikItara) {
    parts.push(
      `<div class="program-hit-extra"><strong>${stackedLabel('ಇತರೆ/Itara')}</strong>: ${escapeHtml(
        day.sharirikItara
      )}</div>`
    );
  }
  return parts.join('') || '<span class="username">—</span>';
}

async function openNagaraProgramItemHits(vasatiId, titleName, itemId, itemLabel) {
  if (!itemId) return;
  const programKind =
    nagaraReportKind === 'sharirik' || nagaraReportKind === 'boudhik' ? nagaraReportKind : 'boudhik';
  shakheReturnTo = 'nagara-varadi-list';
  nagaraListContext = {
    mode: 'program-item',
    vasatiId: vasatiId || null,
    titleName: titleName || '',
    filter: 'program-item',
    itemId,
    itemLabel: itemLabel || itemId,
    programKind,
  };
  const errorEl = document.getElementById('nagara-list-error');
  const body = document.getElementById('nagara-list-body');
  errorEl.classList.add('hidden');
  body.innerHTML = '';
  const label = itemLabel || itemId;
  document.getElementById('nagara-list-title').textContent = `${label} — ${titleName || ''}`;
  showScreen(nagaraListView);
  setNagaraListLoading(true);
  try {
    if (!requireScopedNagarOrBounce(errorEl)) return;
    const range = nagaraVaradiRangeDays();
    const params = new URLSearchParams({
      kind: programKind,
      itemId,
      from: range.from,
      to: range.to,
    });
    if (vasatiId) params.set('vasatiId', vasatiId);
    if (range.excludeSunday) params.set('excludeSunday', '1');
    withScopedNagarId(params);
    const res = await fetch(`/api/nagara/program-item-hits?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (bounceIfVaradiAuth(res, data)) return;
    if (!res.ok) {
      errorEl.textContent = data.error || 'ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load';
      errorEl.classList.remove('hidden');
      return;
    }
    const groups = data.upavasatis || [];
    if (!groups.length) {
      body.innerHTML = '<p class="view-empty">ಆಯ್ಕೆಗಳಿಲ್ಲ/No selections</p>';
      return;
    }
    const summary =
      `<div class="list-summary">` +
      `<div class="list-summary-item"><span class="list-summary-label">${stackedLabel(
        'ಆಯ್ಕೆಗಳು/Selections'
      )}</span><strong class="list-summary-value">${escapeHtml(String(data.hitCount || 0))}</strong></div>` +
      `<div class="list-summary-item"><span class="list-summary-label">${stackedLabel(
        'ಶಾಖೆಗಳು/Shakhes'
      )}</span><strong class="list-summary-value">${escapeHtml(
        String((data.shakhes || []).length)
      )}</strong></div>` +
      `</div>`;

    const flatRows = [];
    for (const upa of groups) {
      for (const s of upa.shakhes || []) {
        for (const day of s.days || []) {
          flatRows.push({ upa, shakhe: s, day });
        }
      }
    }
    const rowHtml = flatRows
      .map(({ upa, shakhe, day }) => {
        const typeLabel = TYPE_LABEL[shakhe.shakheType] || shakhe.shakheType || '—';
        const timingLabel = TIMING_LABEL[shakhe.timing] || shakhe.timing || '—';
        return (
          `<tr>` +
          `<td>${escapeHtml((upa && upa.name) || '—')}</td>` +
          `<td class="cell-name">${escapeHtml(shakhe.name || '—')}</td>` +
          `<td>${escapeHtml(typeLabel)}</td>` +
          `<td>${escapeHtml(timingLabel)}</td>` +
          `<td>${escapeHtml(shakhe.time || '—')}</td>` +
          `<td>${escapeHtml(formatDateDisplay(day.date))}</td>` +
          `<td>${escapeHtml((weekdayParts(day.date) || {}).value || '—')}</td>` +
          `<td>${escapeHtml(itemLabel || '—')}</td>` +
          `<td class="cell-details">${programHitExtrasHtml(day, programKind)}</td>` +
          `</tr>`
        );
      })
      .join('');
    const table =
      `<div class="table-wrap">` +
      `<table class="varadi-table program-hit-table program-hit-flat">` +
      `<thead><tr>` +
      `<th>${stackedLabel(LABEL_UPAVASATI)}</th>` +
      `<th>${stackedLabel('ಶಾಖೆ/Shakhe')}</th>` +
      `<th>${stackedLabel('ಪ್ರಕಾರ/Type')}</th>` +
      `<th>${stackedLabel('ಸಮಯ/Timing')}</th>` +
      `<th>${stackedLabel('ಗಂಟೆ/Time')}</th>` +
      `<th>${stackedLabel('ದಿನಾಂಕ/Date')}</th>` +
      `<th>${stackedLabel('ದಿನ/Day')}</th>` +
      `<th>${stackedLabel('ಆಯ್ಕೆ/Item')}</th>` +
      `<th>${stackedLabel('ವಿವರ/Details')}</th>` +
      `</tr></thead>` +
      `<tbody>${rowHtml}</tbody>` +
      `</table></div>`;

    body.innerHTML = summary + table;
  } finally {
    setNagaraListLoading(false);
  }
}

function paintNagaraReport(data) {
  if (nagaraReportKind === 'boudhik' || nagaraReportKind === 'sharirik') {
    paintNagaraProgramVaradi(data);
    return;
  }
  paintNagaraShakheVaradi(data);
}

async function openNagaraShakheVaradi(opts) {
  const scopeLevel = reportScopeLevel || sessionLevel || 'nagara';
  const scopeEntityId = reportScopeEntityId || sessionEntityId || nagaraId;
  if (!scopeEntityId || !VARADI_LEVELS.includes(scopeLevel)) {
    showVaradiGate();
    return;
  }
  reportScopeLevel = scopeLevel;
  reportScopeEntityId = scopeEntityId;
  if (scopeLevel === 'nagara') {
    nagaraId = scopeEntityId;
    if (!nagaraName && reportScopeEntityName) nagaraName = reportScopeEntityName;
  }

  const nextKind =
    opts && opts.kind ? opts.kind : nagaraReportKind || 'shakhe';
  if (opts && opts.kind && opts.kind !== nagaraReportKind) {
    nagaraReportCache = null;
  }
  nagaraReportKind = nextKind;
  setNagaraReportTitle(nagaraReportKind);

  const errorEl = document.getElementById('nagara-report-error');
  errorEl.classList.add('hidden');
  setNagaraReportPlace(nagaraReportCache);

  const today = todayIst();
  const fromEl = document.getElementById('nagara-varadi-from');
  const toEl = document.getElementById('nagara-varadi-to');
  fromEl.max = today;
  toEl.max = today;
  if (!fromEl.value) fromEl.value = addDaysIso(today, -6);
  if (!toEl.value) toEl.value = today;
  if (fromEl.value > today) fromEl.value = today;
  if (toEl.value > today) toEl.value = today;

  const { from, to, count, calendarCount, excludeSunday } = nagaraVaradiRangeDays();
  const isProgramReport = nextKind === 'boudhik' || nextKind === 'sharirik';
  syncNagaraProgramDayFilter(count, isProgramReport);
  const itemDayCount = isProgramReport ? nagaraProgramItemDayCount() : '';
  showScreen(nagaraReportView);

  const cacheOk =
    opts &&
    opts.useCache &&
    nagaraReportCache &&
    nagaraReportCache.from === from &&
    nagaraReportCache.to === to &&
    Boolean(nagaraReportCache.excludeSunday) === excludeSunday &&
    String(nagaraReportCache.itemDayCount || '') === String(itemDayCount) &&
    (nagaraReportCache.level || 'nagara') === scopeLevel &&
    ((scopeLevel === 'nagara' &&
      nagaraReportCache.nagar &&
      nagaraReportCache.nagar.id === scopeEntityId) ||
      (scopeLevel === 'prant' &&
        nagaraReportCache.prant &&
        nagaraReportCache.prant.id === scopeEntityId) ||
      (scopeLevel === 'vibhag' &&
        nagaraReportCache.vibhag &&
        nagaraReportCache.vibhag.id === scopeEntityId) ||
      (scopeLevel === 'bhag' &&
        nagaraReportCache.bhag &&
        nagaraReportCache.bhag.id === scopeEntityId)) &&
    (nagaraReportKind === 'shakhe'
      ? !nagaraReportCache.kind
      : nagaraReportCache.kind === nagaraReportKind);
  if (cacheOk) {
    setNagaraVaradiDayCount(nagaraReportCache.dayCount || count);
    setNagaraReportPlace(nagaraReportCache);
    paintNagaraReport(nagaraReportCache);
    return;
  }

  if (calendarCount > 62) {
    errorEl.textContent = 'ಗರಿಷ್ಠ 62 ದಿನ ಆಯ್ಕೆಮಾಡಿ/Select at most 62 days';
    errorEl.classList.remove('hidden');
    document.getElementById('nagara-report-table').innerHTML = '';
    return;
  }

  const seq = ++nagaraReportLoadSeq;
  setNagaraReportLoading(true);
  document.getElementById('nagara-report-table').innerHTML = '';
  try {
    const params = new URLSearchParams({ from, to });
    if (excludeSunday) params.set('excludeSunday', '1');
    if (itemDayCount) params.set('itemDayCount', itemDayCount);
    let url;
    if (scopeLevel === 'nagara') {
      params.set('nagarId', scopeEntityId);
      url =
        nagaraReportKind === 'shakhe'
          ? `/api/nagara/shakhe-varadi?${params.toString()}`
          : `/api/nagara/program-varadi?kind=${encodeURIComponent(
            nagaraReportKind
          )}&${params.toString()}`;
    } else {
      params.set(`${scopeLevel}Id`, scopeEntityId);
      url =
        nagaraReportKind === 'shakhe'
          ? `/api/varadi/${scopeLevel}/report?${params.toString()}`
          : `/api/varadi/${scopeLevel}/program-varadi?kind=${encodeURIComponent(
            nagaraReportKind
          )}&${params.toString()}`;
    }
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (seq !== nagaraReportLoadSeq) return;
    if (bounceIfVaradiAuth(res, data)) return;
    if (!res.ok) {
      errorEl.textContent = data.error || 'ವರದಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load report';
      errorEl.classList.remove('hidden');
      return;
    }
    if (!data.level) data.level = scopeLevel;
    nagaraReportCache = data;
    setNagaraVaradiDayCount(data.dayCount || count);
    setNagaraReportPlace(data);
    paintNagaraReport(data);
  } finally {
    if (seq === nagaraReportLoadSeq) setNagaraReportLoading(false);
  }
}

function runningVaradiTableHtml(days) {
  const head =
    '<thead><tr>' +
    `<th>${stackedLabel('ದಿನಾಂಕ/Date')}</th>` +
    `<th class="num">${stackedLabel('ತರುಣ/Taruna')}</th>` +
    `<th class="num">${stackedLabel('ಬಾಲಕ/Balaka')}</th>` +
    `<th class="num">${stackedLabel('ಶಿಶು/Shishu')}</th>` +
    `<th class="num">${stackedLabel('ಮಾತಾ-ಭಗಿನಿ/Mata Bhagini')}</th>` +
    `<th class="num">${stackedLabel('ಒಟ್ಟು/Total')}</th>` +
    `<th class="num">${stackedLabel('ಮನೆಗಳು/Manegalu')}</th>` +
    `<th class="num">${stackedLabel('ವ್ಯಕ್ತಿಗಳು/Vyaktigalu')}</th>` +
    `<th class="num">${stackedLabel('ಬೌದ್ಧಿಕ್/Boudhik')}</th>` +
    `<th class="num">${stackedLabel('ಶಾರೀರಿಕ/Sharirik')}</th>` +
    `<th>${stackedLabel('ಸೇವಾ/Seva')}</th>` +
    '</tr></thead>';
  const sums = {
    taruna: 0,
    balaka: 0,
    shishu: 0,
    mataBhagi: 0,
    total: 0,
    manegalu: 0,
    vyaktigalu: 0,
    boudhik: 0,
    sharirik: 0,
    sevaDays: 0,
    ranDays: 0,
  };
  const rows = (days || [])
    .map((row) => {
      const u = row.upasthiti;
      const dateLabel = formatDateDisplay(row.date);
      if (!u) {
        return (
          `<tr><td>${escapeHtml(dateLabel)}</td>` +
          `<td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td>` +
          `<td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td>` +
          `<td class="num">—</td><td>—</td></tr>`
        );
      }
      sums.ranDays += 1;
      sums.taruna += u.taruna || 0;
      sums.balaka += u.balaka || 0;
      sums.shishu += u.shishu || 0;
      sums.mataBhagi += u.mataBhagi || 0;
      sums.total += u.total != null ? u.total : (u.taruna || 0) + (u.balaka || 0);
      sums.manegalu += u.samparkitaManegalu || 0;
      sums.vyaktigalu += u.samparkitaVyaktigalu || 0;
      sums.boudhik += u.boudhikCount || 0;
      sums.sharirik += u.sharirikCount || 0;
      if (u.seva) sums.sevaDays += 1;
      return (
        `<tr>` +
        `<td>${escapeHtml(dateLabel)}</td>` +
        `<td class="num">${escapeHtml(u.taruna)}</td>` +
        `<td class="num">${escapeHtml(u.balaka)}</td>` +
        `<td class="num">${escapeHtml(u.shishu)}</td>` +
        `<td class="num">${escapeHtml(u.mataBhagi)}</td>` +
        `<td class="num">${escapeHtml(u.total)}</td>` +
        `<td class="num">${escapeHtml(u.samparkitaManegalu == null ? '—' : u.samparkitaManegalu)}</td>` +
        `<td class="num">${escapeHtml(u.samparkitaVyaktigalu == null ? '—' : u.samparkitaVyaktigalu)}</td>` +
        `<td class="num">${escapeHtml(u.boudhikCount || 0)}</td>` +
        `<td class="num">${escapeHtml(u.sharirikCount || 0)}</td>` +
        `<td>${u.seva ? escapeHtml('ನಡೆದಿದೆ/Done') : escapeHtml('ಆಗಿಲ್ಲ/Not done')}</td>` +
        `</tr>`
      );
    })
    .join('');
  const foot =
    `<tfoot><tr class="report-total-row">` +
    `<td>${stackedLabel('ಒಟ್ಟು/Total')}</td>` +
    `<td class="num">${escapeHtml(sums.taruna)}</td>` +
    `<td class="num">${escapeHtml(sums.balaka)}</td>` +
    `<td class="num">${escapeHtml(sums.shishu)}</td>` +
    `<td class="num">${escapeHtml(sums.mataBhagi)}</td>` +
    `<td class="num">${escapeHtml(sums.total)}</td>` +
    `<td class="num">${escapeHtml(sums.manegalu)}</td>` +
    `<td class="num">${escapeHtml(sums.vyaktigalu)}</td>` +
    `<td class="num">${escapeHtml(sums.boudhik)}</td>` +
    `<td class="num">${escapeHtml(sums.sharirik)}</td>` +
    `<td>${escapeHtml(String(sums.sevaDays))}/${escapeHtml(String(sums.ranDays || 0))}</td>` +
    `</tr></tfoot>`;
  return `<table class="varadi-table nagara-running-varadi">${head}<tbody>${rows}</tbody>${foot}</table>`;
}

function programVaradiTableHtml(days, programKind) {
  const catalog = programKind === 'sharirik' ? SHARIRIK_ITEMS : BOUDHIK_ITEMS;
  const field = programKind === 'sharirik' ? 'sharirik' : 'boudhik';
  const itaraKey = programKind === 'sharirik' ? 'sharirikItara' : 'boudhikItara';
  const head =
    '<thead><tr>' +
    `<th>${stackedLabel('ದಿನಾಂಕ/Date')}</th>` +
    catalog.map((item) => `<th class="num">${stackedLabel(`${item.kn}/${item.en}`)}</th>`).join('') +
    `<th>${stackedLabel('ಇತರೆ/Itara')}</th>` +
    '</tr></thead>';
  const counts = {};
  catalog.forEach((item) => {
    counts[item.id] = 0;
  });
  let ranDays = 0;
  const rows = (days || [])
    .map((row) => {
      const u = row.upasthiti;
      const dateLabel = formatDateDisplay(row.date);
      if (!u) {
        return (
          `<tr><td>${escapeHtml(dateLabel)}</td>` +
          catalog.map(() => `<td class="num">—</td>`).join('') +
          `<td>—</td></tr>`
        );
      }
      ranDays += 1;
      const picked = new Set(u[field] || []);
      const cells = catalog
        .map((item) => {
          if (picked.has(item.id)) {
            counts[item.id] += 1;
            return `<td class="num program-check-yes">✓</td>`;
          }
          return `<td class="num">—</td>`;
        })
        .join('');
      const itara = u[itaraKey] || '';
      return (
        `<tr>` +
        `<td>${escapeHtml(dateLabel)}</td>` +
        cells +
        `<td class="cell-text">${escapeHtml(itara || '—')}</td>` +
        `</tr>`
      );
    })
    .join('');
  const footCells = catalog
    .map((item) => `<td class="num">${escapeHtml(String(counts[item.id] || 0))}/${escapeHtml(String(ranDays))}</td>`)
    .join('');
  const foot =
    `<tfoot><tr class="report-total-row">` +
    `<td>${stackedLabel('ಒಟ್ಟು/Total')}</td>` +
    footCells +
    `<td></td>` +
    `</tr></tfoot>`;
  return `<table class="varadi-table nagara-running-varadi program-check-table">${head}<tbody>${rows}</tbody>${foot}</table>`;
}

function shakheMetaLine(s) {
  return [
    (s.upavasati && s.upavasati.name) || '',
    TYPE_LABEL[s.shakheType] || s.shakheType || '',
    TIMING_LABEL[s.timing] || s.timing || '',
    s.time || '',
  ]
    .filter(Boolean)
    .join(' · ');
}

async function openNagaraShakheDayVaradi(shakheId, nagarIdHint) {
  if (!shakheId) return;
  const prev = nagaraListContext || {};
  const listReturn =
    prev.mode === 'shakhe-varadi' && prev.listReturn
      ? prev.listReturn
      : {
        mode: prev.mode || null,
        entityLevel: prev.entityLevel || null,
        entityId: prev.entityId || null,
        entityName: prev.entityName || '',
        vasatiId: prev.vasatiId || null,
        titleName: prev.titleName || '',
        itemFilter: prev.itemFilter || 'all',
        filter: prev.filter || 'all',
        daysRanExact: prev.daysRanExact,
        itemId: prev.itemId || null,
        itemLabel: prev.itemLabel || '',
        nagarId: prev.nagarId || nagarIdHint || null,
      };
  nagaraListContext = {
    mode: 'shakhe-varadi',
    vasatiId: prev.vasatiId || null,
    titleName: prev.titleName || '',
    filter: prev.filter || 'all',
    shakheId,
    nagarId: nagarIdHint || prev.nagarId || null,
    listReturn,
  };
  shakheReturnTo = 'nagara-varadi-list';
  const errorEl = document.getElementById('nagara-list-error');
  const body = document.getElementById('nagara-list-body');
  errorEl.classList.add('hidden');
  body.innerHTML = '';
  const programKind =
    nagaraReportKind === 'boudhik' || nagaraReportKind === 'sharirik' ? nagaraReportKind : null;
  document.getElementById('nagara-list-title').textContent = programKind
    ? programKind === 'boudhik'
      ? 'ಬೌದ್ಧಿಕ್ ವರದಿ/Boudhik Varadi'
      : 'ಶಾರೀರಿಕ ವರದಿ/Sharirik Varadi'
    : 'ಶಾಖೆ ವರದಿ/Shakhe Varadi';
  showScreen(nagaraListView);
  setNagaraListLoading(true);
  try {
    const range = nagaraVaradiRangeDays();
    const params = new URLSearchParams({
      filter: 'varadi',
      shakheId,
      from: range.from,
      to: range.to,
    });
    if (range.excludeSunday) params.set('excludeSunday', '1');
    const hint = nagarIdHint || (nagaraListContext && nagaraListContext.nagarId) || '';
    if (hint) params.set('nagarId', hint);
    else withScopedNagarId(params);
    const res = await fetch(`/api/nagara/shakhes?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (bounceIfVaradiAuth(res, data)) return;
    if (!res.ok) {
      errorEl.textContent = data.error || 'ವರದಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load varadi';
      errorEl.classList.remove('hidden');
      return;
    }
    const shakhe = (data.shakhes || [])[0];
    if (!shakhe) {
      body.innerHTML = '<p class="view-empty">ಶಾಖೆ ಇಲ್ಲ/Shakhe not found</p>';
      return;
    }
    const meta = shakheMetaLine(shakhe);
    const path = [shakhe.vasati && shakhe.vasati.name, shakhe.upavasati && shakhe.upavasati.name]
      .filter(Boolean)
      .join(' · ');
    const tableHtml = programKind
      ? programVaradiTableHtml(shakhe.days || [], programKind)
      : runningVaradiTableHtml(shakhe.days || []);
    body.innerHTML =
      `<div class="nagara-shakhe-varadi-head">` +
      `<h2 class="shakhe-head">${escapeHtml(shakhe.name || '—')}</h2>` +
      (path ? `<p class="username">${escapeHtml(path)}</p>` : '') +
      (meta ? `<p class="username">${escapeHtml(meta)}</p>` : '') +
      `<p class="total-line">ಆಯ್ಕೆ ಮಾಡಿದ ದಿನಗಳು/Days selected <strong>${escapeHtml(
        String(data.dayCount || (shakhe.days || []).length || 0)
      )}</strong>` +
      ` · ನಡೆದ ದಿನಗಳು/Days ran <strong>${escapeHtml(String(shakhe.daysRan || 0))}</strong></p>` +
      `</div>` +
      `<div class="table-wrap">${tableHtml}</div>`;
  } finally {
    setNagaraListLoading(false);
  }
}

async function openNagaraShakheDrilldown(vasatiId, titleName, filter) {
  const kind = filter || 'all';
  shakheReturnTo = 'nagara-varadi-list';
  nagaraListContext = {
    mode: 'shakhes',
    vasatiId: vasatiId || null,
    titleName: titleName || '',
    filter: kind,
  };
  const titles = {
    all: 'ಯೋಜಿತ ಶಾಖೆ/Yojita Shakhe',
    yojita: 'ಯೋಜಿತ ಶಾಖೆ/Yojita Shakhe',
    running: 'ನಡೆಯುತ್ತಿರುವ ಶಾಖೆಗಳು/Nadayuthiruva Shakhegalu',
    'not-running': 'ನಡೆಯದ ಶಾಖೆ/Nadayada Shakhe',
  };
  const apiFilter = kind === 'yojita' ? 'all' : kind === 'all' ? 'all' : kind;
  const errorEl = document.getElementById('nagara-list-error');
  const body = document.getElementById('nagara-list-body');
  errorEl.classList.add('hidden');
  body.innerHTML = '';
  document.getElementById('nagara-list-title').textContent = `${titles[kind] || titles.all} — ${titleName || ''}`;
  showScreen(nagaraListView);
  setNagaraListLoading(true);
  try {
    if (!requireScopedNagarOrBounce(errorEl)) return;
    const params = new URLSearchParams({ filter: apiFilter });
    if (vasatiId) params.set('vasatiId', vasatiId);
    if (apiFilter === 'running' || apiFilter === 'not-running' || apiFilter === 'varadi') {
      const range = nagaraVaradiRangeDays();
      params.set('from', range.from);
      params.set('to', range.to);
      if (range.excludeSunday) params.set('excludeSunday', '1');
    }
    withScopedNagarId(params);
    const res = await fetch(`/api/nagara/shakhes?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (bounceIfVaradiAuth(res, data)) return;
    if (!res.ok) {
      errorEl.textContent = data.error || 'ಶಾಖೆ ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load shakhes';
      errorEl.classList.remove('hidden');
      return;
    }
    const items = data.shakhes || [];
    if (!items.length) {
      body.innerHTML = '<p class="view-empty">ಶಾಖೆಗಳಿಲ್ಲ/No shakhes</p>';
      return;
    }

    if (apiFilter === 'running') {
      const daysSelected = data.dayCount || nagaraVaradiRangeDays().count || 0;
      const cell = (v) => (v == null ? '—' : String(v));
      const avgCell = (v) => formatAvg(v);
      const head =
        `<table class="varadi-table shakhe-list-table running-shakhe-table"><thead>` +
        `<tr>` +
        `<th rowspan="2">${stackedLabel(LABEL_UPAVASATI)}</th>` +
        `<th rowspan="2">${stackedLabel('ಶಾಖೆ/Shakhe')}</th>` +
        `<th class="num" rowspan="2">${stackedLabel('ನಡೆದ ದಿನಗಳು/Days ran')}</th>` +
        `<th class="num group-head" colspan="5">${stackedLabel('ಸರಾಸರಿ/Average')}</th>` +
        `<th class="num group-head" colspan="2">${stackedLabel('ಒಟ್ಟು ಸಂಪರ್ಕ/Ottu samparka')}</th>` +
        `</tr>` +
        `<tr>` +
        `<th class="num">${stackedLabel('ತರುಣ/Taruna')}</th>` +
        `<th class="num">${stackedLabel('ಬಾಲಕ/Balaka')}</th>` +
        `<th class="num">${stackedLabel('ಒಟ್ಟು/Total')}</th>` +
        `<th class="num">${stackedLabel('ಶಿಶು/Shishu')}</th>` +
        `<th class="num">${stackedLabel('ಮಾತಾ-ಭಗಿನಿ/Mata Bhagini')}</th>` +
        `<th class="num">${stackedLabel('ಮನೆಗಳು/Manegalu')}</th>` +
        `<th class="num">${stackedLabel('ವ್ಯಕ್ತಿಗಳು/Vyaktigalu')}</th>` +
        `</tr>` +
        `</thead><tbody>`;
      const rows = items
        .map((s) => {
          const a = s.averages || {};
          const sam = s.ottuSamparka || {};
          const ran = s.daysRan || 0;
          const selected = s.daysSelected != null ? s.daysSelected : daysSelected;
          const nagarAttr = (s.nagar && s.nagar.id) || nagaraId || '';
          return (
            `<tr>` +
            `<td class="cell-text">${escapeHtml((s.upavasati && s.upavasati.name) || '—')}</td>` +
            `<td class="cell-name">${escapeHtml(s.name || '—')}</td>` +
            `<td class="num"><button type="button" class="num-link" data-shakhe-varadi="${escapeHtml(
              s.id
            )}" data-nagar-id="${escapeHtml(nagarAttr)}">${escapeHtml(String(ran))}/${escapeHtml(
              String(selected)
            )}</button></td>` +
            `<td class="num">${avgCell(a.taruna)}</td>` +
            `<td class="num">${avgCell(a.balaka)}</td>` +
            `<td class="num">${avgCell(a.total)}</td>` +
            `<td class="num">${avgCell(a.shishu)}</td>` +
            `<td class="num">${avgCell(a.mataBhagi)}</td>` +
            `<td class="num">${cell(sam.manegalu)}</td>` +
            `<td class="num">${cell(sam.vyaktigalu)}</td>` +
            `</tr>`
          );
        })
        .join('');
      const tot = shakheDaysRanListTotals(items);
      const foot =
        `<tr class="report-total-row">` +
        `<td colspan="2">${stackedLabel('ಒಟ್ಟು/Total')}</td>` +
        `<td class="num">—</td>` +
        `<td class="num">${tot.avgCell(tot.averages.taruna)}</td>` +
        `<td class="num">${tot.avgCell(tot.averages.balaka)}</td>` +
        `<td class="num">${tot.avgCell(tot.averages.total)}</td>` +
        `<td class="num">${tot.avgCell(tot.averages.shishu)}</td>` +
        `<td class="num">${tot.avgCell(tot.averages.mataBhagi)}</td>` +
        `<td class="num">${tot.cell(tot.ottuSamparka.manegalu)}</td>` +
        `<td class="num">${tot.cell(tot.ottuSamparka.vyaktigalu)}</td>` +
        `</tr>`;
      body.innerHTML =
        `<div class="list-summary">` +
        `<div class="list-summary-item"><span class="list-summary-label">ನಡೆಯುತ್ತಿರುವ/Running</span>` +
        `<strong class="list-summary-value">${items.length}</strong></div>` +
        `<div class="list-summary-item"><span class="list-summary-label">ಆಯ್ಕೆ ಮಾಡಿದ ದಿನಗಳು/Days selected</span>` +
        `<strong class="list-summary-value">${daysSelected}</strong></div>` +
        `</div>` +
        `${head}${rows}</tbody><tfoot>${foot}</tfoot></table>`;
      body.querySelectorAll('button[data-shakhe-varadi]').forEach((btn) => {
        btn.addEventListener('click', () =>
          openNagaraShakheDayVaradi(
            btn.getAttribute('data-shakhe-varadi'),
            btn.getAttribute('data-nagar-id') || ''
          )
        );
      });
      return;
    }

    // Yojita / Nadayada: shakhe list — click name opens date-range Shakhe Varadi.
    const head = shakheListHeadHtml({ withCheck: false });
    const rows = items.map((s) => `<tr>${shakheListCells(s)}</tr>`).join('');
    body.innerHTML =
      `<div class="list-summary">` +
      `<div class="list-summary-item"><span class="list-summary-label">ಒಟ್ಟು ಶಾಖೆ/Total</span>` +
      `<strong class="list-summary-value">${items.length}</strong></div>` +
      `</div>` +
      `<table class="varadi-table shakhe-list-table">${head}<tbody>${rows}</tbody></table>`;
    // Names stay plain text; only Edit opens the form.
    body.querySelectorAll('button[data-edit-id]').forEach((btn) => {
      btn.addEventListener('click', () => openEditShakhe(btn.getAttribute('data-edit-id')));
    });
  } finally {
    setNagaraListLoading(false);
  }
}

async function openNagaraUpavasatiList(vasatiId, titleName, filter) {
  shakheReturnTo = 'nagara-varadi-list';
  nagaraListContext = {
    mode: 'upavasatis',
    vasatiId: vasatiId || null,
    titleName: titleName || '',
    filter: filter || 'all',
    nagarId: scopedNagarId() || null,
  };
  const errorEl = document.getElementById('nagara-list-error');
  const body = document.getElementById('nagara-list-body');
  errorEl.classList.add('hidden');
  body.innerHTML = '';
  document.getElementById('nagara-list-title').textContent = `${LABEL_UPAVASATI} — ${titleName || ''}`;
  showScreen(nagaraListView);
  setNagaraListLoading(true);
  try {
    if (!requireScopedNagarOrBounce(errorEl)) return;
    const params = new URLSearchParams({ filter: 'all' });
    if (vasatiId) params.set('vasatiId', vasatiId);
    withScopedNagarId(params);
    const res = await fetch(`/api/nagara/upavasatis?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (bounceIfVaradiAuth(res, data)) return;
    if (!res.ok) {
      errorEl.textContent = data.error || 'ಗ್ರಾಮ/ಉಪವಸತಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ/Could not load upavasatis';
      errorEl.classList.remove('hidden');
      return;
    }
    const items = data.upavasatis || [];
    const withShakhe = items.filter((item) => item.hasShakhe);
    const withoutShakhe = items.filter((item) => !item.hasShakhe);
    const summaryHtml =
      `<div class="list-summary">` +
      `<div class="list-summary-item"><span class="list-summary-label">ಒಟ್ಟು ಗ್ರಾಮ/ಉಪವಸತಿ/Total</span>` +
      `<strong class="list-summary-value">${items.length}</strong></div>` +
      `<div class="list-summary-item"><span class="list-summary-label">ಶಾಖಾಯುಕ್ತ/Shakhayuktha</span>` +
      `<strong class="list-summary-value">${withShakhe.length}</strong></div>` +
      `<div class="list-summary-item"><span class="list-summary-label">ಶಾಖಾರಹಿತ/Shakharahita</span>` +
      `<strong class="list-summary-value">${withoutShakhe.length}</strong></div>` +
      `</div>`;

    function dropdownSection(titleLabel, count, inner) {
      return (
        `<details class="list-dropdown">` +
        `<summary>` +
        `<span class="list-dropdown-title">${stackedLabel(titleLabel)}</span>` +
        `<span class="list-dropdown-count">${count}</span>` +
        `</summary>` +
        `<div class="list-dropdown-body">${inner}</div>` +
        `</details>`
      );
    }

    function withoutShakheTable(rows) {
      if (!rows.length) return '<p class="view-empty">ಗ್ರಾಮ/ಉಪವಸತಿಗಳಿಲ್ಲ/No upavasatis</p>';
      const head =
        `<table class="upa-simple-table"><thead><tr>` +
        `<th>${stackedLabel(LABEL_UPAVASATI)}</th>` +
        `</tr></thead><tbody>`;
      const trs = rows.map((item) => `<tr><td>${escapeHtml(item.name)}</td></tr>`).join('');
      return `${head}${trs}</tbody></table>`;
    }

    function shakheDetailRowsHtml(list) {
      return (list || [])
        .map((s) => {
          const timing = TIMING_LABEL[s.timing] || s.timing || '—';
          const time = s.time || '';
          const timingHtml = time
            ? `${escapeHtml(timing)}<span class="cell-sub">${escapeHtml(time)}</span>`
            : escapeHtml(timing);
          return (
            `<tr>` +
            `<td class="cell-name">${escapeHtml(s.name || '—')}</td>` +
            `<td class="cell-timing">${timingHtml}</td>` +
            `<td class="cell-text">${escapeHtml(TYPE_LABEL[s.shakheType] || s.shakheType || '—')}</td>` +
            `<td class="cell-person">${escapeHtml(
              personCell(s.mukhashikshakName, s.mukhashikshakPhone)
            )}</td>` +
            `</tr>`
          );
        })
        .join('');
    }

    function withShakheGroupedHtml(rows) {
      const items = (rows || []).filter((item) => (item.shakhes || []).length);
      if (!items.length) return '<p class="view-empty">ಶಾಖೆಗಳಿಲ್ಲ/No shakhes</p>';
      const head =
        `<table class="varadi-table shakhe-list-table upa-shakhe-detail"><thead><tr>` +
        `<th>${stackedLabel('ಶಾಖೆ/Shakhe')}</th>` +
        `<th>${stackedLabel('ಸಮಯ/Timing')}</th>` +
        `<th>${stackedLabel('ಪ್ರಕಾರ/Type')}</th>` +
        `<th>${stackedLabel('ಮುಖ್ಯ ಶಿಕ್ಷಕ್/Mukhya Shikshak')}</th>` +
        `</tr></thead><tbody>`;
      return items
        .map((item) => {
          const list = item.shakhes || [];
          const table = `${head}${shakheDetailRowsHtml(list)}</tbody></table>`;
          return (
            `<details class="list-dropdown upa-shakhe-group" open>` +
            `<summary>` +
            `<span class="list-dropdown-title">` +
            `<strong>${escapeHtml(item.name)}</strong>` +
            `<span class="username"> · ${escapeHtml(String(list.length))} ಶಾಖೆ/Shakhe</span>` +
            `</span>` +
            `<span class="list-dropdown-count">${list.length}</span>` +
            `</summary>` +
            `<div class="list-dropdown-body">${table}</div>` +
            `</details>`
          );
        })
        .join('');
    }

    body.innerHTML =
      summaryHtml +
      dropdownSection(
        'ಶಾಖಾಯುಕ್ತ ಗ್ರಾಮ/ಉಪವಸತಿ/Shakhayuktha Grama/Upavasati',
        withShakhe.length,
        withShakheGroupedHtml(withShakhe)
      ) +
      dropdownSection(
        'ಶಾಖಾರಹಿತ ಗ್ರಾಮ/ಉಪವಸತಿ/Shakharahita Grama/Upavasati',
        withoutShakhe.length,
        withoutShakheTable(withoutShakhe)
      );

    body.querySelectorAll('details.list-dropdown').forEach((el) => {
      el.addEventListener('toggle', () => {
        if (!el.open) return;
        try {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } catch (_) {
          el.scrollIntoView(false);
        }
      });
    });
  } finally {
    setNagaraListLoading(false);
  }
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
  const values = UPASTHITI_COUNT_IDS.map((id) => {
    const raw = document.getElementById(id)?.value?.trim() ?? '';
    if (raw === '') return 0;
    return countVal(id) ?? 0;
  });
  return values.some((n) => n > 0);
}

function refreshDailySubmit() {
  document.getElementById('upasthiti-step-next').disabled = false;
  document.getElementById('upasthiti-submit').disabled = false;
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
  if (shakhe && shakhe.id) {
    saveSelectedShakheId(confirmPhone, shakhe.id);
    saveRecentShakhe(shakhe, confirmPhone);
  }
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
  hideLookupRecent();
  if (phone.length < 6) {
    errorEl.textContent = 'ಕನಿಷ್ಠ 6 ಅಂಕಿ ನಮೂದಿಸಿ/Enter at least 6 digits';
    errorEl.classList.remove('hidden');
    paintLookupRecent();
    return;
  }
  const session = await establishPhoneSession(phone, lookupPurpose);
  if (!session.ok) {
    errorEl.textContent =
      session.status === 429
        ? 'ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ/Try again later'
        : session.error;
    errorEl.classList.remove('hidden');
    paintLookupRecent();
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

const lookupPhoneInput = document.getElementById('lookup-phone');
if (lookupPhoneInput) {
  lookupPhoneInput.addEventListener('input', () => {
    const digits = String(lookupPhoneInput.value || '').replace(/\D/g, '');
    if (digits.length) {
      hideLookupRecent();
      return;
    }
    document.getElementById('lookup-results').innerHTML = '';
    paintLookupRecent();
  });
}

formPlace.bind();
setupPlace.bind();

document.getElementById('shakhe-step-next').addEventListener('click', () => {
  if (!showShakheStep1Errors()) {
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
  clearFieldErrors(['setup-stana-name', 'setup-location']);
  const stana = document.getElementById('setup-stana-name').value.trim();
  let ok = true;
  if (!stana) {
    setFieldError('setup-stana-name', FIELD_ENTER_MSG);
    ok = false;
  } else if (stana.length < 5 || stana.length > 60) {
    setFieldError('setup-stana-name', STANA_LEN_MSG);
    ok = false;
  }
  // Google / map location is optional.
  if (!ok) return;
  const loc = setupPlace.isConfirmed() ? setupPlace.coords() || {} : {};
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  const res = await fetch(`/api/shakhe/${encodeURIComponent(linkedShakhe.id)}/setup`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      confirmPhone,
      stanaName: stana,
      location:
        Number.isFinite(lat) && Number.isFinite(lng)
          ? { lat, lng }
          : { lat: null, lng: null },
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
  bindDigitField(document.getElementById(id), 4, COUNT_MAX);
  document.getElementById(id).addEventListener('input', () => {
    setFieldError(id, '');
    refreshTotal();
    refreshDailySubmit();
  });
});
['samparka-manegalu', 'samparka-vyaktigalu'].forEach((id) => {
  bindDigitField(document.getElementById(id), 4, COUNT_MAX);
});
bindDigitField(document.getElementById('lookup-phone'), 10);

document.getElementById('upasthiti-step-next').addEventListener('click', () => {
  if (!validateUpasthitiCounts()) {
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
  if (!validateUpasthitiCounts()) {
    setDailyStep(1);
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
    if (res.ok && data.ok && VARADI_LEVELS.includes(data.level)) {
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
  } catch (_) { }

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
  } catch (_) { }

  showHome();
})();
