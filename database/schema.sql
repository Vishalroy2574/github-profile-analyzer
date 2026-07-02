-- ============================================================
-- GitHub Profile Analyzer - Database Schema
-- ============================================================
-- Run this file to create the database and required table.
-- Usage: mysql -u root -p < database/schema.sql
-- ============================================================

-- Create the database if it doesn't already exist
CREATE DATABASE IF NOT EXISTS github_profile_analyzer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE github_profile_analyzer;

-- ============================================================
-- Table: github_profiles
-- Stores analyzed GitHub profile data and computed repo stats
-- ============================================================
CREATE TABLE IF NOT EXISTS github_profiles (
    id                  INT AUTO_INCREMENT PRIMARY KEY,

    -- Core profile fields
    username            VARCHAR(255)  NOT NULL UNIQUE,
    name                VARCHAR(255)  DEFAULT NULL,
    bio                 TEXT          DEFAULT NULL,
    avatar_url          VARCHAR(500)  DEFAULT NULL,
    profile_url         VARCHAR(500)  DEFAULT NULL,
    company             VARCHAR(255)  DEFAULT NULL,
    location            VARCHAR(255)  DEFAULT NULL,
    blog                VARCHAR(500)  DEFAULT NULL,

    -- Profile counters (from GitHub API)
    followers           INT           DEFAULT 0,
    following            INT          DEFAULT 0,
    public_repos        INT           DEFAULT 0,
    public_gists        INT           DEFAULT 0,

    -- Computed repository insights
    total_stars         INT           DEFAULT 0,
    total_forks          INT          DEFAULT 0,
    most_used_language  VARCHAR(100)  DEFAULT NULL,
    most_starred_repo   VARCHAR(255)  DEFAULT NULL,
    average_stars       DECIMAL(10,2) DEFAULT 0.00,
    average_forks       DECIMAL(10,2) DEFAULT 0.00,

    -- GitHub account timestamps
    account_created_at  DATETIME      DEFAULT NULL,
    last_github_update  DATETIME      DEFAULT NULL,

    -- Local record timestamps
    last_analyzed_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,
    created_at          DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes for common query patterns
    INDEX idx_username (username),
    INDEX idx_followers (followers),
    INDEX idx_public_repos (public_repos),
    INDEX idx_last_analyzed_at (last_analyzed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
