package com.studentanalysis.server.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class ResultCreateRequest {

    @NotNull(message = "student_id is required")
    @Positive(message = "student_id must be a positive number")
    private Long studentId;

    @NotNull(message = "subject_id is required")
    @Positive(message = "subject_id must be a positive number")
    private Long subjectId;

    @DecimalMin(value = "0.0", message = "internal_marks must be nonnegative")
    private BigDecimal internalMarks;

    @DecimalMin(value = "0.0", message = "external_marks must be nonnegative")
    private BigDecimal externalMarks;

    @NotBlank(message = "grade is required")
    private String grade;

    @NotNull(message = "grade_points is required")
    @DecimalMin(value = "0.0", message = "grade_points must be between 0 and 10")
    @DecimalMax(value = "10.0", message = "grade_points must be between 0 and 10")
    private BigDecimal gradePoints;

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public BigDecimal getInternalMarks() {
        return internalMarks;
    }

    public void setInternalMarks(BigDecimal internalMarks) {
        this.internalMarks = internalMarks;
    }

    public BigDecimal getExternalMarks() {
        return externalMarks;
    }

    public void setExternalMarks(BigDecimal externalMarks) {
        this.externalMarks = externalMarks;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public BigDecimal getGradePoints() {
        return gradePoints;
    }

    public void setGradePoints(BigDecimal gradePoints) {
        this.gradePoints = gradePoints;
    }
}
