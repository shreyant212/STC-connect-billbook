const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: String,
    name: String,
    qty: { type: Number, required: true, min: 1 },
    cost: { type: Number, required: true, min: 0 },
    gst: { type: Number, default: 18 }
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    no: { type: String, required: true, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: { type: [purchaseItemSchema], validate: v => v.length > 0 },
    receiveInto: { type: String, enum: ['showroom', 'godown'], default: 'godown' },
    total: Number,
    paid: { type: Number, default: 0 },
    due: { type: Number, default: 0 },
    note: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
