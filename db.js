const { Pool } = require("pg");
require("dotenv").config();

// Buat koneksi pool ke Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // wajib untuk Neon
  },
  max: 10, // jumlah koneksi maksimum (disarankan Neon)
  idleTimeoutMillis: 30000, // timeout koneksi idle 30 detik
  connectionTimeoutMillis: 5000, // timeout koneksi awal 5 detik
});

// Tes koneksi saat server start
pool
  .connect()
  .then((client) => {
    console.log("✅ Connected to Neon PostgreSQL database!");
    client.release();
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
  });

// Ekspor pool agar bisa digunakan di semua route
module.exports = pool;
