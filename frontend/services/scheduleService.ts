import windowCleanerService from './windowCleaner';

export interface ScheduleCustomer {
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

export interface DaySchedule {
  date: string;
  day: string;
  max_hours: number;
  customers: ScheduleCustomer[];
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

export interface ScheduleSummary {
  total_customers_scheduled: number;
  total_revenue: number;
  total_work_hours: number;
  working_days: number;
  average_customers_per_day: number;
  average_revenue_per_day: number;
}

export interface TimeSavingsSummary {
  total_time_saved_minutes: number;
  total_time_saved_hours: number;
  total_fuel_saved_gbp: number;
  extra_customers_per_week: number;
  weekly_efficiency_gain: string;
}

export interface OptimizedSchedule {
  user_id: string;
  express_integration: boolean;
  work_schedule_received: {
    monday_hours?: number | null;
    tuesday_hours?: number | null;
    wednesday_hours?: number | null;
    thursday_hours?: number | null;
    friday_hours?: number | null;
    saturday_hours?: number | null;
    sunday_hours?: number | null;
  };
  customers_from_database: number;
  schedule: { [date: string]: DaySchedule };
  summary: ScheduleSummary;
  time_savings_summary: TimeSavingsSummary;
  unscheduled_customers: number;
  message: string;
}

class ScheduleService {
  private cachedSchedule: OptimizedSchedule | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get optimized schedule with caching
   */
  async getOptimizedSchedule(userId: string = "947af734-4e40-44f7-8d8e-d0f304dee2dd"): Promise<OptimizedSchedule | null> {
    try {
      // Check if we have valid cached data
      const now = Date.now();
      if (this.cachedSchedule && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
        console.log('📦 Using cached schedule data');
        return this.cachedSchedule;
      }

      console.log('🔄 Fetching new optimized schedule...');
      
      // Define the work schedule - could be made configurable later
      const workSchedule = {
        monday_hours: 8,
        tuesday_hours: 8,
        wednesday_hours: 8,
        thursday_hours: 8,
        friday_hours: 8,
        saturday_hours: 4,
        sunday_hours: null
      };
      
      // Optional: cleaner starting location (London coordinates as default)
      const cleanerLocation = {
        lat: 51.5074,
        lng: -0.1278
      };
      
      const result = await windowCleanerService.generate1WeekSchedule(
        userId,
        workSchedule,
        cleanerLocation
      );
      
      if (result.success && result.data) {
        console.log('✅ Successfully fetched optimized schedule');
        this.cachedSchedule = result.data;
        this.cacheTimestamp = now;
        return result.data;
      } else {
        console.error('❌ Failed to fetch schedule:', result.error);
        return null;
      }
    } catch (error: any) {
      console.error('❌ Error fetching optimized schedule:', error);
      return null;
    }
  }

  /**
   * Get schedule for a specific date
   */
  async getScheduleForDate(date: string, userId?: string): Promise<DaySchedule | null> {
    try {
      const schedule = await this.getOptimizedSchedule(userId);
      if (!schedule) return null;

      return schedule.schedule[date] || null;
    } catch (error) {
      console.error(`❌ Error getting schedule for date ${date}:`, error);
      return null;
    }
  }

  /**
   * Get all available dates in the schedule
   */
  async getAvailableDates(userId?: string): Promise<string[]> {
    try {
      const schedule = await this.getOptimizedSchedule(userId);
      if (!schedule) return [];

      return Object.keys(schedule.schedule).sort();
    } catch (error) {
      console.error('❌ Error getting available dates:', error);
      return [];
    }
  }

  /**
   * Get today's schedule
   */
  async getTodaysSchedule(userId?: string): Promise<DaySchedule | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.getScheduleForDate(today, userId);
  }

  /**
   * Clear cache (useful for refresh)
   */
  clearCache(): void {
    this.cachedSchedule = null;
    this.cacheTimestamp = 0;
    console.log('🗑️ Schedule cache cleared');
  }

  /**
   * Get schedule summary
   */
  async getScheduleSummary(userId?: string): Promise<ScheduleSummary | null> {
    try {
      const schedule = await this.getOptimizedSchedule(userId);
      return schedule?.summary || null;
    } catch (error) {
      console.error('❌ Error getting schedule summary:', error);
      return null;
    }
  }

  /**
   * Get time savings summary
   */
  async getTimeSavingsSummary(userId?: string): Promise<TimeSavingsSummary | null> {
    try {
      const schedule = await this.getOptimizedSchedule(userId);
      return schedule?.time_savings_summary || null;
    } catch (error) {
      console.error('❌ Error getting time savings summary:', error);
      return null;
    }
  }
}

export const scheduleService = new ScheduleService();
export default scheduleService;