const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

const Product = require('../models/productModel');

async function run() {
  await mongoose.connect(process.env.DATABASE);

  // 1. Update Urban Glide trench coat imageCover if pointing to old broken URL
  const oldCoatUrl = 'https://images.unsplash.com/photo-1539533018447-63fcce667883?auto=format&fit=crop&w=1000&q=80';
  const newCoatUrl = 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=80';
  const coatRes = await Product.updateMany(
    { imageCover: oldCoatUrl },
    { $set: { imageCover: newCoatUrl } }
  );
  console.log(`Updated ${coatRes.modifiedCount} coat cover images.`);

  // 2. Update RevitaGlow gallery thumbnail if pointing to old broken URL
  const oldRevitaUrl = 'https://images.unsplash.com/photo-1608248597359-57e0586e680a?auto=format&fit=crop&w=800&q=80';
  const newRevitaUrl = 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=80';
  const revitaRes = await Product.updateMany(
    { images: oldRevitaUrl },
    { $set: { 'images.$': newRevitaUrl } }
  );
  console.log(`Updated ${revitaRes.modifiedCount} RevitaGlow gallery images.`);

  console.log('✅ Image URL update complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
