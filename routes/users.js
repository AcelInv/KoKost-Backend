const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");

// GET semua user
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT id, username, email, role, created_at FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("Error GET /users:", err.message);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// REGISTER user baru
router.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const checkUser = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    if (checkUser.rows.length > 0)
      return res.status(400).json({ success: false, error: "Username sudah dipakai" });

    const checkEmail = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (checkEmail.rows.length > 0)
      return res.status(400).json({ success: false, error: "Email sudah terdaftar" });

    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)",
      [username, email, hashed, role || "user"]
    );

    // ✅ Tambahan success + status 201 agar frontend mengenali sebagai berhasil
    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
    });
  } catch (err) {
    console.error("Error POST /register:", err.message);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// LOGIN user
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0)
      return res.status(400).json({ success: false, error: "Username tidak ditemukan" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ success: false, error: "Password salah" });

    res.json({ success: true, id: user.id, username: user.username, role: user.role });
  } catch (err) {
    console.error("Error POST /login:", err.message);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// DELETE user
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ success: true, message: "User dihapus" });
  } catch (err) {
    console.error("Error DELETE /users:", err.message);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

module.exports = router;
