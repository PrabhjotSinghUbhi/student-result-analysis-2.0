package com.studentanalysis.server.util;

public final class SqlExceptionUtils {

    private SqlExceptionUtils() {
    }

    public static boolean isDuplicateKey(Throwable throwable) {
        String message = rootMessage(throwable);
        return message.contains("duplicate") || message.contains("duplicate entry");
    }

    public static boolean isForeignKeyViolation(Throwable throwable) {
        String message = rootMessage(throwable);
        return message.contains("foreign key") || message.contains("referenced row") || message.contains("constraint fails");
    }

    private static String rootMessage(Throwable throwable) {
        Throwable root = throwable;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        String message = root.getMessage();
        return message == null ? "" : message.toLowerCase();
    }
}
