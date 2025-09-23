import { supabase } from './supabase';

export interface WorkSchedule {
  id?: string;
  user_id: string;
  hours_per_day: number;
  work_monday: boolean;
  work_tuesday: boolean;
  work_wednesday: boolean;
  work_thursday: boolean;
  work_friday: boolean;
  work_saturday: boolean;
  work_sunday: boolean;
  start_time?: string;
  end_time?: string;
  max_customers_per_day?: number;
  travel_time_buffer?: number;
  lunch_break_duration?: number;
  lunch_break_start?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleInput {
  hoursPerDay: number;
  workingDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
}

class ScheduleService {
  /**
   * Create a new work schedule for the current user
   */
  async createSchedule(scheduleData: ScheduleInput): Promise<WorkSchedule> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // First, deactivate any existing active schedules
      await this.deactivateExistingSchedules(user.id);

      // Create new schedule
      const newSchedule: Partial<WorkSchedule> = {
        user_id: user.id,
        hours_per_day: scheduleData.hoursPerDay,
        work_monday: scheduleData.workingDays.monday,
        work_tuesday: scheduleData.workingDays.tuesday,
        work_wednesday: scheduleData.workingDays.wednesday,
        work_thursday: scheduleData.workingDays.thursday,
        work_friday: scheduleData.workingDays.friday,
        work_saturday: scheduleData.workingDays.saturday,
        work_sunday: scheduleData.workingDays.sunday,
        start_time: '08:00:00',
        end_time: '17:00:00',
        max_customers_per_day: 10,
        travel_time_buffer: 15,
        lunch_break_duration: 30,
        lunch_break_start: '12:00:00',
        is_active: true,
      };

      const { data, error } = await supabase
        .from('work_schedules')
        .insert([newSchedule])
        .select()
        .single();

      if (error) {
        console.error('Error creating schedule:', error);
        throw error;
      }

      console.log('✅ Schedule created successfully:', data);
      return data;

    } catch (error) {
      console.error('❌ Error in createSchedule:', error);
      throw error;
    }
  }

  /**
   * Get the active work schedule for the current user
   */
  async getActiveSchedule(): Promise<WorkSchedule | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error getting active schedule:', error);
        throw error;
      }

      return data;

    } catch (error) {
      console.error('❌ Error in getActiveSchedule:', error);
      throw error;
    }
  }

  /**
   * Update an existing work schedule
   */
  async updateSchedule(scheduleId: string, updates: Partial<WorkSchedule>): Promise<WorkSchedule> {
    try {
      const { data, error } = await supabase
        .from('work_schedules')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating schedule:', error);
        throw error;
      }

      console.log('✅ Schedule updated successfully:', data);
      return data;

    } catch (error) {
      console.error('❌ Error in updateSchedule:', error);
      throw error;
    }
  }

  /**
   * Deactivate all existing schedules for a user
   */
  private async deactivateExistingSchedules(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('work_schedules')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error deactivating existing schedules:', error);
        throw error;
      }

      console.log('✅ Existing schedules deactivated');

    } catch (error) {
      console.error('❌ Error in deactivateExistingSchedules:', error);
      throw error;
    }
  }

  /**
   * Get all schedules for the current user (active and inactive)
   */
  async getAllSchedules(): Promise<WorkSchedule[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all schedules:', error);
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('❌ Error in getAllSchedules:', error);
      throw error;
    }
  }

  /**
   * Delete a work schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('work_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) {
        console.error('Error deleting schedule:', error);
        throw error;
      }

      console.log('✅ Schedule deleted successfully');

    } catch (error) {
      console.error('❌ Error in deleteSchedule:', error);
      throw error;
    }
  }

  /**
   * Get working days as an array of day names
   */
  getWorkingDaysList(schedule: WorkSchedule): string[] {
    const dayMapping = {
      work_sunday: 'Sunday',
      work_monday: 'Monday',
      work_tuesday: 'Tuesday',
      work_wednesday: 'Wednesday',
      work_thursday: 'Thursday',
      work_friday: 'Friday',
      work_saturday: 'Saturday',
    };

    return Object.entries(dayMapping)
      .filter(([key, _]) => schedule[key as keyof WorkSchedule])
      .map(([_, dayName]) => dayName);
  }

  /**
   * Check if a specific day is a working day
   */
  isWorkingDay(schedule: WorkSchedule, dayOfWeek: number): boolean {
    // dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayFields = [
      'work_sunday',
      'work_monday', 
      'work_tuesday',
      'work_wednesday',
      'work_thursday',
      'work_friday',
      'work_saturday',
    ];

    return schedule[dayFields[dayOfWeek] as keyof WorkSchedule] as boolean;
  }
}

export const scheduleService = new ScheduleService();
