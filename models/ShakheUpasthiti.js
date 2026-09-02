const mongoose = require('mongoose');

const shakheUpasthitiSchema = new mongoose.Schema({
  shakhe: { type: mongoose.Schema.Types.ObjectId, ref: 'Shakhe', required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  taruna: { type: Number, required: true, min: 0, max: 99999 },
  balaka: { type: Number, required: true, min: 0, max: 99999 },
  shishu: { type: Number, required: true, min: 0, max: 99999 },
  mataBhagi: { type: Number, required: true, min: 0, max: 99999 },
  pravasiPhone: { type: String, trim: true, default: null, maxlength: 15 },
  pravasiName: { type: String, trim: true, default: null, maxlength: 80 },
  pravasiPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null },
  samparkitaManegalu: { type: Number, required: true, min: 0, max: 99999 },
  samparkitaVyaktigalu: { type: Number, required: true, min: 0, max: 99999 },
  boudhik: { type: [String], default: [] },
  sannaKatheText: { type: String, trim: true, default: null, maxlength: 200 },
  deerghaKatheText: { type: String, trim: true, default: null, maxlength: 200 },
  boudhikPerson: {
    personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null },
    name: { type: String, trim: true, default: null, maxlength: 80 },
    phone: { type: String, trim: true, default: null, maxlength: 15 },
  },
  charchePerson: {
    personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null },
    name: { type: String, trim: true, default: null, maxlength: 80 },
    phone: { type: String, trim: true, default: null, maxlength: 15 },
  },
  boudhikItara: { type: String, trim: true, default: null, maxlength: 80 },
  sharirik: { type: [String], default: [] },
  sharirikItara: { type: String, trim: true, default: null, maxlength: 80 },
  seva: { type: String, trim: true, default: null, maxlength: 200 },
  createdAt: { type: Date, default: Date.now },
  createdIp: { type: String, default: null, maxlength: 64 },
  updatedAt: { type: Date, default: Date.now },
  updatedIp: { type: String, default: null, maxlength: 64 },
});

shakheUpasthitiSchema.index({ shakhe: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ShakheUpasthiti', shakheUpasthitiSchema, 'shakheupasthitis');
