import { User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";

export interface CreateUserData {
  email: string;
  name?: string;
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
    const email = keycloakUserInfo.email;
    const name = keycloakUserInfo.name || keycloakUserInfo.preferred_username;

    // Email ile kullanıcı ara
    let user = await this.findByEmail(email);

    if (user) {
      // Kullanıcı varsa sadece name'i güncelle (email zaten aynı)
      if (name && name !== user.name) {
        const updatedUser = await this.updateUser(user.id, { name });
        return updatedUser!;
      }
      return user;
    }

    // Yoksa yeni kullanıcı oluştur
    return await this.createUser({
      email,
      name,
    });
  }
}
