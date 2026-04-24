package com.studentanalysis.server.service;

import java.sql.PreparedStatement;
import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Types;
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

import com.studentanalysis.server.dto.StudentCreateRequest;
import com.studentanalysis.server.exception.ApiException;
import com.studentanalysis.server.util.SqlExceptionUtils;

@Service
public class StudentService {

    private final JdbcTemplate jdbcTemplate;

    public StudentService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> listStudents() {
        return jdbcTemplate.queryForList("SELECT id, uid, name, cgpa FROM students ORDER BY uid");
    }

    public Map<String, Object> getStudentById(long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, uid, name, cgpa FROM students WHERE id = ?",
            id
        );

        if (rows.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Student not found");
        }

        return rows.get(0);
    }

    public Map<String, Object> createStudent(StudentCreateRequest request) {
        try {
            KeyHolder keyHolder = new GeneratedKeyHolder();

            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO students (uid, name, cgpa) VALUES (?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
                );
                ps.setString(1, request.getUid().trim());
                ps.setString(2, request.getName().trim());
                if (request.getCgpa() == null) {
                    ps.setNull(3, Types.DECIMAL);
                } else {
                    ps.setBigDecimal(3, request.getCgpa());
                }
                return ps;
            }, keyHolder);

            Number id = keyHolder.getKey();
            if (id != null) {
                return getStudentById(id.longValue());
            }

            List<Map<String, Object>> fallbackRows = jdbcTemplate.queryForList(
                "SELECT id, uid, name, cgpa FROM students WHERE uid = ?",
                request.getUid().trim()
            );
            if (fallbackRows.isEmpty()) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
            }
            return fallbackRows.get(0);
        } catch (DataIntegrityViolationException ex) {
            if (SqlExceptionUtils.isDuplicateKey(ex)) {
                throw new ApiException(HttpStatus.CONFLICT, "uid already exists");
            }
            throw ex;
        }
    }

    public Map<String, Object> updateStudent(long id, Map<String, Object> payload) {
        Map<String, Object> body = payload == null ? Map.of() : payload;
        List<String> sets = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        if (body.containsKey("uid")) {
            Object raw = body.get("uid");
            if (!(raw instanceof String uid) || uid.trim().isEmpty()) {
                throw validationError("uid", "uid must be a non-empty string");
            }
            sets.add("uid = ?");
            params.add(uid.trim());
        }

        if (body.containsKey("name")) {
            Object raw = body.get("name");
            if (!(raw instanceof String name) || name.trim().length() < 2) {
                throw validationError("name", "name must have at least 2 characters");
            }
            sets.add("name = ?");
            params.add(raw.toString().trim());
        }

        if (body.containsKey("cgpa")) {
            BigDecimal cgpa = toBigDecimalAllowNull(body.get("cgpa"), "cgpa");
            if (cgpa != null && (cgpa.compareTo(BigDecimal.ZERO) < 0 || cgpa.compareTo(BigDecimal.TEN) > 0)) {
                throw validationError("cgpa", "cgpa must be between 0 and 10");
            }
            sets.add("cgpa = ?");
            params.add(cgpa);
        }

        if (sets.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "At least one field is required");
        }

        String sql = "UPDATE students SET " + String.join(", ", sets) + ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        params.add(id);

        try {
            int affected = jdbcTemplate.update(sql, params.toArray());
            if (affected == 0) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Student not found");
            }
            return getStudentById(id);
        } catch (DataIntegrityViolationException ex) {
            if (SqlExceptionUtils.isDuplicateKey(ex)) {
                throw new ApiException(HttpStatus.CONFLICT, "uid already exists");
            }
            throw ex;
        }
    }

    public void deleteStudent(long id) {
        int affected = jdbcTemplate.update("DELETE FROM students WHERE id = ?", id);
        if (affected == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Student not found");
        }
    }

    private BigDecimal toBigDecimalAllowNull(Object value, String field) {
        if (value == null) {
            return null;
        }

        if (!(value instanceof Number) && !(value instanceof String)) {
            throw validationError(field, field + " must be a number");
        }

        try {
            String str = String.valueOf(value).trim();
            if (str.isEmpty()) {
                return null;
            }
            return new BigDecimal(str);
        } catch (NumberFormatException ex) {
            throw validationError(field, field + " must be a number");
        }
    }

    private ApiException validationError(String field, String message) {
        Map<String, String> item = new LinkedHashMap<>();
        item.put("field", field);
        item.put("message", message);
        return new ApiException(HttpStatus.BAD_REQUEST, "Validation failed", List.of(item));
    }
}
