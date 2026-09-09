'use strict';
const express = require('express');
const { requireAuthApi } = require('../middleware/auth');
const sessionController = require('../controllers/sessionController');
const router = express.Router();

router.get('/', requireAuthApi, sessionController.listSessions);
router.post('/', requireAuthApi, sessionController.createSession);
router.put('/:id', requireAuthApi, sessionController.updateSession);
router.delete('/:id', requireAuthApi, sessionController.deleteSession);
router.get('/history', requireAuthApi, sessionController.listHistory);
router.get('/history/stats', requireAuthApi, sessionController.getHistoryStats);
router.put('/history/:id/end', requireAuthApi, sessionController.endHistory);

module.exports = router;
