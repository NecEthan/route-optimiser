import { Job } from "@/app/interfaces/job.interface";
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
          amount: paymentData.amount,
          method: paymentData.method || 'cash',
          notes: paymentData.notes || ''
        })
        });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }

      const data = await response.json();
      return data.payment; 
    } catch (error) {
      console.error('AccountingService: Add payment error:', error);
      throw error;
    }
  }
}

export const accountingService = new AccountingService();