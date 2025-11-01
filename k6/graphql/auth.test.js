import { sleep } from 'k6';
import { AuthService } from './services/auth-service.js';

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  const authService = new AuthService();

  console.log('\n🔐 Starting Authentication Flow Tests');
  
  const { user } = authService.register();
  sleep(1);

  authService.login();
  sleep(1);

  authService.me();
  sleep(1);

  authService.refreshToken();
  sleep(1);

  authService.logout();
  sleep(1);

  console.log('\n✅ Authentication Flow Tests Completed');
}
