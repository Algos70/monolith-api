import { User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";

export interface CreateUserData {
  id?: string;
  email: string;
  name?: string;
}

export interface UserListOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UserListResult {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // Email ile kullanıcı bul
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  // Yeni kullanıcı oluştur
  async createUser(userData: CreateUserData): Promise<User> {
    return await this.userRepository.create(userData);
  }

  // Kullanıcı bilgilerini güncelle
  async updateUser(
    id: string,
    userData: Partial<CreateUserData>
  ): Promise<User | null> {
    return await this.userRepository.updateProfile(id, userData);
  }

  // ID ile kullanıcı bul
  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  // Tüm kullanıcıları getir
  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  // Kullanıcıyı sil
  async deleteUser(id: string): Promise<void> {
    return await this.userRepository.delete(id);
  }

  // İlişkilerle birlikte kullanıcı getir
  async findWithWallets(id: string): Promise<User | null> {
    return await this.userRepository.findWithWallets(id);
  }

  async findWithOrders(id: string): Promise<User | null> {
    return await this.userRepository.findWithOrders(id);
  }

  async findWithCarts(id: string): Promise<User | null> {
    return await this.userRepository.findWithCarts(id);
  }

  // Keycloak kullanıcısını senkronize et (yoksa oluştur, varsa güncelle)
  async syncKeycloakUser(keycloakUserInfo: any): Promise<User> {
    const keycloakId = keycloakUserInfo.sub; // Keycloak UUID
    const email = keycloakUserInfo.email;
    const name = keycloakUserInfo.name || keycloakUserInfo.preferred_username;

    // Önce Keycloak ID (user.id) ile kullanıcı ara
    let user = await this.findById(keycloakId);

    if (user) {
      // Kullanıcı bulundu, bilgileri kontrol et ve güncelle
      const needsUpdate = 
        user.email !== email || 
        (name && user.name !== name);

      if (needsUpdate) {
        const updatedUser = await this.updateUser(user.id, { 
          email, 
          name 
        });
        return updatedUser!;
      }
      return user;
    }

    // Keycloak ID ile bulunamadı, yeni kullanıcı oluştur
    // Keycloak UUID'sini user.id olarak kullan
    return await this.createUser({
      id: keycloakId, // Keycloak UUID'sini primary key olarak kullan
      email,
      name,
    });
  }

  // Admin panel için kullanıcı listesi (pagination ve search ile)
  async getUsersForAdmin(
    options: UserListOptions = {}
  ): Promise<UserListResult> {
    const { page = 1, limit = 10, search } = options;

    // Tüm kullanıcıları getir
    const allUsers = await this.getAllUsers();

    // Search filtresi uygula
    let filteredUsers = allUsers;
    if (search) {
      filteredUsers = allUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          user.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination uygula
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit),
      },
    };
  }

  // Admin panel için ilişkilerle birlikte kullanıcı getirme
  async getUserWithRelationsForAdmin(
    id: string,
    include?: string | string[]
  ): Promise<User> {
    let user: User | null;

    // Handle both string and array formats for include
    const includeArray = Array.isArray(include)
      ? include
      : include
      ? [include]
      : [];
    const includeStr = includeArray.join(",");

    if (includeStr.includes("wallets")) {
      user = await this.findWithWallets(id);
    } else if (includeStr.includes("orders")) {
      user = await this.findWithOrders(id);
    } else if (includeStr.includes("carts")) {
      user = await this.findWithCarts(id);
    } else {
      user = await this.findById(id);
    }

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}
