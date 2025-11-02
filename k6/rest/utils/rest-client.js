import http from 'k6/http';
import { REST_BASE_URL } from '../../config/test-config.js';

export class RestClient {
  constructor(baseUrl = REST_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  requestWithParsing(requestConfig, variables = {}, headers = {}) {
    const { method, url, body } = requestConfig;
    const fullUrl = `${this.baseUrl}${url}`;
    
    const params = {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    let response;
    const requestBody = body ? JSON.stringify(body) : undefined;

    switch (method.toUpperCase()) {
      case 'GET':
        response = http.get(fullUrl, params);
        break;
      case 'POST':
        response = http.post(fullUrl, requestBody, params);
        break;
      case 'PUT':
        response = http.put(fullUrl, requestBody, params);
        break;
      case 'DELETE':
        response = http.del(fullUrl, requestBody, params);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    // Parse response body
    let parsed = null;
    try {
      parsed = JSON.parse(response.body);
    } catch (error) {
      console.error('Failed to parse response body:', error);
    }

    return {
      ...response,
      parsed
    };
  }
}