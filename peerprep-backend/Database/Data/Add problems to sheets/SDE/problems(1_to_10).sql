-- Inserting problems that are only part of SDE Sheeet
INSERT INTO problem_sheets(problem_id, sheet_id, sheet_order)
VALUES (12,1,1),
(13,1,2),
(14,1,3),
(16,1,5),
(20,1,9);

-- Inserting problems that are common in both sheets with sheet specific title
INSERT INTO problem_sheets(problem_id, sheet_id, sheet_order, sheet_title)
VALUES (21,1,10,'Find the duplicate in an array of N+1 integers'),
(15,1,4,'Kadane''s Algorithm'),
(17,1,6,'Stock Buy and Sell'),
(18,1,7,'Rotate Matrix'),
(19,1,8,'Merge Overlapping Subintervals');