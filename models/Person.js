const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  name: String,
  phone: String,
  responsibility: { type: String, default: null },
  shakhe: { type: String, default: null },
  nagarName: { type: String, default: null },
});

module.exports = mongoose.model('Person', personSchema, 'people');
