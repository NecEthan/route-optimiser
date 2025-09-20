// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  ENDPOINTS: {
    // Authentication
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    
    // Customers
    CUSTOMERS: '/api/customers',
    CUSTOMER_BY_ID: (id: string) => `/api/customers/${id}`,
    
    // Routes
    ROUTES: '/api/routes',
    ROUTE_OPTIMIZE: '/api/routes/optimize',
    
    // Health
    HEALTH: '/health'
  },
  
  // Request timeout
  TIMEOUT: 10000,
  
  // Headers
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

// Helper to build full URL
export const buildUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper to get auth headers
export const getAuthHeaders = (token?: string) => ({
  ...API_CONFIG.HEADERS,
  ...(token && { Authorization: `Bearer ${token}` })
});
