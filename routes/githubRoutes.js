// ============================================================
// routes/githubRoutes.js
// Defines all /api/github/* endpoints and wires them to their
// corresponding controller functions.
// ============================================================

const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');

// POST /api/github/analyze/:username -> analyze + store a profile
router.post('/analyze/:username', githubController.analyzeProfile);

// GET /api/github/profiles -> list all stored profiles (search/sort/paginate)
router.get('/profiles', githubController.getAllProfiles);

// GET /api/github/profile/:username -> get one stored profile
router.get('/profile/:username', githubController.getProfile);

// DELETE /api/github/profile/:username -> delete a stored profile
router.delete('/profile/:username', githubController.deleteProfile);

// PUT /api/github/refresh/:username -> re-fetch + update a profile
router.put('/refresh/:username', githubController.refreshProfile);

module.exports = router;
