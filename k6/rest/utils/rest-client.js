import http from 'k6/http';
import { REST_BASE_URL } from '../../config/test-config.js';

export class RestClient {
  constructor(baseUrl = REST_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  requestWithParsing(requestConfig, variables = {}, headers = {}) {
    const { method, url, body, params: queryParams } = requestConfig;
    let fullUrl = `${this.baseUrl}${url}`;
    
    // Handle query parameters for GET requests
    if (queryParams && Object.keys(queryParams).length > 0) {
      const queryString = Object.entries(queryParams)
        .filter(([key, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }
    
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