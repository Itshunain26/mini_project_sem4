const db = require('../config/db');

// GET /api/mentors - Browse all mentors with filters
const getMentors = async (req, res) => {
  try {
    const { category, search, available } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.avatar_url,
             mp.title, mp.company, mp.years_experience, mp.expertise_summary,
             mp.bio, mp.hourly_rate, mp.is_available, mp.average_rating, mp.total_sessions,
             GROUP_CONCAT(c.name SEPARATOR ', ') as categories,
             GROUP_CONCAT(c.id SEPARATOR ',') as category_ids
      FROM users u
      JOIN mentor_profiles mp ON u.id = mp.user_id
      LEFT JOIN mentor_categories mc ON mp.id = mc.mentor_id
      LEFT JOIN categories c ON mc.category_id = c.id
      WHERE u.role = 'mentor' AND u.is_active = TRUE
    `;
    const params = [];
    if (search) {
      query += ` AND (u.name LIKE ? OR mp.title LIKE ? OR mp.expertise_summary LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (available === 'true') {
      query += ` AND mp.is_available = TRUE`;
    }
    query += ` GROUP BY u.id, mp.id`;
    if (category) {
      query += ` HAVING FIND_IN_SET(?, category_ids) > 0`;
      params.push(category);
    }
    query += ` ORDER BY mp.average_rating DESC, mp.total_sessions DESC`;
    const [mentors] = await db.execute(query, params);
    res.json({ success: true, mentors });
  } catch (err) {
    console.error('Get mentors error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/mentors/:id - Get single mentor profile
const getMentorById = async (req, res) => {
  try {
    const { id } = req.params;
    const [mentors] = await db.execute(`
      SELECT u.id, u.name, u.email, u.avatar_url, u.phone, u.created_at,
             mp.id as profile_id, mp.title, mp.company, mp.years_experience, mp.expertise_summary,
             mp.bio, mp.linkedin_url, mp.github_url, mp.website_url,
             mp.hourly_rate, mp.is_available, mp.max_mentees, mp.total_sessions, mp.average_rating
      FROM users u
      JOIN mentor_profiles mp ON u.id = mp.user_id
      WHERE u.id = ? AND u.role = 'mentor'
    `, [id]);
    if (mentors.length === 0) return res.status(404).json({ success: false, message: 'Mentor not found' });
    const mentor = mentors[0];
    // Get categories
    const [cats] = await db.execute(`
      SELECT c.id, c.name, c.icon, c.color FROM categories c
      JOIN mentor_categories mc ON c.id = mc.category_id
      WHERE mc.mentor_id = ?
    `, [mentor.profile_id]);
    // Get recent reviews
    const [reviews] = await db.execute(`
      SELECT sf.rating, sf.comment, sf.created_at, u.name as student_name, u.avatar_url as student_avatar
      FROM session_feedback sf
      JOIN sessions s ON sf.session_id = s.id
      JOIN users u ON sf.given_by = u.id
      WHERE s.mentor_id = ? AND sf.given_by != ? ORDER BY sf.created_at DESC LIMIT 5
    `, [id, id]);
    res.json({ success: true, mentor: { ...mentor, categories: cats, reviews } });
  } catch (err) {
    console.error('Get mentor by id error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/mentors/profile - Update mentor profile
const updateMentorProfile = async (req, res) => {
  try {
    const { title, company, years_experience, expertise_summary, bio, linkedin_url, github_url, website_url, hourly_rate, is_available, max_mentees, categories } = req.body;
    await db.execute(`
      UPDATE mentor_profiles SET title=?, company=?, years_experience=?, expertise_summary=?,
      bio=?, linkedin_url=?, github_url=?, website_url=?, hourly_rate=?, is_available=?, max_mentees=?
      WHERE user_id=?
    `, [title, company, years_experience || 0, expertise_summary, bio, linkedin_url, github_url, website_url, hourly_rate || 0, is_available, max_mentees || 5, req.user.id]);
    // Update categories
    if (categories && Array.isArray(categories)) {
      const [mp] = await db.execute('SELECT id FROM mentor_profiles WHERE user_id=?', [req.user.id]);
      if (mp.length > 0) {
        const mpId = mp[0].id;
        await db.execute('DELETE FROM mentor_categories WHERE mentor_id=?', [mpId]);
        for (const catId of categories) {
          await db.execute('INSERT IGNORE INTO mentor_categories (mentor_id, category_id) VALUES (?,?)', [mpId, catId]);
        }
      }
    }
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update mentor profile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/mentors/profile/me
const getMyMentorProfile = async (req, res) => {
  try {
    const [profile] = await db.execute(`
      SELECT mp.*, GROUP_CONCAT(c.id) as category_ids, GROUP_CONCAT(c.name SEPARATOR '|') as category_names
      FROM mentor_profiles mp
      LEFT JOIN mentor_categories mc ON mp.id = mc.mentor_id
      LEFT JOIN categories c ON mc.category_id = c.id
      WHERE mp.user_id = ? GROUP BY mp.id
    `, [req.user.id]);
    res.json({ success: true, profile: profile[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getMentors, getMentorById, updateMentorProfile, getMyMentorProfile };
