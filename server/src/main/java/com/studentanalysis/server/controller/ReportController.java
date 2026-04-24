package com.studentanalysis.server.controller;

import com.studentanalysis.server.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/students/{studentId}/csv")
    public ResponseEntity<String> downloadStudentCsv(@PathVariable long studentId) {
        String csv = reportService.buildStudentCsv(studentId);

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("text/csv"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=student-" + studentId + "-report.csv")
            .body(csv);
    }

    @GetMapping("/students/{studentId}/pdf")
    public ResponseEntity<byte[]> downloadStudentPdf(@PathVariable long studentId) {
        byte[] pdf = reportService.buildStudentPdf(studentId);

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=student-" + studentId + "-report.pdf")
            .body(pdf);
    }
}
