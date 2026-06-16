import { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTicketStore } from '../../store/ticket-store';
import { getTickets } from '@shared/api-client';
import { TICKET_STATUSES } from '@shared/constants';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const statusColors: Record<string, string> = {
  OPEN: '#f59e0b',
  PENDING: '#6b7280',
  IN_PROGRESS: '#3b82f6',
  RESOLVED: '#10b981',
  CLOSED: '#9ca3af',
};

export function TicketListScreen({ navigation }: Props) {
  const { tickets, setTickets, isLoading, setLoading } = useTicketStore();

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await getTickets();
      setTickets(response.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.ticketItem}
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#6b7280' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.ticketDescription} numberOfLines={2}>{item.description}</Text>
      <View style={styles.ticketMeta}>
        <Text style={styles.metaText}>{item.priority}</Text>
        <Text style={styles.metaText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No tickets found</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ticketItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ticketTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  ticketDescription: { fontSize: 14, color: '#666', marginBottom: 8 },
  ticketMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 12, color: '#9ca3af' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 48, fontSize: 16 },
});
