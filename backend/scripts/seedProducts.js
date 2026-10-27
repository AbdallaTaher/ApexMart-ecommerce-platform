const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const slugify = require('slugify');

// Load environment variables
const envPath = path.join(__dirname, '..', 'config.env');
dotenv.config({ path: envPath });

const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');

const dbUri = process.env.DATABASE;

if (!dbUri) {
  console.error('❌ Error: DATABASE environment variable is not defined in backend/config.env');
  process.exit(1);
}

// Categories Data
const categoriesData = [
  {
    name: 'Electronics',
    description: 'High-performance laptops, smartphones, noise-canceling headphones, and smart home tech.',
    icon: 'laptop',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80',
    displayOrder: 1,
  },
  {
    name: 'Fashion & Apparel',
    description: 'Trending designer collections, urban streetwear, luxury footwear, and seasonal wardrobe essentials.',
    icon: 'shirt',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
    displayOrder: 2,
  },
  {
    name: 'Home & Kitchen',
    description: 'Modern cookware, aesthetic living room furniture, smart appliances, and culinary essentials.',
    icon: 'home',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    displayOrder: 3,
  },
  {
    name: 'Beauty & Personal Care',
    description: 'Dermatologist-formulated skincare, premium organic cosmetics, hair care, and signature fragrances.',
    icon: 'sparkles',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
    displayOrder: 4,
  },
  {
    name: 'Sports & Outdoors',
    description: 'Pro athletic gear, ergonomic gym weights, outdoor camping tents, and endurance accessories.',
    icon: 'activity',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    displayOrder: 5,
  },
  {
    name: 'Books & Media',
    description: 'International bestsellers, hardcovers, computer science manuals, and immersive audiobooks.',
    icon: 'book',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    displayOrder: 6,
  },
];

// Seed generator function
const seedCatalog = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ Connected to MongoDB.');

    const isDelete = process.argv.includes('--delete');
    const isImport = process.argv.includes('--import') || !isDelete;

    if (isDelete) {
      console.log('🗑️  Deleting existing products and categories...');
      await Product.deleteMany({});
      await Category.deleteMany({});
      console.log('✅ Cleared all products and categories.');
      if (!process.argv.includes('--import')) {
        process.exit(0);
      }
    }

    if (isImport) {
      console.log('👤 Finding or creating authorized seller account for catalog seeding...');
      let seller = await User.findOne({ role: { $in: ['seller', 'admin'] } });

      if (!seller) {
        seller = await User.create({
          name: 'ApexMart Official Store',
          email: 'seller@apexmart.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
          role: 'seller',
          photo: 'default-user.jpg',
        });
        console.log(`✅ Created default verified seller: ${seller.email}`);
      } else {
        console.log(`ℹ️  Using existing seller/admin: ${seller.email} (${seller._id})`);
      }

      console.log('📁 Upserting categories...');
      const categoryMap = {};

      for (const cat of categoriesData) {
        const slug = slugify(cat.name, { lower: true, strict: true });
        const existingCat = await Category.findOneAndUpdate(
          { slug },
          { ...cat, slug },
          { upsert: true, new: true, runValidators: true }
        );
        categoryMap[cat.name] = existingCat._id;
        console.log(`  ✓ Category: ${existingCat.name} (${existingCat.slug})`);
      }

      // Products Data
      const productsData = [
        // --- ELECTRONICS ---
        {
          name: 'Apex Pro 16" M3 Max Ultra Laptop',
          description:
            'Engineered for ultimate computing velocity. Features 16-core CPU, 40-core GPU, Liquid Retina XDR display with ProMotion 120Hz, and all-day 22-hour battery endurance.',
          price: 2499,
          priceDiscount: 2299,
          category: categoryMap['Electronics'],
          brand: 'ApexTech',
          seller: seller._id,
          imageCover: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
          images: [
            'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 35,
          ratingsAverage: 4.9,
          ratingsQuantity: 418,
          isFeatured: true,
          isDeal: true,
          dealDiscountPercentage: 8,
          badge: 'Best Seller',
          specifications: [
            { key: 'Processor', value: '16-Core M3 Max' },
            { key: 'Memory', value: '36GB Unified RAM' },
            { key: 'Storage', value: '1TB NVMe Gen4 SSD' },
            { key: 'Display', value: '16.2-inch Liquid Retina XDR' },
          ],
        },
        {
          name: 'SonicWave Wireless Noise-Canceling Headphones',
          description:
            'Industry-leading active noise cancellation with 40mm beryllium drivers, spatial audio tracking, ultra-soft memory foam earcups, and up to 45 hours playtime.',
          price: 349,
          priceDiscount: 279,
          category: categoryMap['Electronics'],
          brand: 'AcoustiQ',
          seller: seller._id,
          imageCover: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
          images: [
            'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 82,
          ratingsAverage: 4.8,
          ratingsQuantity: 1250,
          isFeatured: true,
          isDeal: true,
          dealDiscountPercentage: 20,
          badge: "Amazon's Choice",
          specifications: [
            { key: 'Driver Size', value: '40mm High-Resolution' },
            { key: 'Battery Life', value: '45 Hours ANC off / 35 ANC on' },
            { key: 'Connectivity', value: 'Bluetooth 5.3 + 3.5mm Aux' },
            { key: 'Weight', value: '254 grams' },
          ],
        },
        {
          name: 'Lumix Pulse OLED 65" 4K Gaming Smart TV',
          description:
            'Self-lit OLED pixels deliver pure black and infinity contrast. 144Hz refresh rate, HDMI 2.1, VRR, AMD FreeSync Premium, and Dolby Atmos audio theater.',
          price: 1799,
          priceDiscount: 1499,
          category: categoryMap['Electronics'],
          brand: 'Lumix',
          seller: seller._id,
          imageCover: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1000&q=80',
          images: [
            'https://images.unsplash.com/photo-1577979749830-f1d742b96791?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 18,
          ratingsAverage: 4.7,
          ratingsQuantity: 310,
          isFeatured: false,
          isDeal: true,
          dealDiscountPercentage: 16,
          badge: 'Limited Deal',
          specifications: [
            { key: 'Resolution', value: '4K Ultra HD (3840 x 2160)' },
            { key: 'Refresh Rate', value: '144Hz Native' },
            { key: 'HDR Support', value: 'Dolby Vision IQ, HDR10+, HLG' },
          ],
        },
        {
          name: 'Titan Smartwatch Pro with GPS & ECG Monitor',
          description:
            'Grade 5 titanium case with sapphire crystal glass. Dual-frequency precision GPS, comprehensive sleep stages tracking, continuous blood oxygen & ECG sensor.',
          price: 499,
          priceDiscount: 0,
          category: categoryMap['Electronics'],
          brand: 'ApexTech',
          seller: seller._id,
          imageCover: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
          images: [
            'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 64,
          ratingsAverage: 4.6,
          ratingsQuantity: 842,
          isFeatured: true,
          isDeal: false,
          dealDiscountPercentage: 0,
          badge: 'New Arrival',
          specifications: [
            { key: 'Water Resistance', value: '100m (10 ATM)' },
            { key: 'Case Material', value: 'Titanium Grade 5' },
            { key: 'Battery', value: 'Up to 7 days normal use' },
          ],
        },

        // --- FASHION & APPAREL ---
        {
          name: 'Urban Glide Waterproof Merino Trench Coat',
          description:
            'Minimalist Scandinavian silhouette tailored with weather-resistant recycled wool-blend, windproof taped seams, and hidden thermal magnetic closures.',
          price: 289,
          priceDiscount: 219,
          category: categoryMap['Fashion & Apparel'],
          brand: 'NordicThread',
          seller: seller._id,
          imageCover: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=80',
          images: [
            'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 45,
          ratingsAverage: 4.8,
          ratingsQuantity: 185,
          isFeatured: true,
          isDeal: true,
          dealDiscountPercentage: 24,
          badge: 'Best Seller',
          specifications: [
            { key: 'Material', value: '80% Merino Wool, 20% Poly Recycled' },
            { key: 'Fit', value: 'Tailored Regular' },
            { key: 'Care', value: 'Dry Clean Only' },
          ],
        },
        {
          name: 'AeroCloud Zero-Gravity Running Sneakers',
          description:
            'Supercritical nitrogen-infused foam midsole delivers responsive 85% energy return. Seamless engineered breathable mesh upper for marathon performance.',
          price: 160,
          priceDiscount: 128,
          category: categoryMap['Fashion & Apparel'],
          brand: 'Stratus',
          seller: seller._id,
          imageCover: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
          images: [
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 90,
          ratingsAverage: 4.7,
          ratingsQuantity: 940,
          isFeatured: false,
          isDeal: true,
          dealDiscountPercentage: 20,
          badge: "Amazon's Choice",
          specifications: [
            { key: 'Drop', value: '8mm' },
            { key: 'Weight', value: '215g (Size 9)' },
            { key: 'Sole', value: 'High-traction Vibram rubber' },
          ],
        },
        {
          name: 'Artisan Vegetable-Tanned Italian Leather Weekender Bag',
          description:
            'Handcrafted in Tuscany using full-grain Tuscan cowhide leather. Antique brass hardware, reinforced leather handles, and separate ventilated shoe compartment.',
          price: 420,
          priceDiscount: 0,
          category: categoryMap['Fashion & Apparel'],
          brand: 'Bellagio Craft',
          seller: seller._id,
          imageCover: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
          images: [
            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 22,
          ratingsAverage: 4.9,
          ratingsQuantity: 73,
          isFeatured: true,
          isDeal: false,
          dealDiscountPercentage: 0,
          badge: 'Limited Deal',
          specifications: [
            { key: 'Dimensions', value: '55 x 30 x 28 cm (Cabin approved)' },
            { key: 'Volume', value: '45 Liters' },
            { key: 'Leather', value: 'Full Grain Vegetable-Tanned' },
          ],
        },

        // --- HOME & KITCHEN ---
        {
          name: 'Precision Barista Touch Dual-Boiler Espresso Machine',
          description:
            'Commercial 58mm portafilter, PID temperature control, automatic microfoam milk steaming, and intuitive touch display for cafe-quality espresso at home.',
          price: 899,
          priceDiscount: 749,
          category: categoryMap['Home & Kitchen'],
          brand: 'CremaCraft',
          seller: seller._id,
          imageCover: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=1000&q=80',
          images: [
            'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 28,
          ratingsAverage: 4.8,
          ratingsQuantity: 520,
          isFeatured: true,
          isDeal: true,
          dealDiscountPercentage: 16,
          badge: 'Best Seller',
          specifications: [
            { key: 'Pump Pressure', value: '15 Bar Italian Pump' },
            { key: 'Water Tank', value: '2.5 Liters' },
            { key: 'Heating System', value: 'Dual Thermoblock' },
          ],
        },
        {
          name: 'Nordic Cast Iron Dutch Oven (6.5 Quart)',
          description:
            'Heavy-gauge enameled cast iron delivers superior heat distribution and retention. Tight-fitting lid with moisture bumps locks in juices for braising and baking sourdough.',
          price: 149,
          priceDiscount: 119,
          category: categoryMap['Home & Kitchen'],
          brand: 'HyggeKitchen',
          seller: seller._id,
          imageCover: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=1000&q=80',
          images: [
            'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 60,
          ratingsAverage: 4.9,
          ratingsQuantity: 1102,
          isFeatured: false,
          isDeal: true,
          dealDiscountPercentage: 20,
          badge: "Amazon's Choice",
          specifications: [
            { key: 'Capacity', value: '6.5 Quart (6.1 L)' },
            { key: 'Heat Resistance', value: 'Oven safe up to 500°F (260°C)' },
            { key: 'Compatibility', value: 'Gas, Electric, Induction, Ceramic' },
          ],
        },

        // --- BEAUTY & PERSONAL CARE ---
        {
          name: 'RevitaGlow Botanical Retinol & Peptide Night Elixir',
          description:
            'Clinically backed rejuvenating serum with 1% encapsulated retinol, multi-weight hyaluronic acid, and botanical squalane to reduce fine lines and restore radiance.',
          price: 78,
          priceDiscount: 58,
          category: categoryMap['Beauty & Personal Care'],
          brand: 'AuraLab',
          seller: seller._id,
          imageCover: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80',
          images: [
            'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 140,
          ratingsAverage: 4.7,
          ratingsQuantity: 630,
          isFeatured: true,
          isDeal: true,
          dealDiscountPercentage: 25,
          badge: 'Limited Deal',
          specifications: [
            { key: 'Volume', value: '50 ml / 1.7 fl oz' },
            { key: 'Skin Type', value: 'All skin types including sensitive' },
            { key: 'Origin', value: 'Formulated in France' },
          ],
        },

        // --- SPORTS & OUTDOORS ---
        {
          name: 'ApexTrail Ultralight 2-Person Backpacking Tent',
          description:
            'Ripstop silnylon fabric with 3000mm hydrostatic head waterproof rating. Weighs just 2.4 lbs with DAC Featherlite aluminum poles and dual vestibules.',
          price: 329,
          priceDiscount: 269,
          category: categoryMap['Sports & Outdoors'],
          brand: 'ApexPeak',
          seller: seller._id,
          imageCover: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=80',
          images: [
            'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 40,
          ratingsAverage: 4.8,
          ratingsQuantity: 340,
          isFeatured: false,
          isDeal: true,
          dealDiscountPercentage: 18,
          badge: "Amazon's Choice",
          specifications: [
            { key: 'Trail Weight', value: '1.1 kg (2.4 lbs)' },
            { key: 'Capacity', value: '2 Persons + Gear' },
            { key: 'Seasons', value: '3-Season' },
          ],
        },
        {
          name: 'Kratos Heavy-Duty Adjustable Cast Iron Dumbbells (50 lbs pair)',
          description:
            'Rapid twist-lock selector plates from 5 lbs up to 50 lbs per dumbbell. Textured knurled steel grip and compact anti-roll storage trays.',
          price: 399,
          priceDiscount: 0,
          category: categoryMap['Sports & Outdoors'],
          brand: 'KratosFit',
          seller: seller._id,
          imageCover: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80',
          images: [
            'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 55,
          ratingsAverage: 4.9,
          ratingsQuantity: 880,
          isFeatured: true,
          isDeal: false,
          dealDiscountPercentage: 0,
          badge: 'Best Seller',
          specifications: [
            { key: 'Weight Range', value: '5 - 50 lbs per unit' },
            { key: 'Increments', value: '5 lbs increments' },
            { key: 'Mechanism', value: 'Hardened steel selector' },
          ],
        },

        // --- BOOKS & MEDIA ---
        {
          name: 'Designing Data-Intensive Applications (Hardcover Collector Edition)',
          description:
            'The definitive guide to distributed databases, consensus protocols, stream processing, reliability, and modern software architectures by Martin Kleppmann.',
          price: 59,
          priceDiscount: 45,
          category: categoryMap['Books & Media'],
          brand: "O'Reilly Media",
          seller: seller._id,
          imageCover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80',
          images: [
            'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 120,
          ratingsAverage: 5.0,
          ratingsQuantity: 2840,
          isFeatured: true,
          isDeal: true,
          dealDiscountPercentage: 23,
          badge: 'Best Seller',
          specifications: [
            { key: 'Format', value: 'Hardcover, Smyth-sewn binding' },
            { key: 'Pages', value: '616 pages' },
            { key: 'Language', value: 'English' },
          ],
        },
      ];

      console.log(`📦 Seeding ${productsData.length} realistic products...`);
      for (const prod of productsData) {
        const slug = slugify(prod.name, { lower: true, strict: true });
        await Product.findOneAndUpdate(
          { slug },
          { ...prod, slug },
          { upsert: true, new: true, runValidators: true }
        );
        console.log(`  ✓ Product: "${prod.name}" [$${prod.price}${prod.priceDiscount ? ` -> $${prod.priceDiscount}` : ''}]`);
      }

      console.log('\n========================================');
      console.log('🎉 CATALOG SEEDING COMPLETED SUCCESSFULLY!');
      console.log('========================================');
      console.log(`• Categories: ${categoriesData.length}`);
      console.log(`• Products:   ${productsData.length}`);
      console.log(`• Seller:     ${seller.email}`);
      console.log('========================================\n');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding catalog:', err);
    process.exit(1);
  }
};

seedCatalog();
