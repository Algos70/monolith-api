import { RestClient } from '../utils/rest-client.js';
import { AuthService as BaseAuthService } from '../../shared/auth-service.js';

export class AuthService extends BaseAuthService {
  constructor(client = new RestClient()) {
    // REST doesn't need queries object since we define endpoints in the shared service
    super(client, null);
  }
}