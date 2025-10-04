const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");

// ✅ Ambil semua user
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, email, role, created_at FROM users"
    );
    res.json({ success: true, users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ✅ Register user baru
router.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // --- Validasi input ---
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Username, email, dan password wajib diisi" });
    }

    // --- Cek username ---
    const [existsUser] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (existsUser.length > 0) {
      return res
        .status(400)
        .json({ success: false, error: "Username sudah dipakai" });
    }

    // --- Cek email ---
    const [existsEmail] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existsEmail.length > 0) {
      return res
        .status(400)
        .json({ success: false, error: "Email sudah terdaftar" });
    }

    // --- Hash password ---
    const hashed = await bcrypt.hash(password, 10);

    // --- Simpan ke DB ---
    const [result] = await db.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashed, role || "user"]
    );

    // --- Response sukses ---
    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      userId: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: "Terjadi kesalahan pada server" });
  }
});

// ✅ Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (users.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Username tidak ditemukan" });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(400)
        .json({ success: false, error: "Password salah" });
    }

    res.json({
      success: true,
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ✅ Hapus user
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ success: true, message: "User dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

module.exports = router;
