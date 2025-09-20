import React, { useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';

type TabType = 'income' | 'expenses' | 'profit';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

export default function AccountingScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('income');

  // Mock financial data
  const transactions: Transaction[] = [
    { id: '1', date: '2025-09-20', description: 'Window cleaning - Smith residence', amount: 150.00, type: 'income', category: 'Service' },
    { id: '2', date: '2025-09-19', description: 'Office building cleaning', amount: 450.00, type: 'income', category: 'Commercial' },
    { id: '3', date: '2025-09-18', description: 'Cleaning supplies', amount: 85.50, type: 'expense', category: 'Materials' },
    { id: '4', date: '2025-09-17', description: 'Gas for van', amount: 45.00, type: 'expense', category: 'Transportation' },
    { id: '5', date: '2025-09-16', description: 'Residential cleaning - Jones house', amount: 120.00, type: 'income', category: 'Service' },
    { id: '6', date: '2025-09-15', description: 'Equipment maintenance', amount: 200.00, type: 'expense', category: 'Equipment' },
    { id: '7', date: '2025-09-14', description: 'Commercial cleaning - Plaza Mall', amount: 800.00, type: 'income', category: 'Commercial' },
    { id: '8', date: '2025-09-13', description: 'Insurance payment', amount: 300.00, type: 'expense', category: 'Insurance' },
  ];

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
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
        return {
          transactions: transactions,
          total: netProfit,
          color: netProfit >= 0 ? '#28a745' : '#dc3545',
          icon: netProfit >= 0 ? 'trending-up' as const : 'trending-down' as const,
          emptyMessage: 'No transactions'
        };
    }
  };

  const tabContent = getTabContent();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Accounting</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
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
});