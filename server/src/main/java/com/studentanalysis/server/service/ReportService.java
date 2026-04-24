package com.studentanalysis.server.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ReportService {

    private final JdbcTemplate jdbcTemplate;

    public ReportService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String buildStudentCsv(long studentId) {
        List<Map<String, Object>> rows = getStudentReportRows(studentId);
        if (rows.isEmpty()) {
            return "";
        }

        try (StringWriter writer = new StringWriter();
             CSVPrinter printer = new CSVPrinter(
                 writer,
                 CSVFormat.DEFAULT.builder()
                     .setHeader(
                         "uid",
                         "name",
                         "cgpa",
                         "subject_code",
                         "subject_name",
                         "credits",
                         "internal_marks",
                         "external_marks",
                         "total_marks",
                         "grade",
                         "grade_points"
                     )
                     .build()
             )) {

            for (Map<String, Object> row : rows) {
                printer.printRecord(
                    printable(row.get("uid")),
                    printable(row.get("name")),
                    printable(row.get("cgpa")),
                    printable(row.get("subject_code")),
                    printable(row.get("subject_name")),
                    printable(row.get("credits")),
                    printable(row.get("internal_marks")),
                    printable(row.get("external_marks")),
                    printable(row.get("total_marks")),
                    printable(row.get("grade")),
                    printable(row.get("grade_points"))
                );
            }

            printer.flush();
            return writer.toString();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to build CSV report", ex);
        }
    }

    public byte[] buildStudentPdf(long studentId) {
        List<Map<String, Object>> rows = getStudentReportRows(studentId);
        List<String> lines = new ArrayList<>();

        if (rows.isEmpty()) {
            lines.add("No results found for this student.");
        } else {
            Map<String, Object> header = rows.get(0);
            lines.add("Name: " + printable(header.get("name")));
            lines.add("UID: " + printable(header.get("uid")));
            lines.add("CGPA: " + printable(header.get("cgpa")));
            lines.add("");

            for (int i = 0; i < rows.size(); i++) {
                Map<String, Object> row = rows.get(i);
                lines.add(
                    (i + 1)
                        + ". " + printable(row.get("subject_code"))
                        + " - " + printable(row.get("subject_name"))
                        + " | Internal: " + printable(row.get("internal_marks"))
                        + " | External: " + printable(row.get("external_marks"))
                        + " | Total: " + printable(row.get("total_marks"))
                        + " | " + printable(row.get("grade"))
                        + " (" + printable(row.get("grade_points")) + ")"
                );
            }
        }

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            PDType1Font bodyFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font headingFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

            float margin = 40;
            float leading = 14;
            float bodyFontSize = 10;

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDPageContentStream stream = new PDPageContentStream(document, page);
            float y = page.getMediaBox().getHeight() - margin;

            stream.beginText();
            stream.setFont(headingFont, 16);
            stream.newLineAtOffset(margin, y);
            stream.showText("Student Performance Report");
            stream.newLineAtOffset(0, -leading * 2);
            y -= leading * 2;
            stream.setFont(bodyFont, bodyFontSize);

            for (String line : lines) {
                if (y <= margin) {
                    stream.endText();
                    stream.close();

                    page = new PDPage(PDRectangle.A4);
                    document.addPage(page);
                    stream = new PDPageContentStream(document, page);
                    y = page.getMediaBox().getHeight() - margin;

                    stream.beginText();
                    stream.setFont(bodyFont, bodyFontSize);
                    stream.newLineAtOffset(margin, y);
                }

                stream.showText(cleanText(line));
                stream.newLineAtOffset(0, -leading);
                y -= leading;
            }

            stream.endText();
            stream.close();

            document.save(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to build PDF report", ex);
        }
    }

    private List<Map<String, Object>> getStudentReportRows(long studentId) {
        return jdbcTemplate.queryForList(
            """
            SELECT
              st.uid,
              st.name,
              st.cgpa,
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
            WHERE r.student_id = ?
            ORDER BY sb.subject_code ASC
            """,
            studentId
        );
    }

    private String printable(Object value) {
        return value == null ? "-" : String.valueOf(value);
    }

    private String cleanText(String value) {
        return value
            .replace("\r", " ")
            .replace("\n", " ")
            .replace("\t", " ");
    }
}
