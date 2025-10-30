import { Category } from "../entities/Category";
import { CategoryRepository } from "../repositories/CategoryRepository";

export interface CreateCategoryData {
  slug: string;
  name: string;
}

export interface CategoryListOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CategoryListResult {
  categories: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  // ID ile kategori bul
  async findById(id: string): Promise<Category | null> {
    return await this.categoryRepository.findById(id);
  }

  // Slug ile kategori bul
  async findBySlug(slug: string): Promise<Category | null> {
    return await this.categoryRepository.findBySlug(slug);
  }

  // İsim ile kategori bul
  async findByName(name: string): Promise<Category | null> {
    return await this.categoryRepository.findByName(name);
  }

  // Yeni kategori oluştur
  async createCategory(categoryData: CreateCategoryData): Promise<Category> {
    // Slug benzersizliği kontrolü
    const existingCategory = await this.findBySlug(categoryData.slug);
    if (existingCategory) {
      throw new Error("Category with this slug already exists");
    }

    return await this.categoryRepository.create(categoryData);
  }

  // Kategori bilgilerini güncelle
  async updateCategory(
    id: string,
    categoryData: Partial<CreateCategoryData>
  ): Promise<Category | null> {
    // Eğer slug güncelleniyorsa, benzersizlik kontrolü yap
    if (categoryData.slug) {
      const existingCategory = await this.findBySlug(categoryData.slug);
      if (existingCategory && existingCategory.id !== id) {
        throw new Error("Category with this slug already exists");
      }
    }

    return await this.categoryRepository.update(id, categoryData);
  }

  // Tüm kategorileri getir
  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.findAll();
  }

  // Kategoriyi sil
  async deleteCategory(id: string): Promise<void> {
    const category = await this.findById(id);
    if (!category) {
      throw new Error("Category not found");
    }

    // Eğer kategoriye bağlı ürünler varsa silmeyi engelle
    if (category.products && category.products.length > 0) {
      throw new Error("Cannot delete category with associated products");
    }

    return await this.categoryRepository.delete(id);
  }

  // Admin panel için kategori listesi (pagination ve search ile)
  async getCategoriesForAdmin(
    options: CategoryListOptions = {}
  ): Promise<CategoryListResult> {
    const { page = 1, limit = 10, search } = options;

    // Tüm kategorileri getir
    const allCategories = await this.getAllCategories();

    // Search filtresi uygula
    let filteredCategories = allCategories;
    if (search) {
      filteredCategories = allCategories.filter(
        (category) =>
          category.name.toLowerCase().includes(search.toLowerCase()) ||
          category.slug.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination uygula
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

    return {
      categories: paginatedCategories,
      pagination: {
        page,
        limit,
        total: filteredCategories.length,
        totalPages: Math.ceil(filteredCategories.length / limit),
      },
    };
  }

  // Admin panel için ürünlerle birlikte kategori getirme
  async getCategoryWithProductsForAdmin(id: string): Promise<Category> {
    const category = await this.findById(id);
    if (!category) {
      throw new Error("Category not found");
    }
    return category;
  }

  // Kategori ürünlerini paginated olarak getir
  async getCategoryProductsPaginated(
    categoryId: string,
    options: {
      page?: number;
      limit?: number;
      inStockOnly?: boolean;
    } = {}
  ) {
    const { page = 1, limit = 10, inStockOnly = true } = options;

    const category = await this.findById(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // ProductService'i kullanarak paginated products getir
    const productService = new (
      await import("./ProductService")
    ).ProductService();
    const productsResult = await productService.getProductsForAdmin({
      page,
      limit,
      categoryId,
      inStockOnly,
    });

    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      products: productsResult.products,
      pagination: productsResult.pagination,
    };
  }
}
