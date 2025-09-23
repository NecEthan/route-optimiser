import { API_CONFIG } from "./api-config";
import { authService } from "./auth-service";


class SettingsService {

    private async getAuthHeaders() {
        const token = await authService.getAccessToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    async getUserSubscription(): Promise<any> {
        const token = await authService.getAccessToken();
        console.log('Retrieved user for subscription:', token);
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/subscription`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched settings:', data);
            return data;
        } catch (error) {
            console.error('Error fetching settings:', error);
            throw error;
        }
    }

    async getUserPaymentMethod(): Promise<any> {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/payment-method`, {
                method: 'GET',
                headers: await this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched payment method:', data);
            return data;
        } catch (error) {
            console.error('Error fetching payment method:', error);
            throw error;
        }
    }
   
    async addPaymentMethodWithToken(paymentData: { paymentMethodId: string; cardholderName: string; replaceCardId?: string | null }): Promise<any> {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/payment-method`, {
                method: 'POST',
                headers: await this.getAuthHeaders(),
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error adding payment method:', error);
            throw error;
        }
    }

}

export const settingsService = new SettingsService();