const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const usersRoutes = require("./routes/users");
const kosRoutes = require("./routes/kos");
const bookingsRoutes = require("./routes/bookings");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ penting untuk form-data (upload)


// ✅ Pastikan folder public/images bisa diakses dari URL
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Routes utama
app.use("/api/users", usersRoutes);
app.use("/api/kos", kosRoutes);
app.use("/api/bookings", bookingsRoutes);

// Route root sederhana
app.get("/", (req, res) => {
  res.send("✅ KoKost Backend API berjalan dengan baik!");
});

// Jalankan server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
