const mongoose = require('mongoose');

const stharaSchema = new mongoose.Schema({ name: String }, { timestamps: true });

module.exports = mongoose.model('Sthara', stharaSchema, 'stharas');
