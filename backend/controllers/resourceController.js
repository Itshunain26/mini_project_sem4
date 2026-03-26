const db = require('../config/db');

// GET /api/resources
const getResources = async (req, res) => {
  try {
    const { category, type, search } = req.query;
    let query = `
      SELECT r.*, u.name as uploader_name, c.name as category_name, c.icon as category_icon
      FROM resources r
      JOIN users u ON r.uploaded_by = u.id
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.is_public = TRUE
    `;
    const params = [];
    if (category) { query += ' AND r.category_id=?'; params.push(category); }
    if (type) { query += ' AND r.resource_type=?'; params.push(type); }
    if (search) { query += ' AND (r.title LIKE ? OR r.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY r.created_at DESC';
    const [resources] = await db.execute(query, params);
    res.json({ success: true, resources });
  } catch (err) {
    console.error('Get resources error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/resources
const addResource = async (req, res) => {
  try {
    const { title, description, resource_type, url, category_id, tags } = req.body;
    if (!title || !url) return res.status(400).json({ success: false, message: 'Title and URL required' });
    const [result] = await db.execute(
      'INSERT INTO resources (uploaded_by, title, description, resource_type, url, category_id, tags) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, title, description, resource_type || 'link', url, category_id, tags]
    );
    res.status(201).json({ success: true, message: 'Resource added', resourceId: result.insertId });
  } catch (err) {
    console.error('Add resource error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/resources/:id
const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM resources WHERE id=? AND (uploaded_by=? OR ? = "admin")', [id, req.user.id, req.user.role]);
    res.json({ success: true, message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/resources/:id/view
const incrementView = async (req, res) => {
  try {
    await db.execute('UPDATE resources SET views = views + 1 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getResources, addResource, deleteResource, incrementView };
