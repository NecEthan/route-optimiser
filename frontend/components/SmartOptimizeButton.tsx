/**
 * 🧠 Smart Optimization Button Component
 * 
 * Example React component that demonstrates how to use the smart one-button optimization system.
 * This component automatically handles first-time vs returning user scenarios.
 */

import React, { useState } from 'react';
import { handleSmartOptimizeClick, formatOptimizationMessage, type SmartOptimizationResult } from '../utils/smartOptimization';
import type { WorkSchedule, CleanerLocation } from '../services/windowCleaner';

interface SmartOptimizeButtonProps {
  userId: string;
  workSchedule?: WorkSchedule;
  cleanerLocation?: CleanerLocation;
  buttonText?: string;
  className?: string;
}

/**
 * 🎯 SMART OPTIMIZE BUTTON
 * 
 * Drop this component anywhere in your app for instant smart optimization!
 * 
 * Features:
 * - One-button optimization
 * - Automatic first-time vs returning user detection
 * - Loading states and user-friendly messages
 * - Error handling with helpful messages
 */
export function SmartOptimizeButton({
  userId,
  workSchedule,
  cleanerLocation,
  buttonText = "🧠 Smart Optimize",
  className = ""
}: SmartOptimizeButtonProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<SmartOptimizationResult | null>(null);
  const [showMessage, setShowMessage] = useState(false);

  const handleOptimize = async () => {
    try {
      // Clear previous results
      setResult(null);
      setShowMessage(false);

      console.log(`🧠 User clicked smart optimize button for user: ${userId}`);

      // Call the smart optimization function
      const optimizationResult = await handleSmartOptimizeClick(
        userId,
        setIsOptimizing,
        workSchedule,
        cleanerLocation
      );

      // Show results
      setResult(optimizationResult);
      setShowMessage(true);

      // Auto-hide success messages after 10 seconds
      if (optimizationResult.success) {
        setTimeout(() => {
          setShowMessage(false);
        }, 10000);
      }

    } catch (error) {
      console.error('❌ Unexpected error in button handler:', error);
      setResult({
        success: false,
        message: '❌ Unexpected error occurred. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setShowMessage(true);
    }
  };

  const dismissMessage = () => {
    setShowMessage(false);
    setResult(null);
  };

  const formattedMessage = result ? formatOptimizationMessage(result) : null;

  return (
    <div className="smart-optimize-container">
      {/* Smart Optimize Button */}
      <button
        onClick={handleOptimize}
        disabled={isOptimizing}
        className={`smart-optimize-btn ${className} ${isOptimizing ? 'optimizing' : ''}`}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '8px',
          cursor: isOptimizing ? 'not-allowed' : 'pointer',
          backgroundColor: isOptimizing ? '#cccccc' : '#007bff',
          color: 'white',
          transition: 'all 0.3s ease',
          opacity: isOptimizing ? 0.7 : 1,
          ...isOptimizing && { transform: 'scale(0.98)' }
        }}
      >
        {isOptimizing ? (
          <>
            <span className="spinner">⏳</span> Optimizing...
          </>
        ) : (
          buttonText
        )}
      </button>

      {/* Loading Message */}
      {isOptimizing && (
        <div className="loading-message" style={{ marginTop: '12px', color: '#666' }}>
          🔄 Analyzing your schedule and optimizing routes...
        </div>
      )}

      {/* Results Message */}
      {showMessage && result && formattedMessage && (
        <div 
          className={`result-message ${formattedMessage.type}`}
          style={{
            marginTop: '16px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: formattedMessage.type === 'success' ? '#d4edda' : '#f8d7da',
            border: `1px solid ${formattedMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
            color: formattedMessage.type === 'success' ? '#155724' : '#721c24'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                {formattedMessage.title}
              </h4>
              <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                {formattedMessage.description}
              </div>
            </div>
            <button
              onClick={dismissMessage}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0 0 0 12px',
                color: formattedMessage.type === 'success' ? '#155724' : '#721c24'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Note: Add these CSS classes to your global CSS file */}
      {/*
        .spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .smart-optimize-btn:hover:not(:disabled) {
          background-color: #0056b3 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
        }
        
        .result-message {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      */}
    </div>
  );
}

/**
 * 📊 OPTIMIZATION RESULTS DISPLAY
 * 
 * Optional component to display detailed optimization results
 */
interface OptimizationResultsProps {
  result: SmartOptimizationResult;
  onClose?: () => void;
}

export function OptimizationResults({ result, onClose }: OptimizationResultsProps) {
  if (!result.success || !result.data) {
    return null;
  }

  const data = result.data;
  const isFirstTime = data.isFirstTime;

  return (
    <div className="optimization-results" style={{
      marginTop: '20px',
      padding: '20px',
      borderRadius: '12px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: '#495057' }}>
          {isFirstTime ? '🎉 Optimization Complete!' : '🔄 Schedule Updated!'}
        </h3>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>
            ×
          </button>
        )}
      </div>

      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="metric-card" style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
            {data.summary.total_customers_scheduled}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Customers Scheduled</div>
        </div>

        <div className="metric-card" style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            £{data.summary.total_revenue}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Weekly Revenue</div>
        </div>

        <div className="metric-card" style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
            {data.summary.working_days}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Working Days</div>
        </div>
      </div>

      {!isFirstTime && data.protectedDates && data.protectedDates.length > 0 && (
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '8px' }}>
          <strong>🛡️ Protected Dates:</strong>
          <div style={{ marginTop: '8px' }}>
            {data.protectedDates.map((date: string, index: number) => (
              <span key={index} style={{
                display: 'inline-block',
                padding: '4px 8px',
                margin: '2px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {date}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 🚀 COMPLETE EXAMPLE USAGE
 * 
 * Here's how to use the smart optimization system in your app:
 * 
 * ```jsx
 * import { SmartOptimizeButton, OptimizationResults } from './components/SmartOptimizeButton';
 * 
 * function MySchedulePage() {
 *   const [optimizationResult, setOptimizationResult] = useState(null);
 *   const userId = "user123"; // Get from your auth system
 * 
 *   return (
 *     <div>
 *       <h1>My Window Cleaning Schedule</h1>
 *       
 *       <SmartOptimizeButton 
 *         userId={userId}
 *         buttonText="🧠 Optimize My Route"
 *         className="my-custom-button-class"
 *       />
 *       
 *       {optimizationResult && (
 *         <OptimizationResults 
 *           result={optimizationResult}
 *           onClose={() => setOptimizationResult(null)}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */