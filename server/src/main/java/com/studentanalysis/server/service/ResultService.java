package com.studentanalysis.server.service;

import java.sql.Statement;
import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import com.studentanalysis.server.dto.ResultCreateRequest;
import com.studentanalysis.server.exception.ApiException;
import com.studentanalysis.server.util.SqlExceptionUtils;

@Service
public class ResultService {

    private final JdbcTemplate jdbcTemplate;

    public ResultService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> listResults(Long studentId, String subjectCode) {
        List<String> clauses = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        if (studentId != null) {
            clauses.add("r.student_id = ?");
            params.add(studentId);
        }

        if (subjectCode != null && !subjectCode.isBlank()) {
            clauses.add("sb.subject_code = ?");
            params.add(subjectCode);
        }

        String where = clauses.isEmpty() ? "" : " WHERE " + String.join(" AND ", clauses);

        String sql = """
            SELECT
              r.id,
              r.student_id,
              st.uid,
              st.name AS student_name,
              st.cgpa,
              r.subject_id,
              sb.subject_code,
              sb.subject_name,
              sb.credits,
              r.internal_marks,
              r.external_marks,
              r.total_marks,
              r.grade,
              r.grade_points
            FROM results r
            JOIN students st ON st.id = r.student_id
            JOIN subjects sb ON sb.id = r.subject_id
            """ + where + " ORDER BY st.uid ASC, sb.subject_code ASC";

        return jdbcTemplate.queryForList(sql, params.toArray());
    }

    public Map<String, Object> createResult(ResultCreateRequest request) {
        ensureSubjectExists(request.getSubjectId());
        BigDecimal totalMarks = safe(request.getInternalMarks()).add(safe(request.getExternalMarks()));

        try {
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO results (student_id, subject_id, internal_marks, external_marks, total_marks, grade, grade_points) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
                );
                ps.setLong(1, request.getStudentId());
                ps.setLong(2, request.getSubjectId());
                if (request.getInternalMarks() == null) {
                    ps.setNull(3, Types.DECIMAL);
                } else {
                    ps.setBigDecimal(3, request.getInternalMarks());
                }
                if (request.getExternalMarks() == null) {
                    ps.setNull(4, Types.DECIMAL);
                } else {
                    ps.setBigDecimal(4, request.getExternalMarks());
                }
                ps.setBigDecimal(5, totalMarks);
                ps.setString(6, request.getGrade().trim());
                ps.setBigDecimal(7, request.getGradePoints());
                return ps;
            }, keyHolder);

            Number id = keyHolder.getKey();
            if (id != null) {
                return getResultById(id.longValue());
            }

            return getResultByStudentAndSubject(request.getStudentId(), request.getSubjectId());
        } catch (DataIntegrityViolationException ex) {
            if (SqlExceptionUtils.isDuplicateKey(ex)) {
                throw new ApiException(HttpStatus.CONFLICT, "Result already exists for this student and subject");
            }
            if (SqlExceptionUtils.isForeignKeyViolation(ex)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid student_id or subject_id");
            }
            throw ex;
        }
    }

    public Map<String, Object> upsertResult(
        long studentId,
        long subjectId,
        BigDecimal internalMarks,
        BigDecimal externalMarks,
        String grade,
        BigDecimal gradePoints
    ) {
        ensureSubjectExists(subjectId);

        BigDecimal totalMarks = safe(internalMarks).add(safe(externalMarks));

        try {
            jdbcTemplate.update(
                """
                INSERT INTO results (student_id, subject_id, internal_marks, external_marks, total_marks, grade, grade_points)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  id = LAST_INSERT_ID(id),
                  internal_marks = VALUES(internal_marks),
                  external_marks = VALUES(external_marks),
                  total_marks = VALUES(total_marks),
                  grade = VALUES(grade),
                  grade_points = VALUES(grade_points),
                  updated_at = CURRENT_TIMESTAMP
                """,
                studentId,
                subjectId,
                internalMarks,
                externalMarks,
                totalMarks,
                grade,
                gradePoints
            );
        } catch (DataIntegrityViolationException ex) {
            if (SqlExceptionUtils.isForeignKeyViolation(ex)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid student_id or subject_id");
            }
            throw ex;
        }

        return getResultByStudentAndSubject(studentId, subjectId);
    }

    public void deleteResult(long id) {
        int affected = jdbcTemplate.update("DELETE FROM results WHERE id = ?", id);
        if (affected == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Result not found");
        }
    }

    private void ensureSubjectExists(long subjectId) {
        Long count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM subjects WHERE id = ?",
            Long.class,
            subjectId
        );

        if (count == null || count == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid subject_id");
        }
    }

    private Map<String, Object> getResultById(long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, student_id, subject_id, internal_marks, external_marks, total_marks, grade, grade_points FROM results WHERE id = ?",
            id
        );

        return rows.isEmpty() ? null : rows.get(0);
    }

    private Map<String, Object> getResultByStudentAndSubject(long studentId, long subjectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, student_id, subject_id, internal_marks, external_marks, total_marks, grade, grade_points FROM results WHERE student_id = ? AND subject_id = ?",
            studentId,
            subjectId
        );

        return rows.isEmpty() ? null : rows.get(0);
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
