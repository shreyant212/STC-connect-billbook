const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    gstin: { type: String, default: '', uppercase: true },
    balance: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
