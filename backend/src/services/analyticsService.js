import { query } from "../db/pool.js";

export async function getDashboardStats() {
  const values = [];

  const summarySql = `
    SELECT
      COUNT(DISTINCT r.student_id) AS students_count,
      COUNT(DISTINCT r.subject_id) AS subjects_count,
      ROUND(AVG(r.internal_marks), 2) AS avg_internal,
      ROUND(AVG(r.external_marks), 2) AS avg_external,
      ROUND(AVG(r.grade_points), 2) AS avg_grade_points,
      ROUND(AVG(st.cgpa), 2) AS avg_cgpa
    FROM results r
    JOIN students st ON st.id = r.student_id
  `;

  const atRiskSql = `
    SELECT
      st.id,
      st.uid,
      st.name,
      ROUND(AVG(r.grade_points), 2) AS avg_grade_points,
      SUM(CASE WHEN r.grade_points < 5 THEN 1 ELSE 0 END) AS low_grade_subjects
    FROM results r
    JOIN students st ON st.id = r.student_id
    GROUP BY st.id, st.uid, st.name
    HAVING AVG(r.grade_points) < 6 OR SUM(CASE WHEN r.grade_points < 5 THEN 1 ELSE 0 END) >= 2
    ORDER BY avg_grade_points ASC, low_grade_subjects DESC, st.uid ASC
  `;

  const toppersSql = `
    WITH ranked AS (
      SELECT
        sb.id AS subject_id,
        sb.subject_code,
        sb.subject_name,
        st.id AS student_id,
        st.uid,
        st.name,
        r.grade,
        r.grade_points,
        r.total_marks,
        ROW_NUMBER() OVER (
          PARTITION BY sb.id
          ORDER BY r.grade_points DESC, r.total_marks DESC, st.uid ASC
        ) AS rn
      FROM results r
      JOIN subjects sb ON sb.id = r.subject_id
      JOIN students st ON st.id = r.student_id
    )
    SELECT subject_id, subject_code, subject_name, student_id, uid, name, grade, grade_points, total_marks
    FROM ranked
    WHERE rn = 1
    ORDER BY subject_code ASC
  `;

  const gradeDistributionSql = `
    SELECT
      r.grade AS bucket,
      COUNT(*) AS count
    FROM results r
    GROUP BY r.grade
    ORDER BY FIELD(r.grade, 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F')
  `;

  const passRateBySubjectSql = `
    SELECT
      sb.subject_code,
      sb.subject_name,
      ROUND(
        100.0 * SUM(CASE WHEN r.grade_points >= 6 THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0), 2
      ) AS pass_rate
    FROM results r
    JOIN subjects sb ON sb.id = r.subject_id
    GROUP BY sb.subject_code, sb.subject_name
    ORDER BY sb.subject_code ASC
  `;

  const subjectMetricsSql = `
    SELECT
      sb.subject_code,
      sb.subject_name,
      sb.credits,
      COUNT(*) AS attempts,
      ROUND(AVG(r.internal_marks), 2) AS avg_internal,
      ROUND(AVG(r.external_marks), 2) AS avg_external,
      ROUND(AVG(r.total_marks), 2) AS avg_total,
      ROUND(AVG(r.grade_points), 2) AS avg_grade_points,
      ROUND(STDDEV_POP(r.grade_points), 2) AS grade_points_stddev,
      ROUND(100.0 * SUM(CASE WHEN r.grade_points >= 6 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) AS pass_rate,
      SUM(CASE WHEN r.grade_points >= 9 THEN 1 ELSE 0 END) AS high_achievers,
      SUM(CASE WHEN r.grade_points < 6 THEN 1 ELSE 0 END) AS low_achievers
    FROM results r
    JOIN subjects sb ON sb.id = r.subject_id
    GROUP BY sb.subject_code, sb.subject_name, sb.credits
    ORDER BY sb.subject_code ASC
  `;

  const topStudentsSql = `
    SELECT
      st.id,
      st.uid,
      st.name,
      st.cgpa,
      ROUND(SUM(r.grade_points * sb.credits) / NULLIF(SUM(sb.credits), 0), 2) AS weighted_grade_points,
      ROUND(AVG(r.total_marks), 2) AS avg_total,
      ROUND(STDDEV_POP(r.total_marks), 2) AS total_marks_stddev,
      SUM(CASE WHEN r.grade_points >= 9 THEN 1 ELSE 0 END) AS high_grades_count,
      COUNT(*) AS subjects_count
    FROM results r
    JOIN students st ON st.id = r.student_id
    JOIN subjects sb ON sb.id = r.subject_id
    GROUP BY st.id, st.uid, st.name, st.cgpa
    ORDER BY weighted_grade_points DESC, avg_total DESC, st.uid ASC
    LIMIT 20
  `;

  const scoreCurveSql = `
    SELECT
      CASE
        WHEN t.total_marks < 40 THEN '0-39'
        WHEN t.total_marks < 50 THEN '40-49'
        WHEN t.total_marks < 60 THEN '50-59'
        WHEN t.total_marks < 70 THEN '60-69'
        WHEN t.total_marks < 80 THEN '70-79'
        WHEN t.total_marks < 90 THEN '80-89'
        ELSE '90-100+'
      END AS bucket,
      COUNT(*) AS count
    FROM results t
    GROUP BY bucket
    ORDER BY bucket
  `;

  const [
    summary,
    atRisk,
    toppers,
    gradeDistribution,
    passRateBySubject,
    bellCurve,
    subjectMetrics,
    topStudents,
  ] = await Promise.all([
    query(summarySql, values),
    query(atRiskSql, values),
    query(toppersSql, values),
    query(gradeDistributionSql, values),
    query(passRateBySubjectSql, values),
    query(scoreCurveSql, values),
    query(subjectMetricsSql, values),
    query(topStudentsSql, values),
  ]);

  const subjectRows = subjectMetrics.rows;
  const topByAvgGradePoints = [...subjectRows]
    .sort((a, b) => Number(b.avg_grade_points) - Number(a.avg_grade_points))[0] || null;
  const weakestByAvgGradePoints = [...subjectRows]
    .sort((a, b) => Number(a.avg_grade_points) - Number(b.avg_grade_points))[0] || null;
  const highestPassRate = [...subjectRows]
    .sort((a, b) => Number(b.pass_rate) - Number(a.pass_rate))[0] || null;
  const lowestPassRate = [...subjectRows]
    .sort((a, b) => Number(a.pass_rate) - Number(b.pass_rate))[0] || null;
  const mostVolatileSubject = [...subjectRows]
    .sort((a, b) => Number(b.grade_points_stddev || 0) - Number(a.grade_points_stddev || 0))[0] || null;

  const overallPassRate = passRateBySubject.rows.length
    ? Number(
        (
          passRateBySubject.rows.reduce((sum, r) => sum + Number(r.pass_rate || 0), 0) /
          passRateBySubject.rows.length
        ).toFixed(2)
      )
    : 0;

  return {
    summary: summary.rows[0] || {
      students_count: 0,
      subjects_count: 0,
      avg_internal: 0,
      avg_external: 0,
      avg_grade_points: 0,
      avg_cgpa: 0,
    },
    atRisk: atRisk.rows,
    toppers: toppers.rows,
    gradeDistribution: gradeDistribution.rows,
    passRateBySubject: passRateBySubject.rows,
    bellCurve: bellCurve.rows,
    subjectMetrics: subjectRows,
    topStudents: topStudents.rows,
    insights: {
      overall_pass_rate: overallPassRate,
      strongest_subject: topByAvgGradePoints,
      toughest_subject: weakestByAvgGradePoints,
      best_pass_subject: highestPassRate,
      weakest_pass_subject: lowestPassRate,
      most_volatile_subject: mostVolatileSubject,
    },
  };
}

export async function getStudentTrend(studentId) {
  const { rows } = await query(
    `SELECT
      sb.subject_code,
      sb.subject_name,
      r.internal_marks,
      r.external_marks,
      r.total_marks,
      r.grade_points
     FROM results r
     JOIN subjects sb ON sb.id = r.subject_id
     WHERE r.student_id = ?
     ORDER BY sb.subject_code ASC`,
    [studentId]
  );

  return rows;
}
