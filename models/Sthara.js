const mongoose = require('mongoose');
const { getLiveModel } = require('../lib/mongo');

const stharaSchema = new mongoose.Schema({ name: String }, { timestamps: true });

module.exports = getLiveModel('Sthara', stharaSchema, 'stharas');
