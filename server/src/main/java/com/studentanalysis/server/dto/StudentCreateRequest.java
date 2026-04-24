package com.studentanalysis.server.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class StudentCreateRequest {

    @NotBlank(message = "uid is required")
    private String uid;

    @NotBlank(message = "name is required")
    @Size(min = 2, message = "name must have at least 2 characters")
    private String name;

    @DecimalMin(value = "0.0", message = "cgpa must be between 0 and 10")
    @DecimalMax(value = "10.0", message = "cgpa must be between 0 and 10")
    private BigDecimal cgpa;

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getCgpa() {
        return cgpa;
    }

    public void setCgpa(BigDecimal cgpa) {
        this.cgpa = cgpa;
    }
}
