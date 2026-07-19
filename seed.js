/*
  One-time seeder: creates demo users, products, customers and suppliers.
  Run with:  npm run seed
  Safe to re-run — it wipes and recreates these four collections only.
*/
require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');

const products = [
  ['FAN-CL-1200', 'AeroBreeze Ceiling Fan 1200mm', 'Ceiling Fan', '8414', 1150, 1599, 22, 40, 8],
  ['FAN-CL-DECO', 'AeroBreeze Deco Ceiling Fan 1200mm', 'Ceiling Fan', '8414', 1480, 2099, 12, 18, 6],
  ['FAN-CL-BLDC', 'EcoSpin BLDC Ceiling Fan 1200mm (Remote)', 'Ceiling Fan', '8414', 2350, 3299, 8, 10, 5],
  ['FAN-TB-400', 'BreezeMate Table Fan 400mm', 'Table Fan', '8414', 920, 1349, 14, 12, 6],
  ['FAN-PD-450', 'TowerAir Pedestal Fan 450mm', 'Pedestal Fan', '8414', 1680, 2349, 9, 10, 5],
  ['FAN-WL-400', 'WallJet Wall Fan 400mm', 'Wall Fan', '8414', 1120, 1599, 7, 8, 4],
  ['FAN-EX-250', 'VentPro Exhaust Fan 250mm', 'Exhaust Fan', '8414', 640, 949, 16, 20, 6],
  ['CLR-DS-85', 'HimShakti Desert Cooler 85L', 'Air Cooler', '8479', 6250, 8499, 5, 6, 3],
  ['CLR-PR-40', 'ChillMate Personal Cooler 40L', 'Air Cooler', '8479', 3950, 5399, 6, 8, 3],
  ['CLR-PMP-18', 'Cooler Pump 18W (Submersible)', 'Spares', '8413', 240, 399, 11, 24, 8],
  ['CLR-PAD-HC', 'Honeycomb Cooling Pad Set', 'Spares', '8479', 310, 499, 4, 15, 6],
  ['MXG-750-3J', 'RasoiKing Mixer Grinder 750W (3 Jar)', 'Mixer Grinder', '8509', 2380, 3299, 10, 12, 5],
  ['MXG-500-3J', 'RasoiKing Mixer Grinder 500W (3 Jar)', 'Mixer Grinder', '8509', 1720, 2449, 13, 14, 5],
  ['JMG-500-2J', 'FruitPress Juicer Mixer 500W', 'Mixer Grinder', '8509', 2610, 3599, 6, 6, 3],
  ['IND-1800', 'HeatWave Induction Cooktop 1800W', 'Kitchen Appliance', '8516', 1760, 2499, 8, 9, 4],
  ['KTL-15L', 'QuickBoil Electric Kettle 1.5L', 'Kitchen Appliance', '8516', 615, 899, 12, 15, 6],
  ['IRN-DRY-1K', 'PressRight Dry Iron 1000W', 'Home Appliance', '8516', 470, 699, 3, 10, 6],
  ['ROD-1500', 'Immersion Water Heater Rod 1500W', 'Home Appliance', '8516', 315, 499, 2, 0, 6]
];

async function run() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}), Product.deleteMany({}),
    Customer.deleteMany({}), Supplier.deleteMany({})
  ]);

  // User.create triggers the bcrypt pre-save hook
  await User.create([
    { name: 'Sanjay Chaudhari', username: 'admin', password: 'admin123', role: 'admin' },
    { name: 'Rohit Pawar', username: 'manager', password: 'manager123', role: 'manager' },
    { name: 'Neha Kulkarni', username: 'cashier', password: 'cashier123', role: 'cashier' }
  ]);

  await Product.insertMany(products.map(p => ({
    sku: p[0], name: p[1], category: p[2], hsn: p[3],
    purchasePrice: p[4], sellingPrice: p[5],
    gst: 18, stock: { showroom: p[6], godown: p[7] }, minStock: p[8]
  })));

  await Customer.insertMany([
    { name: 'Walk-in Customer', walkin: true },
    { name: 'Prakash Jadhav', phone: '9822012345', address: 'Nigdi, Pune' },
    { name: 'Sunita More', phone: '9890054321', address: 'Chinchwad, Pune' },
    { name: 'Hotel Annapurna (Kitchen)', phone: '9765011122', address: 'Pimpri, Pune', gstin: '27AAHCA9999A1Z2' },
    { name: 'Deepak Electricals (Resale)', phone: '9922033445', address: 'Bhosari MIDC', gstin: '27AABCD8888B1Z7' },
    { name: 'Kavita Shinde', phone: '9850067890', address: 'Akurdi, Pune' }
  ]);

  await Supplier.insertMany([
    { name: 'Deccan Electricals Distributors', phone: '020-27455000', gstin: '27AACCD1111C1Z9', address: 'Bhosari MIDC, Pune' },
    { name: 'AirFlow Cooling Components', phone: '020-66004411', gstin: '27AAFCA2222D1Z3', address: 'Chakan, Pune' },
    { name: 'GharSansar Appliances C&F', phone: '022-40332211', gstin: '27AAGCG3333E1Z1', address: 'Bhiwandi, Thane' }
  ]);

  console.log('Seeded: 3 users, ' + products.length + ' products, 6 customers, 3 suppliers');
  console.log('Logins — admin/admin123, manager/manager123, cashier/cashier123');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
