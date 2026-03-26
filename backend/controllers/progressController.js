const db = require('../config/db');

// GET /api/progress - Get student's goals
const getGoals = async (req, res) => {
  try {
    const studentId = req.user.role === 'student' ? req.user.id : req.query.student_id;
    const [goals] = await db.execute(`
      SELECT pg.*, u.name as mentor_name FROM progress_goals pg
      LEFT JOIN users u ON pg.mentor_id = u.id
      WHERE pg.student_id=? ORDER BY pg.created_at DESC
    `, [studentId]);
    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/progress
const createGoal = async (req, res) => {
  try {
    const { title, description, target_date, priority, milestones } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Goal title required' });
    const [result] = await db.execute(
      'INSERT INTO progress_goals (student_id, title, description, target_date, priority, milestones) VALUES (?,?,?,?,?,?)',
      [req.user.id, title, description, target_date, priority || 'medium', milestones ? JSON.stringify(milestones) : null]
    );
    res.status(201).json({ success: true, message: 'Goal created', goalId: result.insertId });
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/progress/:id
const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, progress_percentage, target_date, priority, milestones } = req.body;
    await db.execute(`
      UPDATE progress_goals SET title=?, description=?, status=?, progress_percentage=?, target_date=?, priority=?, milestones=?
      WHERE id=? AND student_id=?
    `, [title, description, status, progress_percentage || 0, target_date, priority, milestones ? JSON.stringify(milestones) : null, id, req.user.id]);
    res.json({ success: true, message: 'Goal updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/progress/:id
const deleteGoal = async (req, res) => {
  try {
    await db.execute('DELETE FROM progress_goals WHERE id=? AND student_id=?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/progress/summary
const getProgressSummary = async (req, res) => {
  try {
    const studentId = req.user.id;
    const [summary] = await db.execute(`
      SELECT
        COUNT(*) as total_goals,
        SUM(status='completed') as completed_goals,
        SUM(status='in_progress') as active_goals,
        AVG(progress_percentage) as avg_progress
      FROM progress_goals WHERE student_id=?
    `, [studentId]);
    res.json({ success: true, summary: summary[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal, getProgressSummary };
