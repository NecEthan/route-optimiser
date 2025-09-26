/**
 * Express Backend Integration Service for Window Cleaner AI Optimizer
 * 
 * This service handles communication between your Express backend and the 
 * FastAPI optimization engine. It sends work schedules to FastAPI, which
 * fetches customers from the database and returns optimized schedules.
 */

import axios, { AxiosResponse } from 'axios';

// TypeScript interfaces for type safety
export interface WorkSchedule {
  monday_hours?: number | null;
  tuesday_hours?: number | null;
  wednesday_hours?: number | null;
  thursday_hours?: number | null;
  friday_hours?: number | null;
  saturday_hours?: number | null;
  sunday_hours?: number | null;
}

export interface CleanerLocation {
  lat: number;
  lng: number;
}

interface Customer {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  price: number;
  estimated_duration: number;
  days_since_cleaned: number;
  days_overdue: number;
  urgency_score: number;
  next_due_date: string;
  route_order: number;
}

interface DaySchedule {
  date: string;
  day: string;
  max_hours: number;
  customers: Customer[];
  total_duration_minutes: number;
  total_revenue: number;
  estimated_travel_time: number;
  time_savings: {
    optimized_travel_time_minutes: number;
    unoptimized_travel_time_minutes: number;
    time_savings_minutes: number;
    time_savings_hours: number;
    fuel_savings_estimate_gbp: number;
    efficiency_improvement_percent: number;
    extra_customers_possible: number;
  };
}

interface ScheduleSummary {
  total_customers_scheduled: number;
  total_revenue: number;
  total_work_hours: number;
  working_days: number;
  average_customers_per_day: number;
  average_revenue_per_day: number;
}

interface TimeSavingsSummary {
  total_time_saved_minutes: number;
  total_time_saved_hours: number;
  total_fuel_saved_gbp: number;
  extra_customers_per_week: number;
  weekly_efficiency_gain: string;
}

interface OptimizedScheduleResponse {
  user_id: string;
  express_integration: boolean;
  work_schedule_received: WorkSchedule;
  customers_from_database: number;
  schedule: { [date: string]: DaySchedule };
  summary: ScheduleSummary;
  time_savings_summary: TimeSavingsSummary;
  unscheduled_customers: number;
  message: string;
}

interface ExpressScheduleRequest {
  work_schedule: WorkSchedule;
  cleaner_start_location?: CleanerLocation;
}

export class WindowCleanerOptimizationService {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(
    baseUrl: string = 'http://127.0.0.1:5003',
    timeout: number = 30000
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * 🎯 MAIN EXPRESS INTEGRATION METHOD
   * 
   * Send work schedule from Express → FastAPI fetches customers from DB → 
   * Returns optimized 1-week schedule back to Express
   * 
   * Perfect for: Express backend → FastAPI → Express workflow
   */
  async generateOptimizedScheduleFromDatabase(
    userId: string,
    workSchedule: WorkSchedule,
    cleanerLocation?: CleanerLocation
  ): Promise<OptimizedScheduleResponse> {
    try {
      const requestData: ExpressScheduleRequest = {
        work_schedule: workSchedule,
        cleaner_start_location: cleanerLocation || { lat: 51.5074, lng: -0.1278 } // Default London
      };

      console.log(`🚀 Sending work schedule to Express API for user: ${userId}`);
      console.log(`📊 Work Schedule:`, workSchedule);
      
      const response: AxiosResponse<OptimizedScheduleResponse> = await axios.post(
        `${this.baseUrl}/schedule/smart-optimize/${userId}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        }
      );

      console.log(`✅ Successfully optimized schedule for ${response.data.customers_from_database} customers`);
      console.log(`💰 Total revenue: £${response.data.summary.total_revenue}`);
      console.log(`📅 Working days: ${response.data.summary.working_days}`);
      
      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.detail || error.message;
        
        console.error(`❌ FastAPI Error (${status}):`, message);
        
        // Handle specific error cases
        if (status === 404) {
          throw new Error(`No customers found for user ${userId}. Please ensure the user has customers in the database.`);
        } else if (status === 500) {
          throw new Error(`Optimization engine error: ${message}`);
        } else {
          throw new Error(`FastAPI request failed: ${message}`);
        }
      } else {
        console.error('❌ Network Error:', error);
        throw new Error(`Network error: Unable to connect to optimization service at ${this.baseUrl}`);
      }
    }
  }

  /**
   * � SIMPLE 1-WEEK SCHEDULE GENERATION
   * 
   * Generate a 1-week optimized schedule by passing user ID and work schedule
   * This matches your FastAPI endpoint: POST /create-1week-schedule/{userId}
   */
  async generate1WeekSchedule(
    userId: string,
    workSchedule: WorkSchedule,
    cleanerLocation?: CleanerLocation
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const requestData: ExpressScheduleRequest = {
        work_schedule: workSchedule,
        cleaner_start_location: cleanerLocation || { lat: 51.5074, lng: -0.1278 } // Default London
      };

      console.log(`🚀 Generating 1-week schedule for user: ${userId}`);
      console.log(`📊 Work Schedule:`, workSchedule);
      
      const response: AxiosResponse<OptimizedScheduleResponse> = await axios.post(
        `${this.baseUrl}/schedule/smart-optimize/${userId}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        }
      );

      console.log(`✅ Successfully generated 1-week schedule`);
      
      return {
        success: true,
        data: response.data
      };

    } catch (error: any) {
      console.error('Error generating 1-week schedule:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * �🏥 Health Check
   * Verify that the FastAPI optimization service is running and database is connected
   */
  async healthCheck(): Promise<{ status: string; database: string; message: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
      });
      
      console.log(`✅ FastAPI Service: ${response.data.status}`);
      console.log(`🗄️  Database: ${response.data.database}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Health Check Failed:', error);
      throw new Error('FastAPI optimization service is not available');
    }
  }

  /**
   * 📈 Extract Key Metrics
   * Helper method to extract important metrics for your Express API responses
   */
  extractKeyMetrics(scheduleResponse: OptimizedScheduleResponse) {
    return {
      // Business Metrics
      totalCustomers: scheduleResponse.summary.total_customers_scheduled,
      totalRevenue: scheduleResponse.summary.total_revenue,
      workingDays: scheduleResponse.summary.working_days,
      totalWorkHours: scheduleResponse.summary.total_work_hours,
      
      // Efficiency Metrics
      timeSavedHours: scheduleResponse.time_savings_summary.total_time_saved_hours,
      fuelSavedGBP: scheduleResponse.time_savings_summary.total_fuel_saved_gbp,
      efficiencyGain: scheduleResponse.time_savings_summary.weekly_efficiency_gain,
      extraCustomersPossible: scheduleResponse.time_savings_summary.extra_customers_per_week,
      
      // Unscheduled Info
      unscheduledCustomers: scheduleResponse.unscheduled_customers,
      customersFromDatabase: scheduleResponse.customers_from_database,
      
      // Schedule Data
      dailySchedules: Object.keys(scheduleResponse.schedule).length,
      scheduleData: scheduleResponse.schedule
    };
  }

  /**
   * 📅 Get Today's Schedule
   * Extract just today's customers and route from the optimized schedule
   */
  getTodaysSchedule(scheduleResponse: OptimizedScheduleResponse): DaySchedule | null {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return scheduleResponse.schedule[today] || null;
  }



  /**
   * 🧠 SMART OPTIMIZATION
   * 
   * Intelligent one-button optimization that automatically handles:
   * - First-time users: Optimizes all days 
   * - Returning users: Protects today/tomorrow, optimizes rest
   */
  async smartOptimizeSchedule(
    userId: string,
    workSchedule: WorkSchedule,
    cleanerLocation?: CleanerLocation
  ): Promise<OptimizedScheduleResponse & { isFirstTime: boolean; protectedDates?: string[] }> {
    try {
      const requestData: ExpressScheduleRequest = {
        work_schedule: workSchedule,
        cleaner_start_location: cleanerLocation || { lat: 51.5074, lng: -0.1278 }
      };

      console.log(`🧠 Starting smart optimization for user: ${userId}`);
      console.log(`📊 Work Schedule:`, workSchedule);
      
      const response: AxiosResponse<{ success: boolean; data: OptimizedScheduleResponse & { isFirstTime: boolean; protectedDates?: string[] } }> = await axios.post(
        `${this.baseUrl}/schedule/smart-optimize/${userId}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        }
      );

      const serverResponse = response.data;
      
      if (!serverResponse.success || !serverResponse.data) {
        throw new Error('Invalid response from server');
      }
      
      // Map the server response to the expected format
      const responseData = serverResponse.data as any;
      const result = {
        ...responseData,
        schedule: responseData.fullSchedule,
        summary: responseData.summary,
        time_savings_summary: responseData.timeSavings,
        unscheduled_customers: responseData.unscheduledCustomers,
        customers_from_database: responseData.customersFromDatabase
      };
      
      if (result.isFirstTime) {
        console.log(`🎉 First-time optimization completed!`);
        console.log(`📈 ${result.summary.total_customers_scheduled} customers scheduled across ${result.summary.working_days} days`);
      } else {
        console.log(`🔄 Smart re-optimization completed!`);
        console.log(`🛡️  Protected dates: ${result.protectedDates?.join(', ') || 'none'}`);
        console.log(`📈 ${result.summary.total_customers_scheduled} customers optimized`);
      }
      
      console.log(`💰 Total revenue: £${result.summary.total_revenue}`);
      
      return result;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.detail || error.message;
        
        console.error(`❌ Smart Optimization Error (${status}):`, message);
        
        if (status === 404) {
          throw new Error(`No customers found for user ${userId}. Please ensure you have customers before optimizing.`);
        } else if (status === 500) {
          throw new Error(`Smart optimization error: ${message}`);
        } else {
          throw new Error(`Smart optimization failed: ${message}`);
        }
      } else {
        console.error('❌ Network Error:', error);
        throw new Error(`Network error: Unable to connect to optimization service at ${this.baseUrl}`);
      }
    }
  }
}

// Export a default instance
// Use IP address for mobile compatibility instead of localhost
export default new WindowCleanerOptimizationService('http://192.168.1.120:3000/api');