import { Product } from "../entities/Product";
import { ProductRepository } from "../repositories/ProductRepository";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { Cache, InvalidateCache } from "../cache/CacheDecorator";

export interface CreateProductData {
  name: string;
  slug: string;
  priceMinor: number;
  currency: string;
  stockQty: number;
  categoryId: string;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  priceMinor?: number;
  currency?: string;
  stockQty?: number;
  categoryId?: string;
}

export interface ProductValidationError extends Error {
  field?: string;
  code?: string;
}

export interface ProductListOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  inStockOnly?: boolean;
}

export interface ProductListResult {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ProductService {
  private productRepository: ProductRepository;
  private categoryRepository: CategoryRepository;

  constructor() {
    this.productRepository = new ProductRepository();
    this.categoryRepository = new CategoryRepository();
  }

  // ID ile ürün bul
  async findById(id: string): Promise<Product | null> {
    return await this.productRepository.findById(id);
  }

  // Slug ile ürün bul
  @Cache({ 
    ttl: 180, // 3 minutes
    keyGenerator: (slug: string) => `product:v1:${slug}`
  })
  async findBySlug(slug: string): Promise<Product | null> {
    return await this.productRepository.findBySlug(slug);
  }

  // Kategori ID'sine göre ürünleri bul
  @Cache({ 
    ttl: 120, // 2 minutes
    keyGenerator: (categoryId: string) => `products:v1:category:${categoryId}`
  })
  async findByCategoryId(categoryId: string): Promise<Product[]> {
    return await this.productRepository.findByCategoryId(categoryId);
  }

  // İsme göre ürün ara
  async searchByName(name: string): Promise<Product[]> {
    return await this.productRepository.searchByName(name);
  }

  // Stokta olan ürünleri getir
  async findInStock(): Promise<Product[]> {
    return await this.productRepository.findInStock();
  }

  // Validate product data
  private validateProductData(productData: Partial<CreateProductData>): void {
    if (productData.name !== undefined && (!productData.name || productData.name.trim().length === 0)) {
      const error = new Error("Name is required and cannot be empty") as ProductValidationError;
      error.field = "name";
      error.code = "REQUIRED";
      throw error;
    }

    if (productData.slug !== undefined && (!productData.slug || productData.slug.trim().length === 0)) {
      const error = new Error("Slug is required and cannot be empty") as ProductValidationError;
      error.field = "slug";
      error.code = "REQUIRED";
      throw error;
    }

    if (productData.priceMinor !== undefined) {
      if (typeof productData.priceMinor !== "number" || productData.priceMinor < 0) {
        const error = new Error("priceMinor must be a non-negative number") as ProductValidationError;
        error.field = "priceMinor";
        error.code = "INVALID_TYPE";
        throw error;
      }
    }

    if (productData.stockQty !== undefined) {
      if (typeof productData.stockQty !== "number" || productData.stockQty < 0) {
        const error = new Error("stockQty must be a non-negative number") as ProductValidationError;
        error.field = "stockQty";
        error.code = "INVALID_TYPE";
        throw error;
      }
    }

    if (productData.currency !== undefined) {
      if (!productData.currency || productData.currency.length !== 3) {
        const error = new Error("currency must be a 3-character code") as ProductValidationError;
        error.field = "currency";
        error.code = "INVALID_FORMAT";
        throw error;
      }
    }
  }

  // Validate stock quantity
  private validateStockQuantity(qty: number): void {
    if (!qty || typeof qty !== "number" || qty <= 0) {
      const error = new Error("qty must be a positive number") as ProductValidationError;
      error.field = "qty";
      error.code = "INVALID_TYPE";
      throw error;
    }
  }

  // Yeni ürün oluştur
  @InvalidateCache({ 
    patterns: [
      'products:v1:*',
      'product:v1:*'
    ]
  })
  async createProduct(productData: CreateProductData): Promise<Product> {
    // Validate input data
    this.validateProductData(productData);

    // Normalize currency to uppercase
    const normalizedData = {
      ...productData,
      currency: productData.currency.toUpperCase(),
      name: productData.name.trim(),
      slug: productData.slug.trim(),
    };

    // Slug benzersizliği kontrolü
    const existingProduct = await this.findBySlug(normalizedData.slug);
    if (existingProduct) {
      const error = new Error("Product with this slug already exists") as ProductValidationError;
      error.field = "slug";
      error.code = "DUPLICATE";
      throw error;
    }

    // Kategori varlığı kontrolü
    const category = await this.categoryRepository.findById(normalizedData.categoryId);
    if (!category) {
      const error = new Error("Category not found") as ProductValidationError;
      error.field = "categoryId";
      error.code = "NOT_FOUND";
      throw error;
    }

    const { categoryId, ...productFields } = normalizedData;
    return await this.productRepository.create({
      ...productFields,
      category: category,
    });
  }

  // Ürün bilgilerini güncelle
  @InvalidateCache({ 
    patterns: [
      'products:v1:*',
      'product:v1:*'
    ]
  })
  async updateProduct(
    id: string,
    productData: UpdateProductData
  ): Promise<Product | null> {
    // Check if product exists
    const existingProduct = await this.findById(id);
    if (!existingProduct) {
      const error = new Error("Product not found") as ProductValidationError;
      error.code = "NOT_FOUND";
      throw error;
    }

    // Validate only provided fields
    const fieldsToValidate: Partial<CreateProductData> = {};
    if (productData.name !== undefined) fieldsToValidate.name = productData.name;
    if (productData.slug !== undefined) fieldsToValidate.slug = productData.slug;
    if (productData.priceMinor !== undefined) fieldsToValidate.priceMinor = productData.priceMinor;
    if (productData.currency !== undefined) fieldsToValidate.currency = productData.currency;
    if (productData.stockQty !== undefined) fieldsToValidate.stockQty = productData.stockQty;

    if (Object.keys(fieldsToValidate).length > 0) {
      this.validateProductData(fieldsToValidate);
    }

    // Normalize data
    const normalizedData = { ...productData };
    if (normalizedData.currency) {
      normalizedData.currency = normalizedData.currency.toUpperCase();
    }
    if (normalizedData.name) {
      normalizedData.name = normalizedData.name.trim();
    }
    if (normalizedData.slug) {
      normalizedData.slug = normalizedData.slug.trim();
    }

    // Eğer slug güncelleniyorsa, benzersizlik kontrolü yap
    if (normalizedData.slug) {
      const slugProduct = await this.findBySlug(normalizedData.slug);
      if (slugProduct && slugProduct.id !== id) {
        const error = new Error("Product with this slug already exists") as ProductValidationError;
        error.field = "slug";
        error.code = "DUPLICATE";
        throw error;
      }
    }

    // Eğer kategori güncelleniyorsa, kategori varlığı kontrolü yap
    let updateFields: any = { ...normalizedData };
    if (normalizedData.categoryId) {
      const category = await this.categoryRepository.findById(normalizedData.categoryId);
      if (!category) {
        const error = new Error("Category not found") as ProductValidationError;
        error.field = "categoryId";
        error.code = "NOT_FOUND";
        throw error;
      }
      updateFields.category = category;
      delete updateFields.categoryId;
    }

    return await this.productRepository.update(id, updateFields);
  }

  // Tüm ürünleri getir
  async getAllProducts(): Promise<Product[]> {
    return await this.productRepository.findAll();
  }

  // Ürünü sil
  @InvalidateCache({ 
    patterns: [
      'products:v1:*',
      'product:v1:*'
    ]
  })
  async deleteProduct(id: string): Promise<void> {
    const product = await this.findById(id);
    if (!product) {
      throw new Error("Product not found");
    }

    return await this.productRepository.delete(id);
  }

  // Stok azalt
  @InvalidateCache({ 
    patterns: [
      'products:v1:*',
      'product:v1:*'
    ]
  })
  async decreaseStock(productId: string, qty: number, manager?: any): Promise<Product | null> {
    this.validateStockQuantity(qty);
    return await this.productRepository.decreaseStock(productId, qty, manager);
  }

  // Stok artır
  @InvalidateCache({ 
    patterns: [
      'products:v1:*',
      'product:v1:*'
    ]
  })
  async increaseStock(productId: string, qty: number): Promise<Product | null> {
    this.validateStockQuantity(qty);
    return await this.productRepository.increaseStock(productId, qty);
  }

  // Fiyat güncelle
  @InvalidateCache({ 
    patterns: [
      'products:v1:*',
      'product:v1:*'
    ]
  })
  async updatePrice(productId: string, newPriceMinor: number): Promise<Product | null> {
    if (newPriceMinor === undefined || typeof newPriceMinor !== "number" || newPriceMinor < 0) {
      const error = new Error("priceMinor must be a non-negative number") as ProductValidationError;
      error.field = "priceMinor";
      error.code = "INVALID_TYPE";
      throw error;
    }

    const product = await this.findById(productId);
    if (!product) {
      const error = new Error("Product not found") as ProductValidationError;
      error.code = "NOT_FOUND";
      throw error;
    }

    return await this.productRepository.updatePrice(productId, newPriceMinor);
  }

  // Stok kontrolü
  async isInStock(productId: string, requiredQty: number = 1): Promise<boolean> {
    return await this.productRepository.isInStock(productId, requiredQty);
  }

  // Admin panel için ürün listesi (pagination ve search ile)
  @Cache({ 
    ttl: 120, // 2 minutes
    keyGenerator: (options: ProductListOptions = {}) => {
      const { page = 1, limit = 10, search = '', categoryId = '', inStockOnly = false } = options;
      // Boş değerleri kaldır, sadece var olanları ekle
      const parts = [`products:v1:list:${page}:${limit}`];
      if (search) parts.push(`search:${search}`);
      if (categoryId) parts.push(`cat:${categoryId}`);
      if (inStockOnly) parts.push('instock');
      return parts.join(':');
    }
  })
  async getProductsForAdmin(
    options: ProductListOptions = {}
  ): Promise<ProductListResult> {
    const { page = 1, limit = 10, search, categoryId, inStockOnly } = options;

    // Tüm ürünleri getir
    let allProducts = await this.getAllProducts();

    // Filtreler uygula
    if (search) {
      allProducts = allProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.slug.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (categoryId) {
      allProducts = allProducts.filter(
        (product) => product.category.id === categoryId
      );
    }

    if (inStockOnly) {
      allProducts = allProducts.filter((product) => product.stockQty > 0);
    }

    // Pagination uygula
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = allProducts.slice(startIndex, endIndex);

    return {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: allProducts.length,
        totalPages: Math.ceil(allProducts.length / limit),
      },
    };
  }

  // Admin panel için ürün detayı getirme
  @Cache({ 
    ttl: 180, // 3 minutes
    keyGenerator: (id: string) => `product:v1:admin:${id}`
  })
  async getProductForAdmin(id: string): Promise<Product> {
    const product = await this.findById(id);
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }
}