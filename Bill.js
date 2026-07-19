const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: String,
    name: String,
    hsn: String,
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, default: 0 },
    gst: { type: Number, default: 18 }
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    no: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: String,
    items: { type: [billItemSchema], validate: v => v.length > 0 },
    subTotal: Number,
    discount: { type: Number, default: 0 },
    taxable: Number,
    cgst: Number,
    sgst: Number,
    roundOff: { type: Number, default: 0 },
    total: Number,
    paid: { type: Number, default: 0 },
    due: { type: Number, default: 0 },
    mode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Credit'], default: 'Cash' },
    store: { type: String, enum: ['showroom', 'godown'], default: 'showroom' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bill', billSchema);
