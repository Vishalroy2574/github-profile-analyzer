// ============================================================
// controllers/githubController.js
// Handles incoming HTTP requests: validates input, calls the
// service/model layers, and shapes the JSON response.
// Controllers should stay "thin" — no SQL, no axios calls here.
// ============================================================

const githubService = require('../services/githubService');
const githubModel = require('../models/githubModel');

// Basic GitHub username validation:
// - 1 to 39 characters
// - alphanumeric and hyphens only
// - cannot start or end with a hyphen
const USERNAME_REGEX = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

const isValidUsername = (username) => {
  return typeof username === 'string' && USERNAME_REGEX.test(username);
};

/**
 * POST /api/github/analyze/:username
 * Fetches fresh data from GitHub, computes insights, and
 * upserts the result into MySQL.
 */
const analyzeProfile = async (req, res) => {
  const { username } = req.params;

  if (!isValidUsername(username)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid GitHub username format'
    });
  }

  try {
    const analysis = await githubService.analyzeProfile(username);
    await githubModel.upsertProfile(analysis);
    const savedProfile = await githubModel.getProfileByUsername(analysis.username);

    return res.status(200).json({
      success: true,
      message: 'Profile analyzed successfully',
      data: savedProfile
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * GET /api/github/profiles
 * Returns all stored profiles with search, sort, and pagination.
 */
const getAllProfiles = async (req, res) => {
  try {
    const { search, sortBy, order, page, limit } = req.query;

    const result = await githubModel.getAllProfiles({
      search: search ? String(search) : '',
      sortBy: sortBy ? String(sortBy) : 'last_analyzed_at',
      order: order ? String(order) : 'DESC',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10
    });

    return res.status(200).json({
      success: true,
      message: 'Profiles fetched successfully',
      data: result.profiles,
      pagination: result.pagination
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * GET /api/github/profile/:username
 * Returns a single stored profile.
 */
const getProfile = async (req, res) => {
  const { username } = req.params;

  if (!isValidUsername(username)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid GitHub username format'
    });
  }

  try {
    const profile = await githubModel.getProfileByUsername(username);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Analyze it first using POST /api/github/analyze/:username'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: profile
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * DELETE /api/github/profile/:username
 * Removes a stored profile.
 */
const deleteProfile = async (req, res) => {
  const { username } = req.params;

  if (!isValidUsername(username)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid GitHub username format'
    });
  }

  try {
    const deleted = await githubModel.deleteProfileByUsername(username);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile deleted successfully',
      data: null
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * PUT /api/github/refresh/:username
 * Re-fetches the latest GitHub data and updates the stored record.
 * Requires that the profile already exists locally.
 */
const refreshProfile = async (req, res) => {
  const { username } = req.params;

  if (!isValidUsername(username)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid GitHub username format'
    });
  }

  try {
    const existing = await githubModel.getProfileByUsername(username);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Analyze it first using POST /api/github/analyze/:username'
      });
    }

    const analysis = await githubService.analyzeProfile(username);
    await githubModel.upsertProfile(analysis);
    const updatedProfile = await githubModel.getProfileByUsername(username);

    return res.status(200).json({
      success: true,
      message: 'Profile refreshed successfully',
      data: updatedProfile
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Centralized error handler for controller catch blocks.
 * Distinguishes known GithubApiError instances (with a
 * specific statusCode) from unexpected server/DB errors.
 */
const handleError = (res, error) => {
  if (error instanceof githubService.GithubApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  // MySQL / unexpected errors
  console.error('Unexpected error:', error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

module.exports = {
  analyzeProfile,
  getAllProfiles,
  getProfile,
  deleteProfile,
  refreshProfile
};
