-- Adding Sheets Names
INSERT INTO sheets (name, description) 
VALUES ('Striver''s SDE', 'Striver’s SDE DSA Sheet');

INSERT INTO sheets (name,description)
VALUES ('NC150','NeetCode''s 150 DSA Sheet');

-- Adding problems to database.
INSERT INTO problems (title, url, platform, difficulty, category)
VALUES ('Two Sum', 'https://leetcode.com/problems/two-sum/', 'LeetCode', 'Easy', 'Array');

INSERT INTO problems (title, url, platform, difficulty, category)
VALUES ('Contains Duplicate', 'https://leetcode.com/problems/contains-duplicate/', 'LeetCode', 'Easy', 'Array');

INSERT INTO problems (title, url, platform, difficulty, category)
VALUES ('Valid Anagram', 'https://leetcode.com/problems/valid-anagram/', 'LeetCode', 'Easy', 'Array');

-- Updated problem's category from "Array" to "Arrays"
UPDATE problems
SET category = 'Arrays'
WHERE problem_id = 1;

UPDATE problems
SET category = 'Arrays'
WHERE problem_id = 2;

UPDATE problems
SET category = 'Arrays'
WHERE problem_id = 3;

-- Associating problems added with order followed in the sheet.
INSERT INTO problem_sheets (problem_id, sheet_id, sheet_order)
VALUES (1, 2, 3); -- Two Sum is 3rd problem in NC150

INSERT INTO problem_sheets (problem_id, sheet_id, sheet_order)
VALUES (2, 2, 1);

-- Problem with ID = 3 was inserted as the 3nd problem in NC150 Sheet, but it should be the 2nd problem
INSERT INTO problem_sheets (problem_id, sheet_id, sheet_order)
VALUES (3, 2, 3);

-- Updating problem back to its correct position as the 2nd problem in NC150 Sheet
UPDATE problem_sheets
SET sheet_order = 2 WHERE problem_id = 3 AND sheet_id = 2;