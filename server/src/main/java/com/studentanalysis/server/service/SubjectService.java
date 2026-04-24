package com.studentanalysis.server.service;

import java.sql.PreparedStatement;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import com.studentanalysis.server.dto.SubjectCreateRequest;
import com.studentanalysis.server.exception.ApiException;
import com.studentanalysis.server.util.SqlExceptionUtils;

@Service
public class SubjectService {

    private final JdbcTemplate jdbcTemplate;

    public SubjectService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> listSubjects() {
        return jdbcTemplate.queryForList("SELECT id, subject_code, subject_name, credits FROM subjects ORDER BY subject_code");
    }

    public Map<String, Object> createSubject(SubjectCreateRequest request) {
        try {
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO subjects (subject_code, subject_name, credits) VALUES (?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
                );
                ps.setString(1, request.getSubjectCode().trim());
                ps.setString(2, request.getSubjectName().trim());
                ps.setInt(3, request.getCredits());
                return ps;
            }, keyHolder);

            Number id = keyHolder.getKey();
            if (id == null) {
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT id, subject_code, subject_name, credits FROM subjects WHERE subject_code = ?",
                    request.getSubjectCode().trim()
                );
                if (rows.isEmpty()) {
                    throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
                }
                return rows.get(0);
            }

            return getSubjectById(id.longValue());
        } catch (DataIntegrityViolationException ex) {
            if (SqlExceptionUtils.isDuplicateKey(ex)) {
                throw new ApiException(HttpStatus.CONFLICT, "subject_code already exists");
            }
            throw ex;
        }
    }

    public Map<String, Object> updateSubject(long id, Map<String, Object> payload) {
        Map<String, Object> body = payload == null ? Map.of() : payload;
        List<String> sets = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        if (body.containsKey("subject_code")) {
            Object raw = body.get("subject_code");
            if (!(raw instanceof String value) || value.trim().isEmpty()) {
                throw validationError("subject_code", "subject_code must be a non-empty string");
            }
            sets.add("subject_code = ?");
            params.add(value.trim());
        }

        if (body.containsKey("subject_name")) {
            Object raw = body.get("subject_name");
            if (!(raw instanceof String value) || value.trim().length() < 2) {
                throw validationError("subject_name", "subject_name must have at least 2 characters");
            }
            sets.add("subject_name = ?");
            params.add(value.trim());
        }

        if (body.containsKey("credits")) {
            Integer credits = toPositiveInteger(body.get("credits"), "credits");
            sets.add("credits = ?");
            params.add(credits);
        }

        if (sets.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "At least one field is required");
        }

        String sql = "UPDATE subjects SET " + String.join(", ", sets) + ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        params.add(id);

        try {
            int affected = jdbcTemplate.update(sql, params.toArray());
            if (affected == 0) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Subject not found");
            }
            return getSubjectById(id);
        } catch (DataIntegrityViolationException ex) {
            if (SqlExceptionUtils.isDuplicateKey(ex)) {
                throw new ApiException(HttpStatus.CONFLICT, "subject_code already exists");
            }
            throw ex;
        }
    }

    public void deleteSubject(long id) {
        int affected = jdbcTemplate.update("DELETE FROM subjects WHERE id = ?", id);
        if (affected == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Subject not found");
        }
    }

    private Map<String, Object> getSubjectById(long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, subject_code, subject_name, credits FROM subjects WHERE id = ?",
            id
        );

        if (rows.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Subject not found");
        }

        return rows.get(0);
    }

    private Integer toPositiveInteger(Object value, String field) {
        if (!(value instanceof Number number)) {
            throw validationError(field, field + " must be a positive integer");
        }

        double raw = number.doubleValue();
        if (!Double.isFinite(raw) || raw < 1 || Math.floor(raw) != raw) {
            throw validationError(field, field + " must be a positive integer");
        }

        return (int) raw;
    }

    private ApiException validationError(String field, String message) {
        Map<String, String> item = new LinkedHashMap<>();
        item.put("field", field);
        item.put("message", message);
        return new ApiException(HttpStatus.BAD_REQUEST, "Validation failed", List.of(item));
    }
}
