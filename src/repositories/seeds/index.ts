import { AppDataSource } from "../data-source";
import { seedCategories } from "./categorySeeder";
import { seedProducts } from "./productSeeder";

export class DatabaseSeeder {
  private static hasRun = false;

  static async run(): Promise<void> {
    if (this.hasRun) {
      console.log("🌱 Seeds already executed, skipping...");
      return;
    }

    try {
      console.log("🌱 Starting database seeding...");

      // Check if data already exists
      const categoryRepo = AppDataSource.getRepository("Category");
      const productRepo = AppDataSource.getRepository("Product");

      const categoryCount = await categoryRepo.count();
      const productCount = await productRepo.count();

      // If data exists, skip seeding
      if (categoryCount > 0 || productCount > 0) {
        console.log("🌱 Database already contains data, skipping seeding");
        this.hasRun = true;
        return;
      }

      // Run seeders in order
      await seedCategories();
      console.log("✅ Categories seeded");

      await seedProducts();
      console.log("✅ Products seeded");

      this.hasRun = true;
      console.log("🌱 Database seeding completed successfully");
    } catch (error) {
      console.error("❌ Error during database seeding:", error);
      throw error;
    }
  }
}
