package com.studentanalysis.server.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SubjectCreateRequest {

    @NotBlank(message = "subject_code is required")
    private String subjectCode;

    @NotBlank(message = "subject_name is required")
    @Size(min = 2, message = "subject_name must have at least 2 characters")
    private String subjectName;

    @NotNull(message = "credits is required")
    @Min(value = 1, message = "credits must be a positive number")
    private Integer credits;

    public String getSubjectCode() {
        return subjectCode;
    }

    public void setSubjectCode(String subjectCode) {
        this.subjectCode = subjectCode;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public Integer getCredits() {
        return credits;
    }

    public void setCredits(Integer credits) {
        this.credits = credits;
    }
}
