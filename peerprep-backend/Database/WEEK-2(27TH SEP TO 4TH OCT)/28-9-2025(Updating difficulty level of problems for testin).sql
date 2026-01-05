-- Updating the difficulty types of problem for testing
UPDATE problems
SET difficulty = 'Medium'
WHERE problem_id = 2;

UPDATE problems
SET difficulty = 'Hard'
WHERE problem_id = 3;

-- Reverting back to original difficulty of problems
UPDATE problems
SET difficulty = 'Easy'
WHERE problem_id = 1 OR problem_id = 2;

-- Get problem by ID
SELECT * FROM problems where problem_id = 1;