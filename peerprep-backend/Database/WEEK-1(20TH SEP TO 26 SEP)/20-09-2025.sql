-- 1) Get all problems for a given sheet.(let the sheet required be NC150) i.e sheet 2
SELECT * FROM problem_sheets
WHERE sheet_id = 2;

-- 2) Get problems by difficulty.(We are getting problems whose difficulty level is easy)
SELECT * FROM problems 
WHERE difficulty = 'easy';

-- 3) Count problems per difficulty in a sheet.
SELECT p.difficulty, COUNT(*) AS total_problems
FROM problem_sheets ps
JOIN problems p ON ps.problem_id = p.problem_id
WHERE ps.sheet_id = 2     -- change 2 to whichever sheet you’re testing
GROUP BY p.difficulty;
