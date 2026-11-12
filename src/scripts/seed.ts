import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'studiospace_db';

const sampleStudios = [
  {
    title: "Apex Infinite Cyc Wall & Photo Loft",
    category: "Photo Studio",
    hourlyRate: 85,
    securityDeposit: 150,
    maxCapacity: 15,
    location: "Downtown Arts District, Los Angeles, CA",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Corner Cyclorama Wall", "Profoto Strobes", "Hair & Makeup Vanity", "High-speed Wi-Fi", "Steamer & Wardrobe Rack", "Central AC"],
    overview: "A 2,500 sq ft natural light and black-out photography haven equipped with a pristine 20x20 ft two-wall white cyc. Perfect for fashion editorials, e-commerce lookbooks, and celebrity portraits.",
    ownerEmail: "host@studiospace.com",
    ownerName: "Elena Rostova",
    rating: 4.95,
    reviewCount: 38,
    createdAt: new Date(),
  },
  {
    title: "BlackBox Cinema Stage & Virtual Production",
    category: "Film Stage",
    hourlyRate: 160,
    securityDeposit: 300,
    maxCapacity: 35,
    location: "Silver Lake Production Center, Los Angeles, CA",
    imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Soundproofed Walls (STC 65)", "Drive-in Elephant Door", "Lighting Grid 18ft", "Green Screen Backdrop", "Client Lounge", "3-Phase 100A Power"],
    overview: "Fully sound-treated film stage custom built for commercial cinematography, music videos, and dialogue scenes. Includes a dedicated multi-camera control room and heavy duty grip packages.",
    ownerEmail: "host@studiospace.com",
    ownerName: "Marcus Vance",
    rating: 4.98,
    reviewCount: 44,
    createdAt: new Date(),
  },
  {
    title: "Velvet Acoustics Podcast & Broadcast Lounge",
    category: "Podcast Lounge",
    hourlyRate: 65,
    securityDeposit: 100,
    maxCapacity: 6,
    location: "Midtown Manhattan Media Hub, New York, NY",
    imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80",
    amenities: ["4x Shure SM7B Microphones", "Rodecaster Pro II Console", "4K Sony FX3 Camera Setup", "RGB Accent Tube Lighting", "Acoustic Slat Paneling", "Live Stream Fiber"],
    overview: "Broadcast-grade podcast studio designed for intimate video podcasts, executive interviews, and voiceover recordings. Turnkey workflow: bring your SD card or get instant cloud recording.",
    ownerEmail: "host@studiospace.com",
    ownerName: "Sarah Jenkins",
    rating: 4.92,
    reviewCount: 52,
    createdAt: new Date(),
  },
  {
    title: "Resonance SSL Analog Recording & Dolby Atmos Suite",
    category: "Music Suite",
    hourlyRate: 110,
    securityDeposit: 250,
    maxCapacity: 8,
    location: "Music Row, Nashville, TN",
    imageUrl: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Solid State Logic (SSL) Desk", "Genelec 7.1.4 Atmos Monitoring", "Vintage Neumann U87", "Yamaha C7 Grand Piano", "Isolation Vocal Booth", "Analog Outboard Gear"],
    overview: "Mastering-grade live room and control suite engineered for recording bands, tracking lead vocals, and mixing immersive audio in Dolby Atmos. World-class acoustic design.",
    ownerEmail: "host@studiospace.com",
    ownerName: "Julian Thorne",
    rating: 5.0,
    reviewCount: 61,
    createdAt: new Date(),
  },
  {
    title: "The Industrial Foundry Art & Sculpting Workshop",
    category: "Art Workshop",
    hourlyRate: 55,
    securityDeposit: 90,
    maxCapacity: 20,
    location: "Fulton Market District, Chicago, IL",
    imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Pottery Wheels & Kiln", "Heavy Duty Workbench", "Ventilated Spray Booth", "Natural Skylight Exposure", "Tool Chests", "Concrete Wash Basin"],
    overview: "Spacious sun-drenched industrial creative workshop for ceramicists, sculptors, painters, and printmakers. Generous table space, wet sinks, and ceiling power drops.",
    ownerEmail: "host@studiospace.com",
    ownerName: "Amara Patel",
    rating: 4.88,
    reviewCount: 29,
    createdAt: new Date(),
  },
  {
    title: "Neon Horizon Cyberpunk Multi-Set Production Bay",
    category: "Film Stage",
    hourlyRate: 135,
    securityDeposit: 200,
    maxCapacity: 25,
    location: "Williamsburg, Brooklyn, NY",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Modular LED Neon Walls", "DMX Lighting Console", "Hazer / Fog Systems", "Dressing Rooms", "Rolling Wardrobe Racks", "High-amp Sound System"],
    overview: "Immersive multi-scene set equipped with customizable programmable LED architecture, retro futuristic practical props, and heavy-duty rigging. Perfect for music videos and visionary creative shoots.",
    ownerEmail: "host@studiospace.com",
    ownerName: "Leo Sterling",
    rating: 4.96,
    reviewCount: 33,
    createdAt: new Date(),
  },
];

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    console.log(`Connected to ${dbName} for seeding...`);

    // 1. Seed demo host user
    const usersCol = db.collection('users');
    const existingHost = await usersCol.findOne({ email: 'host@studiospace.com' });
    if (!existingHost) {
      const hashedPassword = await bcrypt.hash('Studio123', 10);
      await usersCol.insertOne({
        name: 'StudioSpace Host',
        email: 'host@studiospace.com',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        password: hashedPassword,
        createdAt: new Date(),
      });
      console.log('Seeded demo host user: host@studiospace.com / Studio123');
    }

    // 2. Seed demo studios
    const studiosCol = db.collection('studios');
    const count = await studiosCol.countDocuments();
    if (count === 0) {
      await studiosCol.insertMany(sampleStudios);
      console.log(`Seeded ${sampleStudios.length} creative studios successfully!`);
    } else {
      console.log(`Studios collection already has ${count} records.`);
    }

    console.log('Seeding completed! 🚀');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await client.close();
  }
}

seed();
