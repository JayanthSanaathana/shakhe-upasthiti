function phoneDigits(value) {
  return String(value == null ? '' : value).replace(/\D/g, '');
}

// Volunteer writes prove knowledge of the Pramukh phone (min 6 digits).
function phoneConfirmed(storedPhone, confirmPhone, { minDigits = 6 } = {}) {
  const stored = phoneDigits(storedPhone);
  const given = phoneDigits(confirmPhone);
  if (given.length < minDigits || stored.length < minDigits) return false;
  return stored.includes(given) || given.includes(stored);
}

module.exports = { phoneDigits, phoneConfirmed };
