// Shared GST bill maths — identical logic to the front-end computeBill().
// Prices are GST-exclusive; discount is applied proportionally across lines
// so each GST rate's taxable value stays correct, then tax splits CGST/SGST.
function computeBill(items, disc) {
  const sub = items.reduce((t, i) => t + i.qty * i.price, 0);
  let discount = 0;
  if (disc && disc.val > 0) {
    discount = disc.type === 'pct'
      ? (sub * Math.min(Math.max(disc.val, 0), 100)) / 100
      : Math.min(Math.max(disc.val, 0), sub);
  }
  discount = Math.round(discount * 100) / 100;

  let taxable = 0;
  let tax = 0;
  const byRate = {};
  items.forEach(i => {
    const line = i.qty * i.price;
    const lineTaxable = sub ? line - (line / sub) * discount : 0;
    const lineTax = (lineTaxable * i.gst) / 100;
    taxable += lineTaxable;
    tax += lineTax;
    if (!byRate[i.gst]) byRate[i.gst] = { rate: i.gst, taxable: 0, tax: 0 };
    byRate[i.gst].taxable += lineTaxable;
    byRate[i.gst].tax += lineTax;
  });

  const raw = taxable + tax;
  const total = Math.round(raw);
  return {
    subTotal: Math.round(sub * 100) / 100,
    discount,
    taxable: Math.round(taxable * 100) / 100,
    cgst: Math.round((tax / 2) * 100) / 100,
    sgst: Math.round((tax / 2) * 100) / 100,
    roundOff: Math.round((total - raw) * 100) / 100,
    total,
    byRate: Object.values(byRate).sort((a, b) => a.rate - b.rate)
  };
}

module.exports = { computeBill };
