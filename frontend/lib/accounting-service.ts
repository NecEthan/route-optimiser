import { API_CONFIG } from "./api-config";
import { authService } from "./auth-service";



class AccountingService {

  async addPayment(paymentData: any): Promise<any> {
    console.log(paymentData, 'paymentData')
    try {
      const headers = await authService.getAuthHeaders();

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/accounting/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          job_id: paymentData.job_id,
          customer_id: paymentData.customer_id,
          user_id: paymentData.user_id,
          invoice_number: paymentData.invoice_number,
          amount: paymentData.amount,
          status: paymentData.status || 'pending',
          method: paymentData.method || 'cash',
          due_date: paymentData.due_date,
          sent_at: paymentData.sent_at,
          paid_at: paymentData.paid_at,
          notes: paymentData.notes || ''
        })
        });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }

      const data = await response.json();
      return data.data; 
    } catch (error) {
      console.error('AccountingService: Add payment error:', error);
      throw error;
    }
  }
}

export const accountingService = new AccountingService();