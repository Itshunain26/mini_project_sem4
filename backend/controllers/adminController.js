const db = require('../config/db');

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [[users]] = await db.execute('SELECT COUNT(*) as total, SUM(role="student") as students, SUM(role="mentor") as mentors FROM users');
    const [[sessions]] = await db.execute('SELECT COUNT(*) as total, SUM(status="completed") as completed FROM sessions');
    const [[requests]] = await db.execute('SELECT COUNT(*) as total, SUM(status="accepted") as accepted FROM mentorship_requests');
    const [[resources]] = await db.execute('SELECT COUNT(*) as total FROM resources');
    const [topMentors] = await db.execute(`
      SELECT u.name, mp.company, mp.title, mp.total_sessions, mp.average_rating
      FROM users u JOIN mentor_profiles mp ON u.id=mp.user_id
      ORDER BY mp.total_sessions DESC LIMIT 5
    `);
    const [categoryStats] = await db.execute(`
      SELECT c.name, COUNT(mc.mentor_id) as mentor_count FROM categories c
      LEFT JOIN mentor_categories mc ON c.id=mc.category_id GROUP BY c.id ORDER BY mentor_count DESC
    `);
    res.json({ success: true, stats: { users, sessions, requests, resources, topMentors, categoryStats } });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = 'SELECT id, name, email, role, is_active, created_at FROM users WHERE 1=1';
    const params = [];
    if (role) { query += ' AND role=?'; params.push(role); }
    if (search) { query += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY created_at DESC';
    const [users] = await db.execute(query, params);
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/users/:id/toggle
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('UPDATE users SET is_active = NOT is_active WHERE id=?', [id]);
    res.json({ success: true, message: 'User status toggled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    await db.execute('DELETE FROM users WHERE id=?', [id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getStats, getAllUsers, toggleUserStatus, deleteUser };
