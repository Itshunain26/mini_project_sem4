const db = require('../config/db');

// POST /api/requests - Send mentorship request
const sendRequest = async (req, res) => {
  try {
    const { mentor_id, message, goals } = req.body;
    if (!mentor_id) return res.status(400).json({ success: false, message: 'Mentor ID required' });
    // Check if active request already exists
    const [existing] = await db.execute(
      'SELECT id FROM mentorship_requests WHERE student_id=? AND mentor_id=? AND status IN ("pending","accepted")',
      [req.user.id, mentor_id]
    );
    if (existing.length > 0) return res.status(409).json({ success: false, message: 'You already have an active request with this mentor' });
    const [result] = await db.execute(
      'INSERT INTO mentorship_requests (student_id, mentor_id, message, goals) VALUES (?,?,?,?)',
      [req.user.id, mentor_id, message, goals]
    );
    res.status(201).json({ success: true, message: 'Request sent successfully', requestId: result.insertId });
  } catch (err) {
    console.error('Send request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/requests - Get requests (student sees own, mentor sees received)
const getRequests = async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'student') {
      query = `SELECT mr.*, u.name as mentor_name, u.avatar_url as mentor_avatar,
               mp.title as mentor_title, mp.company as mentor_company
               FROM mentorship_requests mr
               JOIN users u ON mr.mentor_id = u.id
               JOIN mentor_profiles mp ON u.id = mp.user_id
               WHERE mr.student_id=? ORDER BY mr.created_at DESC`;
      params = [req.user.id];
    } else if (req.user.role === 'mentor') {
      query = `SELECT mr.*, u.name as student_name, u.avatar_url as student_avatar,
               sp.major, sp.year_of_study, sp.institution
               FROM mentorship_requests mr
               JOIN users u ON mr.student_id = u.id
               LEFT JOIN student_profiles sp ON u.id = sp.user_id
               WHERE mr.mentor_id=? ORDER BY mr.created_at DESC`;
      params = [req.user.id];
    } else {
      const [all] = await db.execute(`SELECT mr.*, 
        s.name as student_name, m.name as mentor_name
        FROM mentorship_requests mr
        JOIN users s ON mr.student_id = s.id
        JOIN users m ON mr.mentor_id = m.id
        ORDER BY mr.created_at DESC`);
      return res.json({ success: true, requests: all });
    }
    const [requests] = await db.execute(query, params);
    res.json({ success: true, requests });
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/requests/:id - Accept or reject request (mentor only)
const respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be accepted or rejected' });
    }
    const [rows] = await db.execute('SELECT * FROM mentorship_requests WHERE id=? AND mentor_id=?', [id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Request not found' });
    await db.execute('UPDATE mentorship_requests SET status=?, responded_at=NOW() WHERE id=?', [status, id]);
    res.json({ success: true, message: `Request ${status}` });
  } catch (err) {
    console.error('Respond request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/requests/:id - Cancel request (student only)
const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('UPDATE mentorship_requests SET status="cancelled" WHERE id=? AND student_id=?', [id, req.user.id]);
    res.json({ success: true, message: 'Request cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { sendRequest, getRequests, respondToRequest, cancelRequest };
