import { API_CONFIG } from './api-config';
import { authService } from './auth-service';

// Types
export interface Job {
  id: string; // UUID
  customer_id?: string; // UUID foreign key
  user_id?: string; // UUID foreign key
  description: string; // text not null
  price: number; // numeric(10,2) not null
  frequency?: string; // character varying(50), default 'monthly'
  last_completed?: string; // date
  estimated_duration?: number | null; // integer (minutes)
  active?: boolean; // boolean, default true
  created_at?: string; // timestamp with time zone
  updated_at?: string; // timestamp with time zone
  // Customer information from join
  customers?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address: string;
  };
  // Legacy fields for backward compatibility
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  service_frequency?: string;
  notes?: string;
  completed?: boolean;
  completed_at?: string;
}

export interface JobCompletionRequest {
  job_id: string; // UUID
  completed_at?: string;
  notes?: string;
}

class JobService {
  async markJobComplete(jobId: string): Promise<Job> {
    try {
      const headers = await authService.getAuthHeaders();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/jobs/${jobId}/complete`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
            status: false,
            last_completed: new Date().toISOString(),
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return data.job;
    } catch (error) {
      throw error;
    }
  }

  async markJobIncomplete(jobId: string): Promise<Job> {
    try {
      const headers = await authService.getAuthHeaders();
      
      console.log('🔄 JobService: Marking job as incomplete:', jobId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/jobs/${jobId}/incomplete`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return data.job;
    } catch (error) {
      console.error('❌ JobService: Mark job incomplete error:', error);
      throw error;
    }
  }

  // Get job completion history
  async getJobCompletionHistory(jobId: string): Promise<any[]> {
    try {
      const headers = await authService.getAuthHeaders();
      
      console.log('📋 JobService: Getting completion history for job:', jobId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/jobs/${jobId}/history`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ JobService: Job history retrieved successfully');
      
      return data.history || [];
    } catch (error) {
      console.error('❌ JobService: Get job history error:', error);
      throw error;
    }
  }
}

export const jobService = new JobService();
