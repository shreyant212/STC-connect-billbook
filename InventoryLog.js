const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['sale', 'purchase', 'in', 'out', 'transfer'], required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    qty: { type: Number, required: true },
    store: String,
    note: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
