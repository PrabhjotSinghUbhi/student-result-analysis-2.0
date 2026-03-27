import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT || 3306),
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "",
  dbName: process.env.DB_NAME || "student_results",
  dbConnectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
};

if (!env.dbUser || !env.dbName) {
  throw new Error("DB_USER and DB_NAME are required. Set them in your environment variables.");
}
