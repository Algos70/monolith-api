import { Repository, MoreThan } from "typeorm";
import { AppDataSource } from "../data-source";
import { Product } from "../entities/Product";

export class ProductRepository {
  private repository: Repository<Product>;

  constructor() {
    this.repository = AppDataSource.getRepository(Product);
  }

  async findById(id: string): Promise<Product | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["category"]
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return await this.repository.findOne({
      where: { slug },
      relations: ["category"]
    });
  }

  async findByCategoryId(categoryId: string): Promise<Product[]> {
    return await this.repository.find({
      where: { category: { id: categoryId } },
      relations: ["category"]
    });
  }

  async searchByName(name: string): Promise<Product[]> {
    return await this.repository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.category", "category")
      .where("product.name ILIKE :name", { name: `%${name}%` })
      .getMany();
  }

  async findInStock(): Promise<Product[]> {
    return await this.repository.find({
      where: { stockQty: MoreThan(0) },
      relations: ["category"]
    });
  }

  // Domain-specific stock management
  async decreaseStock(productId: string, qty: number, manager?: any): Promise<Product | null> {
    const executeOperation = async (entityManager: any) => {
      const product = await entityManager.findOne(Product, {
        where: { id: productId },
        relations: ["category"]
      });

      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      if (product.stockQty < qty) {
        throw new Error(`Insufficient stock. Available: ${product.stockQty}, Required: ${qty}`);
      }

      product.stockQty -= qty;
      return await entityManager.save(product);
    };

    if (manager) {
      return await executeOperation(manager);
    } else {
      return await AppDataSource.transaction(executeOperation);
    }
  }

  async increaseStock(productId: string, qty: number): Promise<Product | null> {
    return await AppDataSource.transaction(async manager => {
      const product = await manager.findOne(Product, {
        where: { id: productId },
        relations: ["category"]
      });

      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      product.stockQty += qty;
      return await manager.save(product);
    });
  }

  async updatePrice(productId: string, newPriceMinor: number): Promise<Product | null> {
    await this.repository.update(productId, { priceMinor: newPriceMinor });
    return await this.findById(productId);
  }

  async isInStock(productId: string, requiredQty: number = 1): Promise<boolean> {
    const product = await this.repository.findOne({
      where: { id: productId },
      select: ["stockQty"]
    });
    return product ? product.stockQty >= requiredQty : false;
  }

  async create(productData: Partial<Product>): Promise<Product> {
    const product = this.repository.create(productData);
    return await this.repository.save(product);
  }

  async update(id: string, productData: Partial<Product>): Promise<Product | null> {
    await this.repository.update(id, productData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findAll(): Promise<Product[]> {
    return await this.repository.find({
      relations: ["category"]
    });
  }
}