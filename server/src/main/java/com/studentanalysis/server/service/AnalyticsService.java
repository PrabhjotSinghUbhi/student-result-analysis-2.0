package com.studentanalysis.server.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {

    private final JdbcTemplate jdbcTemplate;

    public AnalyticsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> getDashboardStats() {
        String summarySql = """
            SELECT
              COUNT(DISTINCT r.student_id) AS students_count,
              COUNT(DISTINCT r.subject_id) AS subjects_count,
              ROUND(AVG(r.internal_marks), 2) AS avg_internal,
              ROUND(AVG(r.external_marks), 2) AS avg_external,
              ROUND(AVG(r.grade_points), 2) AS avg_grade_points,
              ROUND(AVG(st.cgpa), 2) AS avg_cgpa
            FROM results r
            JOIN students st ON st.id = r.student_id
            """;

        String atRiskSql = """
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
            """;

        String toppersSql = """
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
            """;

        String gradeDistributionSql = """
            SELECT
              r.grade AS bucket,
              COUNT(*) AS count
            FROM results r
            GROUP BY r.grade
            ORDER BY FIELD(r.grade, 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F')
            """;

        String passRateBySubjectSql = """
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
            """;

        String subjectMetricsSql = """
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
            """;

        String topStudentsSql = """
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
            """;

        String scoreCurveSql = """
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
            """;

        List<Map<String, Object>> summaryRows = jdbcTemplate.queryForList(summarySql);
        List<Map<String, Object>> atRisk = jdbcTemplate.queryForList(atRiskSql);
        List<Map<String, Object>> toppers = jdbcTemplate.queryForList(toppersSql);
        List<Map<String, Object>> gradeDistribution = jdbcTemplate.queryForList(gradeDistributionSql);
        List<Map<String, Object>> passRateBySubject = jdbcTemplate.queryForList(passRateBySubjectSql);
        List<Map<String, Object>> bellCurve = jdbcTemplate.queryForList(scoreCurveSql);
        List<Map<String, Object>> subjectMetrics = jdbcTemplate.queryForList(subjectMetricsSql);
        List<Map<String, Object>> topStudents = jdbcTemplate.queryForList(topStudentsSql);

        Map<String, Object> summary = summaryRows.isEmpty() ? defaultSummary() : summaryRows.get(0);

        Map<String, Object> topByAvgGradePoints = pickExtreme(subjectMetrics, "avg_grade_points", true);
        Map<String, Object> weakestByAvgGradePoints = pickExtreme(subjectMetrics, "avg_grade_points", false);
        Map<String, Object> highestPassRate = pickExtreme(subjectMetrics, "pass_rate", true);
        Map<String, Object> lowestPassRate = pickExtreme(subjectMetrics, "pass_rate", false);
        Map<String, Object> mostVolatileSubject = pickExtreme(subjectMetrics, "grade_points_stddev", true);

        double overallPassRate = 0;
        if (!passRateBySubject.isEmpty()) {
            double total = 0;
            for (Map<String, Object> row : passRateBySubject) {
                total += number(row.get("pass_rate"));
            }
            overallPassRate = Math.round((total / passRateBySubject.size()) * 100.0) / 100.0;
        }

        Map<String, Object> insights = new LinkedHashMap<>();
        insights.put("overall_pass_rate", overallPassRate);
        insights.put("strongest_subject", topByAvgGradePoints);
        insights.put("toughest_subject", weakestByAvgGradePoints);
        insights.put("best_pass_subject", highestPassRate);
        insights.put("weakest_pass_subject", lowestPassRate);
        insights.put("most_volatile_subject", mostVolatileSubject);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("summary", summary);
        response.put("atRisk", atRisk);
        response.put("toppers", toppers);
        response.put("gradeDistribution", gradeDistribution);
        response.put("passRateBySubject", passRateBySubject);
        response.put("bellCurve", bellCurve);
        response.put("subjectMetrics", subjectMetrics);
        response.put("topStudents", topStudents);
        response.put("insights", insights);
        return response;
    }

    public List<Map<String, Object>> getStudentTrend(long studentId) {
        return jdbcTemplate.queryForList(
            """
            SELECT
              sb.subject_code,
              sb.subject_name,
              r.internal_marks,
              r.external_marks,
              r.total_marks,
              r.grade_points
            FROM results r
            JOIN subjects sb ON sb.id = r.subject_id
            WHERE r.student_id = ?
            ORDER BY sb.subject_code ASC
            """,
            studentId
        );
    }

    private Map<String, Object> pickExtreme(List<Map<String, Object>> rows, String key, boolean descending) {
        if (rows.isEmpty()) {
            return null;
        }

        List<Map<String, Object>> copy = new ArrayList<>(rows);
        Comparator<Map<String, Object>> comparator = Comparator.comparingDouble(item -> number(item.get(key)));
        copy.sort(descending ? comparator.reversed() : comparator);
        return copy.get(0);
    }

    private double number(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private Map<String, Object> defaultSummary() {
        Map<String, Object> defaultSummary = new LinkedHashMap<>();
        defaultSummary.put("students_count", 0);
        defaultSummary.put("subjects_count", 0);
        defaultSummary.put("avg_internal", 0);
        defaultSummary.put("avg_external", 0);
        defaultSummary.put("avg_grade_points", 0);
        defaultSummary.put("avg_cgpa", 0);
        return defaultSummary;
    }
}
