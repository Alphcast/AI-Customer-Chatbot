import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getDashboardStats } from '@shared/api-client';

export function DashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats?.totalConversations || 0}</Text>
          <Text style={styles.cardLabel}>Conversations</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats?.activeConversations || 0}</Text>
          <Text style={styles.cardLabel}>Active</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats?.resolvedToday || 0}</Text>
          <Text style={styles.cardLabel}>Resolved Today</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats?.avgResponseTime || 0}s</Text>
          <Text style={styles.cardLabel}>Avg Response</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  card: {
    width: '46%',
    backgroundColor: '#fff',
    margin: '2%',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardValue: { fontSize: 32, fontWeight: '700', color: '#2563eb', marginBottom: 4 },
  cardLabel: { fontSize: 14, color: '#666' },
});
