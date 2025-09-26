/**
 * 🧠 Smart Optimization Frontend Utility
 * 
 * Simple frontend function that handles the smart one-button optimization system.
 * Automatically detects first-time vs returning users and shows appropriate messages.
 */

import windowCleanerService from '../services/windowCleaner';
import type { WorkSchedule, CleanerLocation } from '../services/windowCleaner';

export interface SmartOptimizationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * 🎯 ONE-BUTTON SMART OPTIMIZATION
 * 
 * This function handles everything:
 * - Calls your Express backend smart optimization endpoint
 * - Automatically handles first-time vs returning user scenarios
 * - Returns user-friendly success/error messages
 * - Works with protected dates for returning users
 */
export async function smartOptimize(
  userId: string,
  workSchedule?: WorkSchedule,
  cleanerLocation?: CleanerLocation
): Promise<SmartOptimizationResult> {
  try {
    // Use default work schedule if none provided (8 hours per day, weekdays only)
    const defaultWorkSchedule: WorkSchedule = workSchedule || {
      monday_hours: 8,
      tuesday_hours: 8,
      wednesday_hours: 8,
      thursday_hours: 8,
      friday_hours: 8,
      saturday_hours: null,
      sunday_hours: null
    };

    console.log(`🧠 Starting smart optimization for user: ${userId}`);

    // Call the smart optimization service
    const result = await windowCleanerService.smartOptimizeSchedule(
      userId,
      defaultWorkSchedule,
      cleanerLocation
    );

    // Generate user-friendly success message based on whether this is first-time or returning user
    let message: string;
    
    if (result.isFirstTime) {
      message = `🎉 Welcome! Your schedule has been optimized for the first time!\n\n` +
                `📈 ${result.summary.total_customers_scheduled} customers scheduled across ${result.summary.working_days} days\n` +
                `💰 Total weekly revenue: £${result.summary.total_revenue}\n\n` +
                `✨ Your optimized route minimizes travel time and maximizes efficiency!`;
    } else {
      const protectedInfo = result.protectedDates && result.protectedDates.length > 0 
        ? `🛡️  Protected dates: ${result.protectedDates.join(', ')}\n`
        : '';
      
      message = `🔄 Schedule re-optimized successfully!\n\n` +
                protectedInfo +
                `📈 ${result.summary.total_customers_scheduled} customers optimized\n` +
                `💰 Total weekly revenue: £${result.summary.total_revenue}\n\n` +
                `✨ Your route has been updated while protecting your current commitments!`;
    }

    return {
      success: true,
      message,
      data: result
    };

  } catch (error: any) {
    console.error('❌ Smart optimization failed:', error.message);
    
    // Return user-friendly error messages
    let errorMessage: string;
    
    if (error.message.includes('No customers found')) {
      errorMessage = `😔 No customers found for your account.\n\nPlease add some customers before optimizing your schedule.`;
    } else if (error.message.includes('Network error')) {
      errorMessage = `🌐 Connection problem.\n\nPlease check your internet connection and try again.`;
    } else if (error.message.includes('Smart optimization error')) {
      errorMessage = `⚙️  Optimization service error.\n\nPlease try again in a moment. If the problem persists, contact support.`;
    } else {
      errorMessage = `❌ Unexpected error occurred.\n\n${error.message}`;
    }

    return {
      success: false,
      message: errorMessage,
      error: error.message
    };
  }
}

/**
 * 📱 SIMPLE BUTTON HANDLER
 * 
 * Use this function directly in your React component button onClick handler
 * 
 * Example usage:
 * ```jsx
 * import { handleSmartOptimizeClick } from '../utils/smartOptimization';
 * 
 * function OptimizeButton({ userId }) {
 *   const [isOptimizing, setIsOptimizing] = useState(false);
 *   const [message, setMessage] = useState('');
 * 
 *   const handleClick = async () => {
 *     const result = await handleSmartOptimizeClick(userId, setIsOptimizing);
 *     setMessage(result.message);
 *   };
 * 
 *   return (
 *     <button onClick={handleClick} disabled={isOptimizing}>
 *       {isOptimizing ? 'Optimizing...' : '🧠 Smart Optimize'}
 *     </button>
 *   );
 * }
 * ```
 */
export async function handleSmartOptimizeClick(
  userId: string,
  setLoading?: (loading: boolean) => void,
  workSchedule?: WorkSchedule,
  cleanerLocation?: CleanerLocation
): Promise<SmartOptimizationResult> {
  
  if (setLoading) setLoading(true);
  
  try {
    const result = await smartOptimize(userId, workSchedule, cleanerLocation);
    return result;
  } finally {
    if (setLoading) setLoading(false);
  }
}

/**
 * 🎨 MESSAGE FORMATTING UTILITY
 * 
 * Formats the result message for different UI components
 */
export function formatOptimizationMessage(result: SmartOptimizationResult): {
  title: string;
  description: string;
  type: 'success' | 'error';
} {
  if (result.success) {
    const isFirstTime = result.data?.isFirstTime;
    return {
      title: isFirstTime ? '🎉 Schedule Created!' : '🔄 Schedule Updated!',
      description: result.message,
      type: 'success'
    };
  } else {
    return {
      title: '❌ Optimization Failed',
      description: result.message,
      type: 'error'
    };
  }
}