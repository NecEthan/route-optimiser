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

    async getUserSubscription(userId: string): Promise<any> {
        try {
            console.log('Fetching subscription for user:', userId);

            const url = `${API_CONFIG.BASE_URL}/api/user/subscription?userId=${userId}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: await this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched subscription for user:', userId, data);
            return data;
        } catch (error) {
            console.error('Error fetching subscription:', error);
            throw error;
        }
    }

    async getUserPaymentMethod(userId: string): Promise<any> {
        try {
            console.log('Fetching payment method for user:', userId);

            const url = `${API_CONFIG.BASE_URL}/api/user/payment-method?userId=${userId}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: await this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched payment method for user:', userId, data);
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

    async updatePaymentMethod(paymentMethodId: string, paymentData: {
        stripe_payment_method_id: string;
        last_four: string;
        card_type: string;
        expiration_month: number;
        expiration_year: number;
        cardholder_name: string;
        bank_name?: string | null;
        status?: string;
    }): Promise<any> {
        try {
            console.log('🚀 UPDATE PAYMENT METHOD CALLED!');
            console.log('🔍 Payment Method ID:', paymentMethodId);
            console.log('📦 Payment Data:', paymentData);
            console.log('🌐 API URL:', `${API_CONFIG.BASE_URL}/api/payment/method/${paymentMethodId}`);

            const headers = await this.getAuthHeaders();
            console.log('🔑 Auth Headers:', headers);

            const response = await fetch(`${API_CONFIG.BASE_URL}/api/payment/method/${paymentMethodId}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(paymentData)
            });

            console.log('📡 Response Status:', response.status);

            if (!response.ok) {
                console.error('❌ Response not OK:', response.status, response.statusText);
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
            }

            const result = await response.json();
            console.log('✅ Payment method updated successfully:', result);
            return result;
        } catch (error) {
            console.error('💥 Error updating payment method:', error);
            throw error;
        }
    }

    async createTestData(): Promise<any> {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/create-test-data`, {
                method: 'POST',
                headers: await this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating test data:', error);
            throw error;
        }
    }

}

export const settingsService = new SettingsService();