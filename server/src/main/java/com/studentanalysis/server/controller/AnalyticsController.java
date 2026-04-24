package com.studentanalysis.server.controller;

import com.studentanalysis.server.service.AnalyticsService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboardStats(@RequestParam(required = false) String semester) {
        return analyticsService.getDashboardStats();
    }

    @GetMapping("/students/{studentId}/trend")
    public List<Map<String, Object>> getStudentTrend(@PathVariable long studentId) {
        return analyticsService.getStudentTrend(studentId);
    }
}
