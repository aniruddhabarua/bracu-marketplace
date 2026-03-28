const express           = require('express');
const router            = express.Router();
const ReportController  = require('../controllers/reportControllers');
const { authenticate }  = require('../middleware/auth');

router.use(authenticate);

router.post('/',                  ReportController.submitReport);

router.get('/my',                 ReportController.getMyReports);

router.get('/',                   ReportController.getAllReports);

router.put('/:id',                ReportController.resolveReport);

module.exports = router;
