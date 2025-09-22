import { API_CONFIG, buildUrl } from './api-config';
import { authService } from './auth-service';

// Types
export interface Customer {
  id: string;
  user_id?: string; // UUID foreign key
  name: string;
  email?: string;
  phone?: string;
  description: string; // Service description - NOT NULL
  address: string; // NOT NULL
  price: number; // DECIMAL(10,2) NOT NULL
  frequency?: string;
  estimated_duration?: number; // INTEGER (minutes)
  created_at?: string;
  last_completed?: string; // DATE
  payment_status?: boolean; // BOOLEAN
  exterior_windows?: boolean;
  interior_windows?: boolean;
  gutters?: boolean;
  soffits?: boolean;
  fascias?: boolean;
  status?: boolean; // Based on your schema (fix the syntax error: status BOOLEAN)
  
  // Legacy compatibility fields for components that expect job structure
  paid_in_cash?: boolean; // Legacy field for backward compatibility
  customers?: { // For backward compatibility
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address: string;
  };
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  description: string; // Required - service description
  address: string; // Required
  price: number; // Required
  frequency?: string;
  estimated_duration?: number;
  payment_status?: boolean;
  exterior_windows?: boolean;
  interior_windows?: boolean;
  gutters?: boolean;
  soffits?: boolean;
  fascias?: boolean;
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

  // Mark customer service as complete
  async markServiceComplete(customerId: string): Promise<Customer> {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.CUSTOMER_BY_ID(customerId)), {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          last_completed: new Date().toISOString().split('T')[0], // Today's date
          payment_status: false, // Will be updated when payment is processed
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Mark service complete error:', error);
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
