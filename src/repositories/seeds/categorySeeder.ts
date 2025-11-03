import { AppDataSource } from "../data-source";
import { Category } from "../../entities/Category";

export async function seedCategories(): Promise<void> {
  const categoryRepo = AppDataSource.getRepository(Category);

  const categories = [
    {
      name: "Electronics",
      slug: "electronics",
    },
    {
      name: "Clothing",
      slug: "clothing",
    },
    {
      name: "Books",
      slug: "books",
    },
    {
      name: "Home & Garden",
      slug: "home-garden",
    },
    {
      name: "Sports",
      slug: "sports",
    },
  ];

  for (const categoryData of categories) {
    const category = categoryRepo.create(categoryData);
    await categoryRepo.save(category);
  }
}
