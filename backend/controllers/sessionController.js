const db = require('../config/db');

// POST /api/sessions - Create session
const createSession = async (req, res) => {
  try {
    const { request_id, student_id, title, description, scheduled_at, duration_minutes, meeting_link } = req.body;
    if (!request_id || !student_id || !title || !scheduled_at) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }
    const [result] = await db.execute(
      'INSERT INTO sessions (request_id, student_id, mentor_id, title, description, scheduled_at, duration_minutes, meeting_link) VALUES (?,?,?,?,?,?,?,?)',
      [request_id, student_id, req.user.id, title, description, scheduled_at, duration_minutes || 60, meeting_link]
    );
    res.status(201).json({ success: true, message: 'Session scheduled', sessionId: result.insertId });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/sessions - Get sessions for logged in user
const getSessions = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT s.*, 
             su.name as student_name, su.avatar_url as student_avatar,
             mu.name as mentor_name, mu.avatar_url as mentor_avatar,
             mp.title as mentor_title, mp.company as mentor_company
      FROM sessions s
      JOIN users su ON s.student_id = su.id
      JOIN users mu ON s.mentor_id = mu.id
      LEFT JOIN mentor_profiles mp ON mu.id = mp.user_id
      WHERE (s.student_id=? OR s.mentor_id=?)
    `;
    const params = [req.user.id, req.user.id];
    if (status) { query += ' AND s.status=?'; params.push(status); }
    query += ' ORDER BY s.scheduled_at ASC';
    const [sessions] = await db.execute(query, params);
    res.json({ success: true, sessions });
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/sessions/:id - Update session status
const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    await db.execute('UPDATE sessions SET status=?, notes=? WHERE id=? AND (student_id=? OR mentor_id=?)',
      [status, notes, id, req.user.id, req.user.id]);
    // If completed, update mentor total_sessions
    if (status === 'completed') {
      await db.execute('UPDATE mentor_profiles SET total_sessions = total_sessions + 1 WHERE user_id = (SELECT mentor_id FROM sessions WHERE id=?)', [id]);
    }
    res.json({ success: true, message: 'Session updated' });
  } catch (err) {
    console.error('Update session error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/sessions/:id/feedback - Submit feedback
const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating 1-5 required' });
    await db.execute(
      'INSERT INTO session_feedback (session_id, given_by, rating, comment) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE rating=?, comment=?',
      [id, req.user.id, rating, comment, rating, comment]
    );
    // Update mentor average rating
    await db.execute(`
      UPDATE mentor_profiles mp
      JOIN sessions s ON s.mentor_id = mp.user_id
      SET mp.average_rating = (
        SELECT AVG(sf.rating) FROM session_feedback sf JOIN sessions ss ON sf.session_id = ss.id WHERE ss.mentor_id = mp.user_id
      )
      WHERE s.id = ?
    `, [id]);
    res.json({ success: true, message: 'Feedback submitted' });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createSession, getSessions, updateSession, submitFeedback };
