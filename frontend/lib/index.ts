// Re-export all API services for easy imports
export { authService } from './auth-service';
export { customerService } from './customer-service';
export { routeService } from './route-service';
export { jobService } from './job-service';
export { API_CONFIG, buildUrl, getAuthHeaders } from './api-config';

// Re-export types
export type { LoginRequest, RegisterRequest, AuthResponse } from './auth-service';
export type { Customer, CreateCustomerRequest } from './customer-service';
export type { Location, RouteOptimizationRequest, OptimizedRoute } from './route-service';
export type { Job, JobCompletionRequest } from './job-service';
