import "reflect-metadata";
import { DataSource } from "typeorm";
import { join } from "path";
import { entities } from "../entities";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "app",
  password: process.env.DB_PASSWORD || "app",
  database: process.env.DB_DATABASE || "shop",
  synchronize: false, // Never use true in production
  logging: process.env.NODE_ENV === "development",
  entities: entities,
  migrations: [
    process.env.NODE_ENV === "production"
      ? join(__dirname, "../migrations/*.js") // ✅ doğru relative path
      : join(__dirname, "../../migrations/*.ts"), // ✅ dev ortam için
  ],
});