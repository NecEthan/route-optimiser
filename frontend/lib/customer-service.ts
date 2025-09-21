import { API_CONFIG, buildUrl } from './api-config';
import { authService } from './auth-service';

// Types
export interface Customer {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  service_frequency?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCustomerRequest {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  service_frequency?: string;
  notes?: string;
}

class CustomerService {
  // Get all customers
  async getAllCustomers(): Promise<Customer[]> {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.CUSTOMERS), {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Get customers error:', error);
      throw error;
    }
  }

  // Get customer by ID
  async getCustomerById(id: string): Promise<Customer> {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.CUSTOMER_BY_ID(id)), {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get customer error:', error);
      throw error;
    }
  }

  // Create new customer
  async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.CUSTOMERS), {
        method: 'POST',
        headers,
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Create customer error:', error);
      throw error;
    }
  }

  // Update customer
  async updateCustomer(id: string, customerData: Partial<CreateCustomerRequest>): Promise<Customer> {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.CUSTOMER_BY_ID(id)), {
        method: 'PUT',
        headers,
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Update customer error:', error);
      throw error;
    }
  }

  // Delete customer
  async deleteCustomer(id: string): Promise<void> {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.CUSTOMER_BY_ID(id)), {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Delete customer error:', error);
      throw error;
    }
  }
}

export const customerService = new CustomerService();
