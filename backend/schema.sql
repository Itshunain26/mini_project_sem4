-- ============================================================
-- Student Mentorship & Guidance Portal - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS mentorship_portal;
USE mentorship_portal;

-- Users (base table for all roles)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'mentor', 'admin') NOT NULL DEFAULT 'student',
    avatar_url VARCHAR(500) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Student Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    major VARCHAR(100),
    year_of_study ENUM('1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'PhD') DEFAULT '1st Year',
    gpa DECIMAL(3,2) DEFAULT NULL,
    institution VARCHAR(200),
    bio TEXT,
    goals TEXT,
    linkedin_url VARCHAR(500) DEFAULT NULL,
    github_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Mentor Profiles
CREATE TABLE IF NOT EXISTS mentor_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    title VARCHAR(150),
    company VARCHAR(200),
    years_experience INT DEFAULT 0,
    expertise_summary TEXT,
    bio TEXT,
    linkedin_url VARCHAR(500) DEFAULT NULL,
    github_url VARCHAR(500) DEFAULT NULL,
    website_url VARCHAR(500) DEFAULT NULL,
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT TRUE,
    max_mentees INT DEFAULT 5,
    total_sessions INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Expertise Categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50) DEFAULT '📚',
    color VARCHAR(20) DEFAULT '#6c63ff',
    description TEXT
);

-- Mentor Category Map (many-to-many)
CREATE TABLE IF NOT EXISTS mentor_categories (
    mentor_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (mentor_id, category_id),
    FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Mentorship Requests
CREATE TABLE IF NOT EXISTS mentorship_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    mentor_id INT NOT NULL,
    message TEXT,
    goals TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    student_id INT NOT NULL,
    mentor_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    scheduled_at DATETIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    meeting_link VARCHAR(500),
    status ENUM('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES mentorship_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Session Feedback
CREATE TABLE IF NOT EXISTS session_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNIQUE NOT NULL,
    given_by INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (given_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Resources
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uploaded_by INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    resource_type ENUM('article', 'video', 'pdf', 'link', 'guide') DEFAULT 'link',
    url VARCHAR(500) NOT NULL,
    category_id INT DEFAULT NULL,
    tags VARCHAR(500),
    is_public BOOLEAN DEFAULT TRUE,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Progress Goals
CREATE TABLE IF NOT EXISTS progress_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    mentor_id INT DEFAULT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE,
    status ENUM('not_started', 'in_progress', 'completed', 'paused') DEFAULT 'not_started',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    milestones JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Categories
INSERT IGNORE INTO categories (name, icon, color, description) VALUES
('Artificial Intelligence', '🤖', '#6c63ff', 'Machine learning, deep learning, NLP, and AI research'),
('Web Development', '🌐', '#00d4aa', 'Frontend, backend, and full-stack development'),
('Data Science', '📊', '#f59e0b', 'Data analysis, visualization, statistics'),
('Career Guidance', '🎯', '#ef4444', 'Resume, interviews, career transitions'),
('Research & Academia', '🔬', '#8b5cf6', 'Research methodology, publications, grad school'),
('Mobile Development', '📱', '#06b6d4', 'iOS, Android, React Native, Flutter'),
('Cloud & DevOps', '☁️', '#10b981', 'AWS, Azure, GCP, Kubernetes, CI/CD'),
('Cybersecurity', '🔐', '#f97316', 'Security, ethical hacking, compliance'),
('Product Management', '📋', '#ec4899', 'Product strategy, roadmaps, user research'),
('Entrepreneurship', '🚀', '#84cc16', 'Startups, funding, business models');

-- Admin user (password: Admin@123)
INSERT IGNORE INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@mentorportal.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
