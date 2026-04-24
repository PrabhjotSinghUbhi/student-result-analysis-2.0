package com.studentanalysis.server.controller;

import com.studentanalysis.server.dto.StudentCreateRequest;
import com.studentanalysis.server.service.StudentService;
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
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public List<Map<String, Object>> listStudents() {
        return studentService.listStudents();
    }

    @GetMapping("/{id}")
    public Map<String, Object> getStudentById(@PathVariable long id) {
        return studentService.getStudentById(id);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createStudent(@Valid @RequestBody StudentCreateRequest request) {
        return ResponseEntity.status(201).body(studentService.createStudent(request));
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateStudent(@PathVariable long id, @RequestBody Map<String, Object> payload) {
        return studentService.updateStudent(id, payload);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
}
