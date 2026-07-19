const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '' },
    gstin: { type: String, default: '', uppercase: true },
    balance: { type: Number, default: 0 },
    walkin: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
