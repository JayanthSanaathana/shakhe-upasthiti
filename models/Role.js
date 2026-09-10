const mongoose = require('mongoose');
const { getLiveModel } = require('../lib/mongo');

const roleSchema = new mongoose.Schema(
  {
    name: String,
  },
  { timestamps: true }
);

module.exports = getLiveModel('Role', roleSchema, 'roles');
