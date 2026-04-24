package com.studentanalysis.server.service;

import com.studentanalysis.server.dto.UploadSummaryResponse;
import com.studentanalysis.server.exception.ApiException;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UploadService {

    private final JdbcTemplate jdbcTemplate;
    private final ResultService resultService;

    public UploadService(JdbcTemplate jdbcTemplate, ResultService resultService) {
        this.jdbcTemplate = jdbcTemplate;
        this.resultService = resultService;
    }

    public UploadSummaryResponse processBulkUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No file provided");
        }

        String originalName = file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();
        String lowerName = originalName.toLowerCase(Locale.ROOT);

        List<Map<String, Object>> rows;
        if (lowerName.endsWith(".csv")) {
            rows = parseCsv(file);
        } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
            rows = parseExcel(file);
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported file format. Use CSV or Excel files");
        }

        UploadSummaryResponse result = new UploadSummaryResponse();
        result.setFileName(originalName);
        result.setTotalRows(rows.size());

        for (int i = 0; i < rows.size(); i++) {
            int rowNum = i + 2;

            try {
                NormalizedUploadRow row = normalizeRow(rows.get(i));
                validateRow(row);

                Long studentId = upsertStudent(row.uid(), row.name(), row.cgpa());
                if (studentId == null) {
                    throw new IllegalStateException("Unable to upsert student '" + row.uid() + "'");
                }

                Long subjectId = upsertSubject(row.subjectCode(), row.subjectName(), row.credits());
                if (subjectId == null) {
                    throw new IllegalStateException("Unable to upsert subject '" + row.subjectCode() + "'");
                }

                resultService.upsertResult(
                    studentId,
                    subjectId,
                    row.internalMarks(),
                    row.externalMarks(),
                    row.grade(),
                    row.gradePoints()
                );

                result.setImported(result.getImported() + 1);
            } catch (Exception ex) {
                result.setFailed(result.getFailed() + 1);
                result.getErrors().add(new UploadSummaryResponse.UploadSummaryError(rowNum, ex.getMessage()));
            }
        }

        return result;
    }

    private List<Map<String, Object>> parseCsv(MultipartFile file) {
        try {
            String text = new String(file.getBytes(), StandardCharsets.UTF_8);
            CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setTrim(true)
                .build();

            List<Map<String, Object>> rows = new ArrayList<>();
            try (CSVParser parser = CSVParser.parse(text, format)) {
                List<String> headers = parser.getHeaderNames();
                for (CSVRecord record : parser) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (String header : headers) {
                        row.put(normalizeHeaderKey(header), record.get(header));
                    }
                    rows.add(row);
                }
            }
            return rows;
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unable to read uploaded file");
        }
    }

    private List<Map<String, Object>> parseExcel(MultipartFile file) {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            if (workbook.getNumberOfSheets() == 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Uploaded workbook has no sheet");
            }

            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            if (headerRow == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Uploaded workbook has no sheet");
            }

            DataFormatter formatter = new DataFormatter();
            List<String> headers = new ArrayList<>();
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                headers.add(normalizeHeaderKey(formatter.formatCellValue(headerRow.getCell(i))));
            }

            List<Map<String, Object>> rows = new ArrayList<>();
            for (int rowIndex = sheet.getFirstRowNum() + 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row rowRef = sheet.getRow(rowIndex);
                if (rowRef == null) {
                    continue;
                }

                Map<String, Object> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.size(); i++) {
                    String header = headers.get(i);
                    if (header == null || header.isBlank()) {
                        continue;
                    }
                    row.put(header, formatter.formatCellValue(rowRef.getCell(i)));
                }
                rows.add(row);
            }

            return rows;
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unable to read uploaded file");
        }
    }

    private String normalizeHeaderKey(String value) {
        return String.valueOf(value == null ? "" : value)
            .replace("\uFEFF", "")
            .replaceAll("\\s+", "_")
            .replaceAll("-+", "_")
            .trim()
            .toLowerCase(Locale.ROOT);
    }

    private NormalizedUploadRow normalizeRow(Map<String, Object> row) {
        return new NormalizedUploadRow(
            trimmed(row.get("uid")),
            trimmed(row.get("name")),
            toNullableNumber(row.get("cgpa")),
            trimmed(row.get("subject_code")),
            trimmed(row.get("subject_name")),
            toNullableNumber(row.get("credits")),
            toNullableNumber(firstNonNull(row.get("internal"), row.get("internal_marks"))),
            toNullableNumber(firstNonNull(row.get("external"), row.get("external_marks"))),
            trimmed(row.get("grade")),
            toNullableNumber(row.get("grade_points"))
        );
    }

    private void validateRow(NormalizedUploadRow row) {
        if (isBlank(row.uid()) || isBlank(row.name()) || isBlank(row.subjectCode()) || isBlank(row.subjectName()) || isBlank(row.grade())) {
            throw new IllegalArgumentException("uid, name, subject_code, subject_name and grade are required");
        }

        if (row.credits() == null || row.credits().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("credits must be a positive number");
        }

        if (row.gradePoints() == null
            || row.gradePoints().compareTo(BigDecimal.ZERO) < 0
            || row.gradePoints().compareTo(BigDecimal.TEN) > 0) {
            throw new IllegalArgumentException("grade_points must be between 0 and 10");
        }
    }

    private Long upsertStudent(String uid, String name, BigDecimal cgpa) {
        jdbcTemplate.update(
            """
            INSERT INTO students (uid, name, cgpa)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
              id = LAST_INSERT_ID(id),
              name = VALUES(name),
              cgpa = VALUES(cgpa),
              updated_at = CURRENT_TIMESTAMP
            """,
            uid,
            name,
            cgpa
        );

        return jdbcTemplate.queryForObject("SELECT id FROM students WHERE uid = ?", Long.class, uid);
    }

    private Long upsertSubject(String subjectCode, String subjectName, BigDecimal credits) {
        jdbcTemplate.update(
            """
            INSERT INTO subjects (subject_code, subject_name, credits)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
              id = LAST_INSERT_ID(id),
              subject_name = VALUES(subject_name),
              credits = VALUES(credits),
              updated_at = CURRENT_TIMESTAMP
            """,
            subjectCode,
            subjectName,
            credits
        );

        return jdbcTemplate.queryForObject("SELECT id FROM subjects WHERE subject_code = ?", Long.class, subjectCode);
    }

    private String trimmed(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private Object firstNonNull(Object left, Object right) {
        return left != null ? left : right;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private BigDecimal toNullableNumber(Object value) {
        if (value == null) {
            return null;
        }

        String raw = String.valueOf(value).trim();
        if (raw.isEmpty()) {
            return null;
        }

        try {
            return new BigDecimal(raw);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private record NormalizedUploadRow(
        String uid,
        String name,
        BigDecimal cgpa,
        String subjectCode,
        String subjectName,
        BigDecimal credits,
        BigDecimal internalMarks,
        BigDecimal externalMarks,
        String grade,
        BigDecimal gradePoints
    ) {
    }
}
