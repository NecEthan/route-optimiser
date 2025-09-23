import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from "@/lib";
import { useFocusEffect } from '@react-navigation/native';
import AddExpenseModal from '@/components/ui/add-expense-modal';

type TabType = 'income' | 'expenses' | 'profit';

// Transaction interface for standardized display format
interface Transaction {
  id: string;
  job_id?: string;
  customer_id?: string;
  user_id?: string;
  invoice_number?: string;
  amount: number;
  status: string; // 'pending', 'sent', 'paid', 'overdue'
  method?: string; // 'cash', 'bank', 'card'
  due_date?: string;
  sent_at?: string;
  paid_at?: string;
  created_at: string;
  notes?: string;
  date: string; // For display purposes (mapped from paid_at or created_at)
  description: string; // For display purposes
  type: 'income' | 'expense';
  category: string; // For display purposes (mapped from method)
}

interface Payment {
  id: string;
  job_id?: string;
  customer_id?: string;
  user_id?: string;
  invoice_number?: string;
  amount: number;
  status: string; // 'pending', 'sent', 'paid', 'overdue'
  method?: string; // 'cash', 'bank', 'card'
  due_date?: string;
  sent_at?: string;
  paid_at?: string;
  created_at: string;
  notes?: string;
  customers?: {
    name: string;
    email?: string;
    phone?: string;
  };
}

interface Expense {
  id: string;
  amount: number;
  expense_date: string;
  category: string;
  notes?: string;
}

export default function AccountingScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('income');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchPayments();
  }, []);

  // Refresh data when the screen becomes focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Accounting screen focused - refreshing data...');
      fetchExpenses();
      fetchPayments();
    }, [])
  );

  const fetchPayments = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/accounting/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      console.log(data, 'DATA FROM PAYMENTS API');
      if (data.success) {
        setPayments(data.data);
        console.log('✅ Payments updated:', payments, 'PAYMENTSSSS');
      } else {
        setError(data.message || 'Failed to fetch payments');
        console.error("Failed to fetch payments:", data.message);
      }
    }
    catch (error) {
      setError('Error fetching payments');
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

   const fetchExpenses = async (showRefreshing = false) => {
      try {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);
        setError(null);
        
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
          setError('No authentication token found');
          return;
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/accounting/expenses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        const data = await response.json();
        if (data.success) {
          setExpenses(data.data);
          console.log('✅ Expenses updated:', data.data.length, 'expenses loaded');
        } else {
          setError(data.message || 'Failed to fetch expenses');
          console.error("Failed to fetch expenses:", data.message);
        }
      }
      catch (error) {
        setError('Error fetching expenses');
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await Promise.all([
      fetchPayments(true),
      fetchExpenses(true)
    ]);
  };

  const handleExpenseAdded = () => {
    console.log('💰 Expense added - refreshing data...');
    handleRefresh();
  };


  // Convert API expenses to Transaction format for display
  const expenseTransactions: Transaction[] = expenses.map(expense => ({
    id: expense.id,
    date: expense.expense_date,
    description: expense.notes || `${expense.category} expense`,
    amount: typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount,
    status: 'paid', // Expenses are considered paid when recorded
    created_at: expense.expense_date, // Use expense_date as created_at
    type: 'expense' as const,
    category: expense.category
  }));

  // Convert API payments to Transaction format for display (income)
  const incomeTransactions: Transaction[] = payments
    // .filter(payment => payment.status === 'paid')
    .map(payment => ({
      id: payment.id,
      job_id: payment.job_id,
      customer_id: payment.customer_id,
      user_id: payment.user_id,
      invoice_number: payment.invoice_number,
      amount: typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount,
      status: payment.status,
      method: payment.method,
      due_date: payment.due_date,
      sent_at: payment.sent_at,
      paid_at: payment.paid_at,
      created_at: payment.created_at,
      notes: payment.notes,
      date: payment.paid_at || payment.created_at, // For display
      description: payment.customers?.name 
        ? `Payment from ${payment.customers.name}${payment.invoice_number ? ` (Invoice: ${payment.invoice_number})` : ''}` 
        : payment.notes || `${payment.method} payment`, // For display
      type: 'income' as const,
      category: payment.method || 'cash' // For display
    }));

  console.log("Fetched expenses:", expenseTransactions);
  console.log("Fetched income payments ----____-------__--:", incomeTransactions);
  
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'income':
        return {
          transactions: incomeTransactions,
          total: totalIncome,
          color: '#28a745',
          icon: 'trending-up' as const,
          emptyMessage: 'No income recorded'
        };
      case 'expenses':
        return {
          transactions: expenseTransactions,
          total: totalExpenses,
          color: '#dc3545',
          icon: 'trending-down' as const,
          emptyMessage: 'No expenses recorded'
        };
      case 'profit':
        const allTransactions = [...incomeTransactions, ...expenseTransactions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return {
          transactions: allTransactions,
          total: netProfit,
          color: netProfit >= 0 ? '#28a745' : '#dc3545',
          icon: netProfit >= 0 ? 'trending-up' as const : 'trending-down' as const,
          emptyMessage: 'No transactions'
        };
    }
  };

  const tabContent = getTabContent();

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Accounting</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading accounting data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Accounting</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#dc3545" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            setError(null);
            handleRefresh();
          }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Accounting</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={refreshing ? "#999" : "#007AFF"} 
              style={refreshing ? styles.spinning : undefined}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddExpenseModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'income' && styles.activeTab]}
          onPress={() => setActiveTab('income')}
        >
          <Ionicons
            name="trending-up"
            size={20}
            color={activeTab === 'income' ? '#fff' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>
            Income
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Ionicons
            name="trending-down"
            size={20}
            color={activeTab === 'expenses' ? '#fff' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Expenses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'profit' && styles.activeTab]}
          onPress={() => setActiveTab('profit')}
        >
          <Ionicons
            name="analytics"
            size={20}
            color={activeTab === 'profit' ? '#fff' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'profit' && styles.activeTabText]}>
            Net Profit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { borderLeftColor: tabContent.color }]}>
          <View style={styles.summaryHeader}>
            <Ionicons name={tabContent.icon} size={24} color={tabContent.color} />
            <Text style={styles.summaryTitle}>
              {activeTab === 'income' && 'Total Income'}
              {activeTab === 'expenses' && 'Total Expenses'}
              {activeTab === 'profit' && 'Net Profit'}
            </Text>
          </View>
          <Text style={[styles.summaryAmount, { color: tabContent.color }]}>
            {formatCurrency(tabContent.total)}
          </Text>
          <Text style={styles.summaryPeriod}>This Month</Text>
        </View>
      </View>

      {/* Quick Stats */}
      {activeTab === 'profit' && (
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statValue, { color: '#28a745' }]}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statValue, { color: '#dc3545' }]}>
              {formatCurrency(totalExpenses)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Margin</Text>
            <Text style={[styles.statValue, { color: netProfit >= 0 ? '#28a745' : '#dc3545' }]}>
              {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0'}%
            </Text>
          </View>
        </View>
      )}

      {/* Transactions List */}
      <ScrollView style={styles.transactionsContainer}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>
            Recent {activeTab === 'profit' ? 'Transactions' : activeTab}
          </Text>
          <Text style={styles.transactionCount}>
            {tabContent.transactions.length} items
          </Text>
        </View>

        {tabContent.transactions.length > 0 ? (
          tabContent.transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={styles.transactionDate}>
                  <Text style={styles.dateText}>{formatDate(transaction.date)}</Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription} numberOfLines={2}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDescription} numberOfLines={2}>
                    {transaction.status}
                  </Text>
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color: transaction.type === 'income' ? '#28a745' : '#dc3545'
                    }
                  ]}
                >
                  {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>{tabContent.emptyMessage}</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <AddExpenseModal
        visible={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onExpenseAdded={handleExpenseAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinning: {
    transform: [{ rotate: '180deg' }],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryPeriod: {
    fontSize: 14,
    color: '#666',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 15,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  transactionCount: {
    fontSize: 14,
    color: '#666',
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionDate: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});