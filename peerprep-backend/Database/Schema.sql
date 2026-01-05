-- 1. Problems Table
CREATE TABLE problems(
	problem_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    URL TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL
);

-- 2. Sheets Table
CREATE TABLE sheets(
	sheet_id INT PRIMARY key auto_increment,
    name VARCHAR(100) unique,
    description text
);

/* 1) problem_id is a unique identifier for each problem in the problems table.
	It represents the problem itself and remains the same across all references.

    2) id in the problem_sheets table is the unique primary key for each mapping record between a problem 
    and a sheet. It is auto-incremented and specifically identifies each problem’s placement in a sheet.

    3) The same problem (problem_id) can appear in multiple sheets, so it can have multiple entries in the 
    problem_sheets table. Each entry has a unique id and a sheet_order to define its position in that sheet.
*/
-- 3. Problem - Sheets mapping
CREATE TABLE problem_sheets(
	id INT PRIMARY KEY AUTO_INCREMENT,
    problem_id INT,
    sheet_id INT,
    sheet_order INT,
    -- sheet_title VARCHAR(255),  -- optional, overrides default title
    FOREIGN KEY (problem_id) REFERENCES problems(problem_id),
    FOREIGN KEY (sheet_id) REFERENCES sheets(sheet_id)
);

-- Added new coloumn in problem_sheets
ALTER TABLE problem_sheets
ADD COLUMN sheet_title VARCHAR(255);
