const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    hsn: { type: String, default: '' },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    gst: { type: Number, enum: [0, 5, 12, 18, 28], default: 18 },
    stock: {
      showroom: { type: Number, default: 0, min: 0 },
      godown: { type: Number, default: 0, min: 0 }
    },
    minStock: { type: Number, default: 5 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productSchema.virtual('totalStock').get(function () {
  return this.stock.showroom + this.stock.godown;
});

module.exports = mongoose.model('Product', productSchema);
