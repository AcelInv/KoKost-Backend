const express = require('express');
const cors = require('cors');
const path = require('path'); // ✅ import path
require('dotenv').config();

const usersRoutes = require('./routes/users');
const kosRoutes = require('./routes/kos');
const bookingsRoutes = require('./routes/bookings');
const roomRoutes = require('./routes/rooms');

const app = express();
app.use(cors());
app.use(express.json());

// Serve folder images
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Routes
app.use('/api/users', usersRoutes);
app.use('/api/kos', kosRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/rooms', roomRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
