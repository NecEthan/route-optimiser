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
            console.log('🌐 Subscription API Request URL:', url);
            console.log('🔧 BASE_URL:', API_CONFIG.BASE_URL);

            const headers = await this.getAuthHeaders();
            console.log('📤 Subscription request headers:', headers);

            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
            });

            console.log('📡 Subscription response status:', response.status);
            
            // Check if response is HTML vs JSON
            const contentType = response.headers.get('content-type');
            console.log('📄 Subscription Content-Type:', contentType);
            
            if (contentType && contentType.includes('text/html')) {
                console.error('❌ Subscription API returned HTML instead of JSON!');
                const htmlText = await response.text();
                console.log('📄 HTML Response (first 200 chars):', htmlText.substring(0, 200));
                throw new Error('Subscription API returned HTML instead of JSON - check server configuration');
            }

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
            console.log('🌐 API Request URL:', url);
            console.log('🔧 BASE_URL:', API_CONFIG.BASE_URL);

            const headers = await this.getAuthHeaders();
            console.log('📤 Request headers:', headers);

            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
            
            // Check if response is HTML vs JSON
            const contentType = response.headers.get('content-type');
            console.log('📄 Content-Type:', contentType);
            
            if (contentType && contentType.includes('text/html')) {
                console.error('❌ Received HTML instead of JSON - API call redirected!');
                const htmlText = await response.text();
                console.log('📄 HTML Response (first 200 chars):', htmlText.substring(0, 200));
                throw new Error('API call returned HTML instead of JSON - check server configuration');
            }

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