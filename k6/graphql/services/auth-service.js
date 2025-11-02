import { GraphQLClient } from '../utils/graphql-client.js';
import { AUTH_QUERIES } from '../queries/auth-queries.js';
import { AuthService as BaseAuthService } from '../../shared/auth-service.js';

export class AuthService extends BaseAuthService {
  constructor(client = new GraphQLClient()) {
    super(client, AUTH_QUERIES);
  }
}