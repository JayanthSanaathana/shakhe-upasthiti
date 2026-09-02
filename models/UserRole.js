const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema(
  {
    user: String,
    sthara: { type: mongoose.Schema.Types.ObjectId, ref: 'Sthara' },
    entity: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity' },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserRole', userRoleSchema, 'userroles');
