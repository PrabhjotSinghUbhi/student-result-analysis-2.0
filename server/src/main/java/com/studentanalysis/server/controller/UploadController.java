package com.studentanalysis.server.controller;

import com.studentanalysis.server.dto.UploadSummaryResponse;
import com.studentanalysis.server.service.UploadService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping("/results")
    public UploadSummaryResponse uploadResults(@RequestParam(value = "file", required = false) MultipartFile file) {
        return uploadService.processBulkUpload(file);
    }
}
