package com.studentanalysis.server.dto;

import java.util.ArrayList;
import java.util.List;

public class UploadSummaryResponse {

    private String fileName;
    private int totalRows;
    private int imported;
    private int failed;
    private final List<UploadSummaryError> errors = new ArrayList<>();

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public int getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    public int getImported() {
        return imported;
    }

    public void setImported(int imported) {
        this.imported = imported;
    }

    public int getFailed() {
        return failed;
    }

    public void setFailed(int failed) {
        this.failed = failed;
    }

    public List<UploadSummaryError> getErrors() {
        return errors;
    }

    public static class UploadSummaryError {

        private int row;
        private String message;

        public UploadSummaryError() {
        }

        public UploadSummaryError(int row, String message) {
            this.row = row;
            this.message = message;
        }

        public int getRow() {
            return row;
        }

        public void setRow(int row) {
            this.row = row;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
