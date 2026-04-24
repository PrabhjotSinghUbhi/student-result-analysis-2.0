# Spring Boot Backend (`server`)

This folder contains the Spring Boot recreation of the existing Node.js backend.

## Run

1. Ensure MySQL is running and schema exists (`student_results` by default).
2. Reuse the SQL setup from `backend/sql/init.sql`.
3. Set environment variables if needed:
   - `PORT` (default `5000`)
   - `DB_HOST` (default `localhost`)
   - `DB_PORT` (default `3306`)
   - `DB_USER` (default `root`)
   - `DB_PASSWORD` (default empty)
   - `DB_NAME` (default `student_results`)
4. Start server:

```bash
mvn spring-boot:run
```

API base path is `/api` and health endpoint is `/health`.
