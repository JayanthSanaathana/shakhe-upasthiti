const mongoose = require('mongoose');
const { getLiveModel } = require('../lib/mongo');

const userRoleSchema = new mongoose.Schema(
  {
    user: String,
    sthara: { type: mongoose.Schema.Types.ObjectId, ref: 'Sthara' },
    entity: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity' },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  },
  { timestamps: true }
);

module.exports = getLiveModel('UserRole', userRoleSchema, 'userroles');
