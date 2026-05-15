/**
 * ─── MongoDB Connection Configuration ────────────────
 * Connects to MongoDB Atlas with robust error handling,
 * DNS fallback, retry logic, and diagnostic logging.
 */
const mongoose = require('mongoose');
const dns = require('dns');

// Force Google Public DNS (fixes ISP blocking MongoDB SRV lookups)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Force IPv4 DNS resolution (fixes ECONNREFUSED on many Windows setups)
dns.setDefaultResultOrder('ipv4first');

let retryCount = 0;
const MAX_RETRIES = 5;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  // ─── Validate URI before connecting ────────────────
  if (!uri) {
    console.error('❌ MONGO_URI is not defined in .env file!');
    console.error('   Please add: MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname');
    return;
  }

  if (uri.includes('<db_password>') || uri.includes('<password>')) {
    console.error('❌ MONGO_URI still contains a placeholder password!');
    console.error('   Open server/.env and replace <db_password> with your actual MongoDB Atlas password.');
    console.error('   Example: MONGO_URI=mongodb+srv://Vinay8867:MyRealPass123@cluster1.dywz3do.mongodb.net/medicare');
    return;
  }

  // Log masked URI for debugging
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
  console.log(`🔗 Connecting to MongoDB: ${maskedUri}`);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,   // Timeout after 10s instead of 30s
      socketTimeoutMS: 45000,            // Close sockets after 45s of inactivity
      family: 4,                         // Force IPv4 (fixes DNS issues on Windows)
      retryWrites: true,
      w: 'majority',
    });

    retryCount = 0; // Reset on success
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

  } catch (error) {
    retryCount++;
    console.error(`\n❌ MongoDB Connection Failed (Attempt ${retryCount}/${MAX_RETRIES})`);

    // ─── Detailed error diagnostics ──────────────────
    if (error.message.includes('querySrv ECONNREFUSED') || error.message.includes('querySrv ENOTFOUND')) {
      console.error('   🔍 Diagnosis: DNS SRV lookup failed');
      console.error('   Possible causes:');
      console.error('     1. Your internet connection is unstable');
      console.error('     2. Your ISP/network is blocking MongoDB DNS (SRV records)');
      console.error('     3. The cluster hostname is incorrect');
      console.error('   Fix: Try switching to mobile hotspot or a different network');
    } else if (error.message.includes('Authentication failed') || error.message.includes('auth')) {
      console.error('   🔍 Diagnosis: Authentication failed');
      console.error('   Possible causes:');
      console.error('     1. Wrong username or password in MONGO_URI');
      console.error('     2. Special characters in password not URL-encoded');
      console.error('     3. Database user does not exist');
      console.error('   Fix: Go to MongoDB Atlas → Database Access → verify credentials');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('connection refused')) {
      console.error('   🔍 Diagnosis: Connection refused by server');
      console.error('   Possible causes:');
      console.error('     1. Your IP is not whitelisted in Atlas');
      console.error('     2. Firewall/VPN blocking the connection');
      console.error('   Fix: Go to MongoDB Atlas → Network Access → Add 0.0.0.0/0');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timed out')) {
      console.error('   🔍 Diagnosis: Connection timed out');
      console.error('   Possible causes:');
      console.error('     1. Slow internet connection');
      console.error('     2. Atlas cluster is paused (free tier pauses after inactivity)');
      console.error('   Fix: Check Atlas dashboard, resume cluster if paused');
    } else {
      console.error(`   Error: ${error.message}`);
    }

    // Retry with backoff
    if (retryCount < MAX_RETRIES) {
      const delay = Math.min(5000 * retryCount, 30000);
      console.log(`   ⏳ Retrying in ${delay / 1000}s...\n`);
      setTimeout(connectDB, delay);
    } else {
      console.error('\n❌ Max retries reached. Could not connect to MongoDB.');
      console.error('   The server will continue running but database features will not work.');
      console.error('   Fix your MONGO_URI in .env and restart with: npm run dev\n');
    }
  }
};

// ─── Connection Events ──────────────────────────────
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connection established');
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ Mongoose error: ${err.message}`);
});

module.exports = connectDB;
