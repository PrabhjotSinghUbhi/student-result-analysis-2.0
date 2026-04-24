package com.studentanalysis.server.controller;

import com.studentanalysis.server.dto.SubjectCreateRequest;
import com.studentanalysis.server.service.SubjectService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    public List<Map<String, Object>> listSubjects() {
        return subjectService.listSubjects();
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createSubject(@Valid @RequestBody SubjectCreateRequest request) {
        return ResponseEntity.status(201).body(subjectService.createSubject(request));
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateSubject(@PathVariable long id, @RequestBody Map<String, Object> payload) {
        return subjectService.updateSubject(id, payload);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubject(@PathVariable long id) {
        subjectService.deleteSubject(id);
        return ResponseEntity.noContent().build();
    }
}
