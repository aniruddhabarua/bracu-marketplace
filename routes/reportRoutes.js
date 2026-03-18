// routes/reportRoutes.js
const express           = require('express');
const router            = express.Router();
const ReportController  = require('../controllers/reportControllers');

// All report routes require authentication.
// router.use(authenticate);

// POST   /api/reports          — submit a report
router.post('/',                  ReportController.submitReport);

// GET    /api/reports/my        — get my submitted reports
router.get('/my',                 ReportController.getMyReports);

// GET    /api/reports           — admin: get all reports (?status=pending)
router.get('/',                   ReportController.getAllReports);

// PUT    /api/reports/:id       — admin: resolve/dismiss a report
router.put('/:id',                ReportController.resolveReport);

module.exports = router;
