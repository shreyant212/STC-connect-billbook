const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    no: { type: String, required: true, unique: true },
    type: { type: String, enum: ['in', 'out'], required: true },
    party: { type: String, enum: ['customer', 'supplier'], required: true },
    partyId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'partyModel' },
    partyModel: { type: String, enum: ['Customer', 'Supplier'], required: true },
    amount: { type: Number, required: true, min: 0 },
    mode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank'], default: 'Cash' },
    note: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
