const db = require('../config/db');

// GET /api/messages - Get conversations list
const getConversations = async (req, res) => {
  try {
    const [convs] = await db.execute(`
      SELECT DISTINCT
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        u.name as other_name, u.avatar_url as other_avatar, u.role as other_role,
        (SELECT content FROM messages WHERE (sender_id=? AND receiver_id=other_user_id) OR (sender_id=other_user_id AND receiver_id=?) ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE (sender_id=? AND receiver_id=other_user_id) OR (sender_id=other_user_id AND receiver_id=?) ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE sender_id=other_user_id AND receiver_id=? AND is_read=FALSE) as unread_count
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id=? OR m.receiver_id=?
      ORDER BY last_message_time DESC
    `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);
    res.json({ success: true, conversations: convs });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/messages/:userId - Get thread with a specific user
const getThread = async (req, res) => {
  try {
    const { userId } = req.params;
    const [messages] = await db.execute(`
      SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
      FROM messages m JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?)
      ORDER BY m.created_at ASC
    `, [req.user.id, userId, userId, req.user.id]);
    // Mark as read
    await db.execute('UPDATE messages SET is_read=TRUE WHERE sender_id=? AND receiver_id=?', [userId, req.user.id]);
    res.json({ success: true, messages });
  } catch (err) {
    console.error('Get thread error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/messages - Send a message
const sendMessage = async (req, res) => {
  try {
    const { receiver_id, content } = req.body;
    if (!receiver_id || !content) return res.status(400).json({ success: false, message: 'Receiver and content required' });
    const [result] = await db.execute(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?,?,?)',
      [req.user.id, receiver_id, content]
    );
    const [msg] = await db.execute(
      'SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id=?',
      [result.insertId]
    );
    res.status(201).json({ success: true, message: msg[0] });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getConversations, getThread, sendMessage };
