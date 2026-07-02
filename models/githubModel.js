// ============================================================
// models/githubModel.js
// All raw SQL queries for the github_profiles table live here.
// Controllers/services never write SQL directly — they call
// these functions instead. This keeps DB logic isolated.
// ============================================================

const { pool } = require('../config/db');

/**
 * Insert a new profile, or update it if the username already
 * exists (upsert), using MySQL's ON DUPLICATE KEY UPDATE.
 * Requires a UNIQUE constraint on `username` (see schema.sql).
 */
const upsertProfile = async (data) => {
  const sql = `
    INSERT INTO github_profiles (
      username, name, bio, avatar_url, profile_url, company, location, blog,
      followers, following, public_repos, public_gists,
      total_stars, total_forks, most_used_language, most_starred_repo,
      average_stars, average_forks, account_created_at, last_github_update,
      last_analyzed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      bio = VALUES(bio),
      avatar_url = VALUES(avatar_url),
      profile_url = VALUES(profile_url),
      company = VALUES(company),
      location = VALUES(location),
      blog = VALUES(blog),
      followers = VALUES(followers),
      following = VALUES(following),
      public_repos = VALUES(public_repos),
      public_gists = VALUES(public_gists),
      total_stars = VALUES(total_stars),
      total_forks = VALUES(total_forks),
      most_used_language = VALUES(most_used_language),
      most_starred_repo = VALUES(most_starred_repo),
      average_stars = VALUES(average_stars),
      average_forks = VALUES(average_forks),
      account_created_at = VALUES(account_created_at),
      last_github_update = VALUES(last_github_update),
      last_analyzed_at = NOW()
  `;

  const values = [
    data.username, data.name, data.bio, data.avatarUrl, data.profileUrl,
    data.company, data.location, data.blog,
    data.followers, data.following, data.publicRepos, data.publicGists,
    data.totalStars, data.totalForks, data.mostUsedLanguage, data.mostStarredRepo,
    data.averageStars, data.averageForks,
    data.accountCreatedAt ? new Date(data.accountCreatedAt) : null,
    data.lastGithubUpdate ? new Date(data.lastGithubUpdate) : null
  ];

  const [result] = await pool.execute(sql, values);
  return result;
};

/**
 * Fetch a single stored profile by username.
 * Returns undefined if not found.
 */
const getProfileByUsername = async (username) => {
  const [rows] = await pool.execute(
    'SELECT * FROM github_profiles WHERE username = ?',
    [username]
  );
  return rows[0];
};

/**
 * Fetch all stored profiles with optional search, sorting,
 * and pagination support.
 *
 * options: {
 *   search: string | undefined,
 *   sortBy: 'followers' | 'public_repos' | 'last_analyzed_at',
 *   order: 'ASC' | 'DESC',
 *   page: number,
 *   limit: number
 * }
 */
const getAllProfiles = async (options = {}) => {
  const {
    search = '',
    sortBy = 'last_analyzed_at',
    order = 'DESC',
    page = 1,
    limit = 10
  } = options;

  // Whitelist sortable columns to prevent SQL injection via column names
  const allowedSortColumns = ['followers', 'public_repos', 'total_stars', 'last_analyzed_at', 'username'];
  const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'last_analyzed_at';
  const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const offset = (Math.max(page, 1) - 1) * limit;

  let whereClause = '';
  const params = [];

  if (search) {
    whereClause = 'WHERE username LIKE ? OR name LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  // Get total count for pagination metadata
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM github_profiles ${whereClause}`,
    params
  );
  const total = countRows[0].total;

  // Column name and LIMIT/OFFSET can't be parameterized with `?` in mysql2,
  // so they are safely interpolated after whitelisting/validating above.
  const sql = `
    SELECT * FROM github_profiles
    ${whereClause}
    ORDER BY ${safeSortBy} ${safeOrder}
    LIMIT ${Number(limit)} OFFSET ${Number(offset)}
  `;

  const [rows] = await pool.execute(sql, params);

  return {
    profiles: rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Delete a profile by username.
 * Returns true if a row was deleted, false otherwise.
 */
const deleteProfileByUsername = async (username) => {
  const [result] = await pool.execute(
    'DELETE FROM github_profiles WHERE username = ?',
    [username]
  );
  return result.affectedRows > 0;
};

module.exports = {
  upsertProfile,
  getProfileByUsername,
  getAllProfiles,
  deleteProfileByUsername
};
