const AnnouncementModel = require('../models/announcementModels');

const AnnouncementController = {
  // GET /api/announcements
  getAnnouncements: (req, res) => {
    AnnouncementModel.getAll((err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      res.status(200).json({ success: true, data: results });
    });
  },

  // POST /api/announcements
  postAnnouncement: (req, res) => {
    const { title, content, category } = req.body;
    const admin_id = req.user.user_id;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    AnnouncementModel.create({ admin_id, title, content, category }, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      res.status(201).json({ success: true, message: 'Announcement posted successfully.', announcement_id: result.insertId });
    });
  },

  // DELETE /api/announcements/:id
  deleteAnnouncement: (req, res) => {
    const id = req.params.id;
    AnnouncementModel.delete(id, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Announcement not found.' });
      res.status(200).json({ success: true, message: 'Announcement deleted successfully.' });
    });
  }
};

module.exports = AnnouncementController;
