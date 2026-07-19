const router = require('express').Router();
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'manager'));

function range(req) {
  const q = {};
  if (req.query.from || req.query.to) {
    q.createdAt = {};
    if (req.query.from) q.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) q.createdAt.$lte = new Date(req.query.to);
  }
  return q;
}

// GET /api/reports/summary?from=&to=
// Daily/monthly totals depending on the range you pass.
router.get('/summary', async (req, res) => {
  const bills = await Bill.find(range(req));
  const gross = bills.reduce((t, b) => t + b.total, 0);
  const taxable = bills.reduce((t, b) => t + b.taxable, 0);
  const cogs = bills.reduce((t, b) => t + b.items.reduce((s, i) => s + i.qty * (i.purchasePrice || 0), 0), 0);
  const tax = bills.reduce((t, b) => t + b.cgst + b.sgst, 0);
  const outstanding = (await Customer.aggregate([
    { $match: { balance: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$balance' } } }
  ]))[0];
  const lowStock = (await Product.find({ active: true })).filter(
    p => p.stock.showroom + p.stock.godown <= p.minStock
  );

  res.json({
    bills: bills.length,
    grossSales: gross,
    taxableValue: taxable,
    gstCollected: tax,
    cogs,
    grossProfit: taxable - cogs,
    discounts: bills.reduce((t, b) => t + b.discount, 0),
    itemsSold: bills.reduce((t, b) => t + b.items.reduce((s, i) => s + i.qty, 0), 0),
    outstanding: outstanding ? outstanding.total : 0,
    lowStock: lowStock.map(p => ({ id: p._id, name: p.name, sku: p.sku, left: p.stock.showroom + p.stock.godown }))
  });
});

// GET /api/reports/gst?from=&to= — taxable + CGST/SGST split by rate (GSTR-1 style)
router.get('/gst', async (req, res) => {
  const bills = await Bill.find(range(req));
  const map = {};
  bills.forEach(b => {
    const sub = b.items.reduce((t, i) => t + i.qty * i.price, 0);
    const factor = sub > 0 ? b.taxable / sub : 1;
    b.items.forEach(i => {
      const line = i.qty * i.price * factor;
      if (!map[i.gst]) map[i.gst] = { rate: i.gst, taxable: 0, cgst: 0, sgst: 0 };
      map[i.gst].taxable += line;
      map[i.gst].cgst += (line * i.gst) / 200;
      map[i.gst].sgst += (line * i.gst) / 200;
    });
  });
  res.json(Object.values(map).sort((a, b) => a.rate - b.rate));
});

// GET /api/reports/products?from=&to= — product-wise qty, revenue and profit
router.get('/products', async (req, res) => {
  const rows = await Bill.aggregate([
    { $match: range(req) },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        sku: { $first: '$items.sku' },
        qty: { $sum: '$items.qty' },
        revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
        cost: { $sum: { $multiply: ['$items.qty', { $ifNull: ['$items.purchasePrice', 0] }] } }
      }
    },
    { $addFields: { profit: { $subtract: ['$revenue', '$cost'] } } },
    { $sort: { revenue: -1 } }
  ]);
  res.json(rows);
});

// GET /api/reports/daily?from=&to= — one row per day
router.get('/daily', async (req, res) => {
  const rows = await Bill.aggregate([
    { $match: range(req) },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        bills: { $sum: 1 },
        sales: { $sum: '$total' },
        gst: { $sum: { $add: ['$cgst', '$sgst'] } }
      }
    },
    { $sort: { _id: -1 } }
  ]);
  res.json(rows);
});

module.exports = router;
