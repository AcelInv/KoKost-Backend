const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const usersRoutes = require("../routes/users");
const kosRoutes = require("../routes/kos");
const bookingsRoutes = require("../routes/bookings");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use("/images", express.static(path.join(__dirname, "../public/images")));

// Routes
app.use("/api/users", usersRoutes);
app.use("/api/kos", kosRoutes);
app.use("/api/bookings", bookingsRoutes);

module.exports = app;
