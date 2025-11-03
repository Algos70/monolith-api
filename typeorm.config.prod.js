const { DataSource } = require("typeorm");
const { resolve } = require("path");

// Import compiled entities
const { entities } = require("./dist/src/entities");

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "app",
  password: process.env.DB_PASSWORD || "app",
  database: process.env.DB_DATABASE || "shop",
  synchronize: false, // Never use true in production
  logging: process.env.NODE_ENV === "development",
  entities: entities,
  migrations: ["dist/migrations/*.js"],
});

module.exports = AppDataSource;