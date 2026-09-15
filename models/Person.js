const mongoose = require('mongoose');
const { getPersonModel } = require('../lib/mongo');

const personSchema = new mongoose.Schema({
  name: String,
  phone: String,
  responsibility: { type: String, default: null },
  otherResponsibility: { type: String, default: null },
  shakhe: { type: String, default: null },
  nagarName: { type: String, default: null },
});

module.exports = getPersonModel('Person', personSchema, 'people');
