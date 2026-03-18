// controllers/reportControllers.js
// Handles Feature 10: Report System
const ReportModel       = require('../models/reportModels');
const NotificationModel = require('../models/notificationModels');

const VALID_TYPES   = ['listing', 'user', 'message'];
const VALID_REASONS = [
  'Spam or misleading',
  'Inappropriate content',
  'Fake or scam listing',
  'Harassment or abuse',
  'Prohibited item',
  'Wrong category',
  'Other',
];

const ReportController = {

  // ── POST /api/reports ─────────────────────────────────────────
  // Submit a new report
  // Body: { reported_type, reported_id, reason, details }
  submitReport: (req, res) => {
    const reporter_id   = req.user.user_id;
    const { reported_type, reported_id, reason, details } = req.body;

    // Validation
    if (!reported_type || !reported_id || !reason)
      return res.status(400).json({ success: false, message: 'reported_type, reported_id and reason are required.' });

    if (!VALID_TYPES.includes(reported_type))
      return res.status(400).json({ success: false, message: `reported_type must be one of: ${VALID_TYPES.join(', ')}.` });

    if (!VALID_REASONS.includes(reason))
      return res.status(400).json({ success: false, message: `Invalid reason. Choose from: ${VALID_REASONS.join(', ')}.` });

    // Prevent duplicate reports
    ReportModel.isDuplicate(reporter_id, reported_type, parseInt(reported_id), (err, isDup) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.' });
      if (isDup)
        return res.status(409).json({ success: false, message: 'You have already reported this. Our team is reviewing it.' });

      const reportData = {
        reporter_id,
        reported_type,
        reported_id: parseInt(reported_id),
        reason,
        details,
      };

      ReportModel.create(reportData, (err2, result) => {
        if (err2) return res.status(500).json({ success: false, message: 'Database error.', error: err2.message });

        // Notify the reporter that their report was received
        NotificationModel.create(
          reporter_id,
          'report',
          'Report Submitted',
          `Your report about a ${reported_type} has been received. Our team will review it shortly.`,
          null,
          () => {}
        );

        return res.status(201).json({
          success:   true,
          message:   'Report submitted. Our team will review it within 24–48 hours.',
          report_id: result.insertId,
        });
      });
    });
  },

  // ── GET /api/reports/my ───────────────────────────────────────
  // Get all reports submitted by the logged-in user
  getMyReports: (req, res) => {
    ReportModel.getByReporter(req.user.user_id, (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.' });
      return res.status(200).json({ success: true, data: rows });
    });
  },

  // ── GET /api/reports ──────────────────────────────────────────
  // Admin: get all reports with optional ?status= filter
  getAllReports: (req, res) => {
    // Role check — only admins
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin access required.' });

    const status = req.query.status || null;
    ReportModel.getAll(status, (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.' });
      return res.status(200).json({ success: true, data: rows });
    });
  },

  // ── PUT /api/reports/:id ──────────────────────────────────────
  // Admin: resolve or dismiss a report
  // Body: { status, admin_note }
  resolveReport: (req, res) => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin access required.' });

    const reportId  = parseInt(req.params.id);
    const { status, admin_note } = req.body;
    const validStatuses = ['reviewed', 'resolved', 'dismissed'];

    if (isNaN(reportId))
      return res.status(400).json({ success: false, message: 'Invalid report ID.' });

    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}.` });

    ReportModel.findById(reportId, (err, rows) => {
      if (err)          return res.status(500).json({ success: false, message: 'Database error.' });
      if (!rows.length) return res.status(404).json({ success: false, message: 'Report not found.' });

      const report = rows[0];

      ReportModel.updateStatus(reportId, status, admin_note, (err2) => {
        if (err2) return res.status(500).json({ success: false, message: 'Database error.' });

        // Notify the reporter of the outcome
        NotificationModel.create(
          report.reporter_id,
          'report',
          'Your Report Has Been Reviewed',
          `Your report has been ${status}. ${admin_note ? 'Note: ' + admin_note : ''}`,
          null,
          () => {}
        );

        return res.status(200).json({ success: true, message: `Report marked as ${status}.` });
      });
    });
  },

};

module.exports = ReportController;
