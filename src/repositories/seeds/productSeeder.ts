import { AppDataSource } from "../data-source";
import { Product } from "../../entities/Product";
import { Category } from "../../entities/Category";

export async function seedProducts(): Promise<void> {
  const productRepo = AppDataSource.getRepository(Product);
  const categoryRepo = AppDataSource.getRepository(Category);

  // Get categories
  const electronics = await categoryRepo.findOne({
    where: { name: "Electronics" },
  });
  const clothing = await categoryRepo.findOne({ where: { name: "Clothing" } });
  const books = await categoryRepo.findOne({ where: { name: "Books" } });
  const homeGarden = await categoryRepo.findOne({
    where: { name: "Home & Garden" },
  });
  const sports = await categoryRepo.findOne({ where: { name: "Sports" } });

  const products = [
    // Electronics
    {
      name: "iPhone 15 Pro",
      slug: "iphone-15-pro",
      priceMinor: 99999, // $999.99 in cents
      currency: "USD",
      stockQty: 50,
      category: electronics,
    },
    {
      name: "MacBook Air M2",
      slug: "macbook-air-m2",
      priceMinor: 129999, // $1299.99 in cents
      currency: "USD",
      stockQty: 30,
      category: electronics,
    },
    {
      name: "AirPods Pro",
      slug: "airpods-pro",
      priceMinor: 24999, // $249.99 in cents
      currency: "USD",
      stockQty: 100,
      category: electronics,
    },

    // Clothing
    {
      name: "Classic T-Shirt",
      slug: "classic-t-shirt",
      priceMinor: 1999, // $19.99 in cents
      currency: "USD",
      stockQty: 200,
      category: clothing,
    },
    {
      name: "Denim Jeans",
      slug: "denim-jeans",
      priceMinor: 7999, // $79.99 in cents
      currency: "USD",
      stockQty: 150,
      category: clothing,
    },
    {
      name: "Winter Jacket",
      slug: "winter-jacket",
      priceMinor: 14999, // $149.99 in cents
      currency: "USD",
      stockQty: 75,
      category: clothing,
    },

    // Books
    {
      name: "JavaScript: The Good Parts",
      slug: "javascript-the-good-parts",
      priceMinor: 2999, // $29.99 in cents
      currency: "USD",
      stockQty: 80,
      category: books,
    },
    {
      name: "Clean Code",
      slug: "clean-code",
      priceMinor: 3499, // $34.99 in cents
      currency: "USD",
      stockQty: 60,
      category: books,
    },

    // Home & Garden
    {
      name: "Coffee Maker",
      slug: "coffee-maker",
      priceMinor: 8999, // $89.99 in cents
      currency: "USD",
      stockQty: 40,
      category: homeGarden,
    },
    {
      name: "Garden Tools Set",
      slug: "garden-tools-set",
      priceMinor: 5999, // $59.99 in cents
      currency: "USD",
      stockQty: 25,
      category: homeGarden,
    },

    // Sports
    {
      name: "Yoga Mat",
      slug: "yoga-mat",
      priceMinor: 2499, // $24.99 in cents
      currency: "USD",
      stockQty: 120,
      category: sports,
    },
    {
      name: "Running Shoes",
      slug: "running-shoes",
      priceMinor: 12999, // $129.99 in cents
      currency: "USD",
      stockQty: 90,
      category: sports,
    },
  ];

  for (const productData of products) {
    if (productData.category) {
      const product = productRepo.create({
        name: productData.name,
        slug: productData.slug,
        priceMinor: productData.priceMinor,
        currency: productData.currency,
        stockQty: productData.stockQty,
        category: productData.category,
      });
      await productRepo.save(product);
    }
  }
}
