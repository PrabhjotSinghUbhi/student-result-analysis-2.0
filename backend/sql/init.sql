DROP VIEW IF EXISTS performance_summary;
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS students;

CREATE TABLE IF NOT EXISTS students (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uid VARCHAR(50) NOT NULL,
  name VARCHAR(120) NOT NULL,
  cgpa DECIMAL(4,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_students_uid (uid),
  CONSTRAINT chk_students_cgpa_range CHECK (cgpa IS NULL OR (cgpa >= 0 AND cgpa <= 10))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subjects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_code VARCHAR(50) NOT NULL,
  subject_name VARCHAR(180) NOT NULL,
  credits INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_subjects_subject_code (subject_code),
  CONSTRAINT chk_subjects_credits_positive CHECK (credits > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS results (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  internal_marks DECIMAL(6,2) NULL,
  external_marks DECIMAL(6,2) NULL,
  total_marks DECIMAL(6,2) NULL,
  grade VARCHAR(4) NOT NULL,
  grade_points DECIMAL(4,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_student_subject (student_id, subject_id),
  KEY idx_results_student (student_id),
  KEY idx_results_subject (subject_id),
  CONSTRAINT fk_results_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_results_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT chk_results_internal_nonnegative CHECK (internal_marks IS NULL OR internal_marks >= 0),
  CONSTRAINT chk_results_external_nonnegative CHECK (external_marks IS NULL OR external_marks >= 0),
  CONSTRAINT chk_results_total_nonnegative CHECK (total_marks IS NULL OR total_marks >= 0),
  CONSTRAINT chk_results_grade_points_range CHECK (grade_points >= 0 AND grade_points <= 10)
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW performance_summary AS
SELECT
  r.student_id,
  s.uid,
  s.name,
  s.cgpa,
  ROUND(SUM(r.grade_points * sub.credits) / NULLIF(SUM(sub.credits), 0), 2) AS weighted_grade_points,
  ROUND(AVG(r.total_marks), 2) AS avg_total_marks,
  ROUND(AVG(r.internal_marks), 2) AS avg_internal_marks,
  ROUND(AVG(r.external_marks), 2) AS avg_external_marks
FROM results r
JOIN students s ON s.id = r.student_id
JOIN subjects sub ON sub.id = r.subject_id
GROUP BY r.student_id, s.uid, s.name, s.cgpa;
