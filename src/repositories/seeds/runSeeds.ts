import "reflect-metadata";
import { config } from "dotenv";
import { AppDataSource } from "../data-source";
import { DatabaseSeeder } from "./index";

config();

const runSeeding = async () => {
  try {
    console.log("🔄 Initializing database connection for seeding...");
    await AppDataSource.initialize();
    console.log("📊 Database connected successfully");

    console.log("🌱 Running database seeding...");
    await DatabaseSeeder.run();
    console.log("✅ Database seeding completed successfully");

    await AppDataSource.destroy();
    console.log("🔌 Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
};

runSeeding();