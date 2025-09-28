const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// Ambil semua user
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, email, role, created_at FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Registrasi user
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const [exists] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (exists.length > 0) return res.status(400).json({ error: 'Email sudah terdaftar' });

    const hashed = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashed, role || 'user']);
    res.json({ message: 'Registrasi berhasil' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ error: 'Email tidak ditemukan' });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Password salah' });

    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Hapus user
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
