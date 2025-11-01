import { sleep } from 'k6';
import { AuthService } from './services/auth-service.js';
import { TEST_CONFIG } from './config/test-config.js';


export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  const authService = new AuthService();

  console.log('Starting Authentication Flow Tests');
  
  const { user } = authService.register();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  authService.login();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  authService.me();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  authService.logout();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  console.log('Authentication Flow Tests Completed');
}
