import { API_CONFIG } from "./api-config";
import { authService } from "./auth-service";


class SettingsService {

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
}

export const settingsService = new SettingsService();