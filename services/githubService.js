// ============================================================
// services/githubService.js
// Handles all communication with the GitHub Public REST API
// and the business logic for turning raw API data into
// meaningful, computed insights.
// ============================================================

const axios = require('axios');
require('dotenv').config();

const GITHUB_API = process.env.GITHUB_API || 'https://api.github.com';

// Build a reusable axios instance with sensible defaults.
// If a GITHUB_TOKEN is provided, attach it to raise the rate limit.
const githubClient = axios.create({
  baseURL: GITHUB_API,
  timeout: 10000, // 10 second timeout to avoid hanging requests
  headers: {
    Accept: 'application/vnd.github+json',
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
    })
  }
});

/**
 * Custom error class so controllers can distinguish
 * "user not found" from generic server/network errors.
 */
class GithubApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'GithubApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Fetch the base profile object for a GitHub username.
 * Throws GithubApiError(404) if the user does not exist.
 */
const fetchUserProfile = async (username) => {
  try {
    const response = await githubClient.get(`/users/${username}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new GithubApiError('GitHub user not found', 404);
    }
    if (error.response && error.response.status === 403) {
      throw new GithubApiError(
        'GitHub API rate limit exceeded. Try again later or add a GITHUB_TOKEN.',
        403
      );
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
      throw new GithubApiError('Network error while contacting GitHub API', 503);
    }
    throw new GithubApiError('Unexpected error while fetching GitHub profile', 500);
  }
};

/**
 * Fetch ALL public repositories for a user, following pagination
 * so accounts with more than 100 repos are still fully analyzed.
 */
const fetchUserRepos = async (username) => {
  let page = 1;
  const perPage = 100;
  let allRepos = [];

  try {
    while (true) {
      const response = await githubClient.get(`/users/${username}/repos`, {
        params: { per_page: perPage, page, sort: 'updated' }
      });

      allRepos = allRepos.concat(response.data);

      // Stop once GitHub returns fewer results than a full page
      if (response.data.length < perPage) break;
      page += 1;

      // Safety cap to avoid excessive calls for extreme edge cases
      if (page > 10) break;
    }
    return allRepos;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      throw new GithubApiError(
        'GitHub API rate limit exceeded. Try again later or add a GITHUB_TOKEN.',
        403
      );
    }
    throw new GithubApiError('Unexpected error while fetching repositories', 500);
  }
};

/**
 * Compute aggregate insights from a list of repository objects.
 * Pure function: no network calls, easy to unit test.
 */
const computeRepoInsights = (repos) => {
  if (!repos || repos.length === 0) {
    return {
      totalRepos: 0,
      totalStars: 0,
      totalForks: 0,
      mostStarredRepo: null,
      mostUsedLanguage: null,
      averageStars: 0,
      averageForks: 0,
      repoNames: []
    };
  }

  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);

  // Find the repo with the highest star count
  const mostStarred = repos.reduce((max, repo) =>
    (repo.stargazers_count || 0) > (max.stargazers_count || 0) ? repo : max
  , repos[0]);

  // Count language occurrences to find the most frequently used one
  const languageCounts = {};
  repos.forEach((repo) => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  });

  let mostUsedLanguage = null;
  let highestCount = 0;
  for (const [language, count] of Object.entries(languageCounts)) {
    if (count > highestCount) {
      highestCount = count;
      mostUsedLanguage = language;
    }
  }

  return {
    totalRepos: repos.length,
    totalStars,
    totalForks,
    mostStarredRepo: mostStarred.stargazers_count > 0 ? mostStarred.name : null,
    mostUsedLanguage,
    averageStars: parseFloat((totalStars / repos.length).toFixed(2)),
    averageForks: parseFloat((totalForks / repos.length).toFixed(2)),
    repoNames: repos.map((repo) => repo.name)
  };
};

/**
 * High level orchestrator: fetches profile + repos, then
 * returns a single combined "analysis" object ready to be
 * persisted to the database.
 */
const analyzeProfile = async (username) => {
  const profile = await fetchUserProfile(username);
  const repos = await fetchUserRepos(username);
  const insights = computeRepoInsights(repos);

  return {
    username: profile.login,
    name: profile.name,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    profileUrl: profile.html_url,
    company: profile.company,
    location: profile.location,
    blog: profile.blog,
    followers: profile.followers,
    following: profile.following,
    publicRepos: profile.public_repos,
    publicGists: profile.public_gists,
    accountCreatedAt: profile.created_at,
    lastGithubUpdate: profile.updated_at,
    ...insights
  };
};

module.exports = {
  githubClient,
  GithubApiError,
  fetchUserProfile,
  fetchUserRepos,
  computeRepoInsights,
  analyzeProfile
};
