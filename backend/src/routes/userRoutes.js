// backend/src/routes/dealRoutes.js
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/:id', userController.getUserProfile);
router.put('/:id', userController.updateUserProfile);
router.delete('/:id', userController.deleteUserProfile);
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

module.exports = router;