import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Category } from "../entities/Category";

export class CategoryRepository {
  private repository: Repository<Category>;

  constructor() {
    this.repository = AppDataSource.getRepository(Category);
  }

  async findById(id: string): Promise<Category | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["products", "products.category"]
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return await this.repository.findOne({
      where: { slug },
      relations: ["products", "products.category"]
    });
  }

  async findByName(name: string): Promise<Category | null> {
    return await this.repository.findOne({
      where: { name }
    });
  }

  async create(categoryData: Partial<Category>): Promise<Category> {
    const category = this.repository.create(categoryData);
    return await this.repository.save(category);
  }

  async update(id: string, categoryData: Partial<Category>): Promise<Category | null> {
    await this.repository.update(id, categoryData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findAll(): Promise<Category[]> {
    return await this.repository.find({
      relations: ["products", "products.category"]
    });
  }
}