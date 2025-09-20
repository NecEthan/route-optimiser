import { API_CONFIG, buildUrl } from './api-config';
import { authService } from './auth-service';

// Types
export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface RouteOptimizationRequest {
  customerIds: string[];
  startLocation: Location;
}

export interface OptimizedRoute {
  totalDistance: number;
  totalDuration: number;
  optimizedOrder: string[];
  googleMapsUrl: string;
  waypoints: Location[];
}

class RouteService {
  // Get all routes
  async getAllRoutes() {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.ROUTES), {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.routes || [];
    } catch (error) {
      console.error('Get routes error:', error);
      throw error;
    }
  }

  // Optimize route
  async optimizeRoute(routeData: RouteOptimizationRequest): Promise<OptimizedRoute> {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.ROUTE_OPTIMIZE), {
        method: 'POST',
        headers,
        body: JSON.stringify(routeData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.optimizedRoute;
    } catch (error) {
      console.error('Route optimization error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.HEALTH), {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }
}

export const routeService = new RouteService();
