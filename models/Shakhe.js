const mongoose = require('mongoose');

const placedEntitySchema = new mongoose.Schema(
  {
    entity: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity', required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const TIMING = ['prabhat', 'sayam', 'ratri'];
const SHAKHE_TYPE = ['balaka', 'Taruna-Vidyarthi', 'Taruna-Udyogi', 'Samyuktha'];

const shakheSchema = new mongoose.Schema({
  vibhag: { type: placedEntitySchema, required: true },
  bhag: { type: placedEntitySchema, required: true },
  nagar: { type: placedEntitySchema, required: true },
  vasati: { type: placedEntitySchema, required: true },
  upavasati: { type: placedEntitySchema, required: true },
  name: { type: String, required: true, trim: true, maxlength: 40 },
  timing: { type: String, required: true, enum: TIMING },
  time: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  shakheType: { type: String, required: true, enum: SHAKHE_TYPE },
  mukhashikshakPhone: { type: String, required: true, trim: true, minlength: 10, maxlength: 15 },
  mukhashikshakName: { type: String, trim: true, default: null, maxlength: 80 },
  karyavahaPhone: { type: String, trim: true, default: null, maxlength: 15 },
  karyavahaName: { type: String, trim: true, default: null, maxlength: 80 },
  shakhaPalakaPhone: { type: String, trim: true, default: null, maxlength: 15 },
  shakhaPalakaName: { type: String, trim: true, default: null, maxlength: 80 },
  stanaName: { type: String, trim: true, default: null, minlength: 5, maxlength: 15 },
  location: {
    lat: { type: Number, default: null, min: -90, max: 90 },
    lng: { type: Number, default: null, min: -180, max: 180 },
  },
  setupComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  createdIp: { type: String, default: null, maxlength: 64 },
  updatedAt: { type: Date, default: Date.now },
  updatedIp: { type: String, default: null, maxlength: 64 },
});

shakheSchema.index({ mukhashikshakPhone: 1 });
shakheSchema.index({ 'nagar.entity': 1 });
shakheSchema.index({ 'vasati.entity': 1 });
shakheSchema.index({ 'upavasati.entity': 1 });

module.exports = mongoose.model('Shakhe', shakheSchema, 'shakhes');
module.exports.TIMING = TIMING;
module.exports.SHAKHE_TYPE = SHAKHE_TYPE;
