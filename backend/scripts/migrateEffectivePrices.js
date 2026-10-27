const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

const Product = require('../models/productModel');

async function run() {
  await mongoose.connect(process.env.DATABASE);
  const products = await Product.find({});
  for (const p of products) {
    let eff = p.price;
    if (p.priceDiscount > 0) {
      eff = p.priceDiscount;
    } else if (p.dealDiscountPercentage > 0 && p.price > 0) {
      eff = Math.round(p.price * (1 - p.dealDiscountPercentage / 100));
    }
    await Product.updateOne({ _id: p._id }, { $set: { effectivePrice: eff } });
    console.log(`✓ ${p.name}: price=${p.price}, effectivePrice=${eff}`);
  }
  console.log('✅ All products successfully migrated with effectivePrice!');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
