const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyFirebaseToken } = require('../middleware/auth');

// Public routes
router.post('/verify-token', authController.verifyToken);

// Protected routes (ត្រូវការ Token)
router.get('/user/:uid', verifyFirebaseToken, authController.getUser);
router.put('/user/:uid', verifyFirebaseToken, authController.updateUser);

module.exports = router;