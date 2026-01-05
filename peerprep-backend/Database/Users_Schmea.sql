CREATE TABLE users(
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username  VARCHAR(255) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    /* 
        NOT NULL is used even when DEFAULT is specified because DEFAULT only provides a value when none is given during insertion. 
        However, if a user tries to update that column with NULL, the NOT NULL constraint will prevent the change and stop the 
        value from becoming NULL.
    */
    time_created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    time_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_role ENUM('Student', 'Working Professional', 'Admin') NOT NULL DEFAULT 'Student',
    acc_status ENUM('Active', 'Inactive', 'Suspended')  NOT NULL DEFAULT'Active'
);

CREATE TABLE user_progress(
    progress_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    problem_status ENUM('Solved', 'Unsolved', 'Skipped', 'Attempted') DEFAULT 'Unsolved',
    time_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (problem_id) REFERENCES problems(problem_id),
    UNIQUE (user_id, problem_id)
);

CREATE TABLE reflections (
    reflection_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NULL,
    reflection_text TEXT NOT NULL,
    sentiment ENUM('Positive', 'Neutral', 'Negative') DEFAULT 'Neutral',
    keywords TEXT,
    confidence_score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(problem_id) ON DELETE SET NULL
);

-- Removed skipped option in problem_status
ALTER TABLE user_progress 
MODIFY problem_status ENUM('Solved', 'Unsolved', 'Attempted') DEFAULT 'Unsolved';

DESCRIBE user_progress;

-- Made problem_status NOT NULL 
ALTER TABLE user_progress
MODIFY problem_status ENUM('Solved', 'Unsolved', 'Attempted') NOT NULL DEFAULT 'Unsolved';

ALTER TABLE reflections
ADD UNIQUE KEY unique_user_problem (user_id, problem_id);


-- Added OTP Verifications Table
CREATE TABLE otp_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 5 MINUTE)
);
