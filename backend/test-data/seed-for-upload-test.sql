-- Test seed with students and subjects for quick local validation

INSERT INTO students (uid, name, cgpa)
VALUES
  ('24BCS11001', 'Student 001', 6.29),
  ('24BCS11002', 'Student 002', 6.38),
  ('24BCS11003', 'Student 003', 6.47),
  ('24BCS11004', 'Student 004', 6.56),
  ('24BCS11005', 'Student 005', 6.65),
  ('24BCS11006', 'Student 006', 6.74),
  ('24BCS11007', 'Student 007', 6.83),
  ('24BCS11008', 'Student 008', 6.92),
  ('24BCS11009', 'Student 009', 7.01),
  ('24BCS11010', 'Student 010', 7.10),
  ('24BCS11011', 'Student 011', 7.19),
  ('24BCS11012', 'Student 012', 7.28),
  ('24BCS11013', 'Student 013', 7.37),
  ('24BCS11014', 'Student 014', 7.46),
  ('24BCS11015', 'Student 015', 7.55),
  ('24BCS11016', 'Student 016', 7.64),
  ('24BCS11017', 'Student 017', 7.73),
  ('24BCS11018', 'Student 018', 7.82),
  ('24BCS11019', 'Student 019', 7.91),
  ('24BCS11020', 'Student 020', 8.00),
  ('24BCS11021', 'Student 021', 8.09),
  ('24BCS11022', 'Student 022', 8.18),
  ('24BCS11023', 'Student 023', 8.27),
  ('24BCS11024', 'Student 024', 8.36),
  ('24BCS11025', 'Student 025', 8.45),
  ('24BCS11026', 'Student 026', 8.54),
  ('24BCS11027', 'Student 027', 8.63),
  ('24BCS11028', 'Student 028', 8.72),
  ('24BCS11029', 'Student 029', 8.81),
  ('24BCS11030', 'Student 030', 8.90)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  cgpa = VALUES(cgpa);

INSERT INTO subjects (subject_code, subject_name, credits)
VALUES
  ('24CSH-202', 'Advanced Data Structures and Algorithms', 4.0),
  ('24CSH-204', 'Database Management System', 4.0),
  ('24CSP-203', 'Python Programming', 2.0),
  ('24CST-201', 'Computer Organization and Architecture', 3.0),
  ('24SMT-242', 'Discrete Mathematics', 4.0),
  ('24GPT-121', 'General Proficiency-1', 1.0),
  ('24TDP-211', 'Soft Skills-1', 1.0),
  ('24UCI-203', 'Social Internship', 2.0),
  ('24UCT-296', 'Universal Human Values, Ethics and Life Skills-2', 2.0)
ON DUPLICATE KEY UPDATE
  subject_name = VALUES(subject_name),
  credits = VALUES(credits);
