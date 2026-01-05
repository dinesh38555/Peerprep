-- Added from 4th to 10th problems in NC150 Sheet
-- Sample problems file contain first 3 problems in NC150 Sheet
INSERT INTO problems(title,url,platform,difficulty,category)
VALUES ("Group Anagrams","https://leetcode.com/problems/group-anagrams/","LeetCode","Medium","Arrays");

INSERT INTO problems(title,url,platform,difficulty,category)
VALUES ("Top K Frequent Elements","https://leetcode.com/problems/top-k-frequent-elements/","LeetCode","Medium","Arrays");

INSERT INTO problems(title,url,platform,difficulty,category)
VALUES ("Encode and Decode Strings","https://leetcode.com/problems/encode-and-decode-strings/","LeetCode","Medium","Arrays");

INSERT INTO problems(title,url,platform,difficulty,category)
VALUES ("Product of Array Except Self","https://leetcode.com/problems/product-of-array-except-self/","LeetCode","Medium","Arrays");

INSERT INTO problems(title,url,platform,difficulty,category)
VALUES ("Valid Sudoku","https://leetcode.com/problems/valid-sudoku/","LeetCode","Medium","Arrays");

INSERT INTO problems(title,url,platform,difficulty,category)
VALUES ("Longest Consecutive Sequence","https://leetcode.com/problems/longest-consecutive-sequence/","LeetCode","Medium","Arrays");

INSERT INTO problems(title,url,platform,difficulty,category)
VALUES ("Valid Palindrome","https://leetcode.com/problems/valid-palindrome/","LeetCode","Easy","Two Pointers");

-- Fixing error of using " " instead of ' '
UPDATE problems
SET title = REPLACE(title, '"', "'"),
    url = REPLACE(url, '"', "'"),
    platform = REPLACE(platform, '"', "'"),
    difficulty = REPLACE(difficulty, '"', "'"),
    category = REPLACE(category, '"', "'")
WHERE problem_id > 0;
