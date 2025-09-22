export const API_CONFIG = {
//   BASE_URL: 'http://192.168.68.107:3000',
  BASE_URL: 'http://localhost:3000',
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    
    CUSTOMERS: '/api/customers',
    CUSTOMER_BY_ID: (id: string) => `/api/customers/${id}`,
    
    ROUTES: '/api/routes',
    ROUTE_OPTIMIZE: '/api/routes/optimize',
    
    HEALTH: '/health'
  },
  
  TIMEOUT: 10000,
  
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

export const buildUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const getAuthHeaders = (token?: string) => ({
  ...API_CONFIG.HEADERS,
  ...(token && { Authorization: `Bearer ${token}` })
});
