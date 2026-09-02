const BOUDHIK = [
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

const SHARIRIK = [
  { id: 'suryanamaskar', kn: 'ಸೂರ್ಯನಮಸ್ಕಾರ', en: 'Suryanamaskar' },
  { id: 'samata', kn: 'ಸಮತಾ', en: 'Samata' },
  { id: 'sanchalana', kn: 'ಸಂಚಲನ', en: 'Sanchalana' },
  { id: 'danda', kn: 'ದಂಡ', en: 'Danda' },
  { id: 'niyuddha', kn: 'ನಿಯುದ್ಧ', en: 'Niyuddha' },
  { id: 'yeshti', kn: 'ಯಷ್ಟಿ', en: 'Yeshti' },
  { id: 'dandaYuddha', kn: 'ದಂಡ ಯುದ್ಧ', en: 'Danda yuddha' },
  { id: 'padavinyas', kn: 'ಪಾದವಿನ್ಯಾಸ', en: 'Padavinyas' },
  { id: 'itara', kn: 'ಇತರೆ', en: 'Itara' },
];

function idsOf(list) {
  return new Set(list.map((item) => item.id));
}

function pickItems(raw, allowed) {
  if (!Array.isArray(raw)) return [];
  const set = idsOf(allowed);
  const out = [];
  for (const value of raw) {
    const id = String(value || '').trim();
    if (set.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

module.exports = { BOUDHIK, SHARIRIK, pickItems };
