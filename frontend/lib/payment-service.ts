import { API_CONFIG, buildUrl } from './api-config';
import { authService } from './auth-service';

// Types
export interface Payment {
  id: string;
  customer_id?: string;
  user_id?: string;
  invoice_number?: string;
  amount: number;
  status: 'pending' | 'sent' | 'paid' | 'overdue';
  method: 'cash' | 'bank' | 'card';
  due_date?: string;
  sent_at?: string;
  paid_at?: string;
  created_at?: string;
  notes?: string;
  customers?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
}

export interface CreatePaymentRequest {
  amount: number;
  method?: 'cash' | 'bank' | 'card';
  status?: 'pending' | 'sent' | 'paid' | 'overdue';
  customer_id?: string;
  invoice_number?: string;
  due_date?: string;
  notes?: string;
}

export interface UpdatePaymentRequest extends Partial<CreatePaymentRequest> {
  sent_at?: string;
  paid_at?: string;
}

class PaymentService {
  // Get all payments
  async getAllPayments(): Promise<Payment[]> {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(buildUrl('/api/accounting/payments'), {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Get payments error:', error);
      throw error;
    }
  }

  // Create new payment
  async createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(buildUrl('/api/accounting/payments'), {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Create payment error:', error);
      throw error;
    }
  }

  // Update payment
  async updatePayment(id: string, paymentData: UpdatePaymentRequest): Promise<Payment> {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(buildUrl(`/api/accounting/payments/${id}`), {
        method: 'PUT',
        headers,
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Update payment error:', error);
      throw error;
    }
  }

  // Update payment status (convenience method)
  async updatePaymentStatus(id: string, status: 'pending' | 'sent' | 'paid' | 'overdue'): Promise<Payment> {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(buildUrl(`/api/accounting/payments/${id}/status`), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Update payment status error:', error);
      throw error;
    }
  }

  // Mark payment as paid
  async markPaymentAsPaid(id: string): Promise<Payment> {
    return this.updatePaymentStatus(id, 'paid');
  }

  // Mark payment as sent
  async markPaymentAsSent(id: string): Promise<Payment> {
    return this.updatePaymentStatus(id, 'sent');
  }

  // Delete payment
  async deletePayment(id: string): Promise<void> {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(buildUrl(`/api/accounting/payments/${id}`), {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Delete payment error:', error);
      throw error;
    }
  }

  // Create payment for completed service
  async createServicePayment(customerId: string, serviceDescription: string, amount: number, method: 'cash' | 'bank' | 'card' = 'cash'): Promise<Payment> {
    const paymentData: CreatePaymentRequest = {
      customer_id: customerId,
      amount: amount,
      method: method,
      status: method === 'cash' ? 'paid' : 'pending',
      notes: `Payment for: ${serviceDescription}`
    };

    return this.createPayment(paymentData);
  }
}

export const paymentService = new PaymentService();
