import http from 'k6/http';

export class GraphQLClient {
  constructor(baseUrl = __ENV.BASE_URL || 'http://localhost:4000/graphql') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  request(query, variables = {}, headers = {}) {
    const payload = JSON.stringify({ query, variables });
    const requestHeaders = { ...this.defaultHeaders, ...headers };
    
    return http.post(this.baseUrl, payload, {
      headers: requestHeaders,
    });
  }

  parseResponse(response) {
    try {
      const parsed = JSON.parse(response.body);
      return {
        data: parsed.data,
        errors: parsed.errors,
      };
    } catch (e) {
      return {
        data: null,
        errors: [{ message: `Failed to parse response: ${e.message}` }],
      };
    }
  }

  requestWithParsing(query, variables = {}, headers = {}) {
    const response = this.request(query, variables, headers);
    const parsed = this.parseResponse(response);
    
    return {
      ...response,
      parsed,
    };
  }
}