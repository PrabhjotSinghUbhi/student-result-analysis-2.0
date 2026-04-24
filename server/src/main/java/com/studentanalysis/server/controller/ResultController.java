package com.studentanalysis.server.controller;

import com.studentanalysis.server.dto.ResultCreateRequest;
import com.studentanalysis.server.service.ResultService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/results")
public class ResultController {

    private final ResultService resultService;

    public ResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    @GetMapping
    public List<Map<String, Object>> listResults(
        @RequestParam(required = false) Long studentId,
        @RequestParam(required = false) String subjectCode
    ) {
        return resultService.listResults(studentId, subjectCode);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createResult(@Valid @org.springframework.web.bind.annotation.RequestBody ResultCreateRequest request) {
        return ResponseEntity.status(201).body(resultService.createResult(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResult(@PathVariable long id) {
        resultService.deleteResult(id);
        return ResponseEntity.noContent().build();
    }
}
