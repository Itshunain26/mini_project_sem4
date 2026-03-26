const db = require('../config/db');

// GET /api/users/profile - Get own profile (with role-specific data)
const getProfile = async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, name, email, role, avatar_url, phone, created_at FROM users WHERE id=?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    const user = users[0];
    let profile = null;
    if (user.role === 'student') {
      const [sp] = await db.execute('SELECT * FROM student_profiles WHERE user_id=?', [req.user.id]);
      profile = sp[0] || null;
    } else if (user.role === 'mentor') {
      const [mp] = await db.execute('SELECT * FROM mentor_profiles WHERE user_id=?', [req.user.id]);
      profile = mp[0] || null;
    }
    res.json({ success: true, user, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/users/profile - Update base user info
const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar_url } = req.body;
    await db.execute('UPDATE users SET name=?, phone=?, avatar_url=? WHERE id=?', [name, phone, avatar_url, req.user.id]);
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/users/student-profile
const updateStudentProfile = async (req, res) => {
  try {
    const { major, year_of_study, gpa, institution, bio, goals, linkedin_url, github_url } = req.body;
    await db.execute(`
      UPDATE student_profiles SET major=?, year_of_study=?, gpa=?, institution=?, bio=?, goals=?, linkedin_url=?, github_url=?
      WHERE user_id=?
    `, [major, year_of_study, gpa, institution, bio, goals, linkedin_url, github_url, req.user.id]);
    res.json({ success: true, message: 'Student profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/users/categories - Get all categories
const getCategories = async (req, res) => {
  try {
    const [cats] = await db.execute('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, categories: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile, updateStudentProfile, getCategories };
