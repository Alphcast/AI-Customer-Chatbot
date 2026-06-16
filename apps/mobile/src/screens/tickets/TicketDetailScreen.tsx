import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTicketStore } from '../../store/ticket-store';
import { getTicket } from '@shared/api-client';

export function TicketDetailScreen() {
  const route = useRoute();
  const { ticketId } = route.params as { ticketId: string };
  const { activeTicket, setActiveTicket, isLoading, setLoading } = useTicketStore();

  useEffect(() => {
    loadTicket();
  }, []);

  const loadTicket = async () => {
    setLoading(true);
    try {
      const response = await getTicket(ticketId);
      setActiveTicket(response.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !activeTicket) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{activeTicket.title}</Text>
      <Text style={styles.description}>{activeTicket.description}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{activeTicket.status}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.label}>Priority:</Text>
        <Text style={styles.value}>{activeTicket.priority}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.label}>Created:</Text>
        <Text style={styles.value}>{new Date(activeTicket.createdAt).toLocaleDateString()}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  description: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 24 },
  metaRow: { flexDirection: 'row', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', width: 80 },
  value: { fontSize: 14, color: '#666' },
});
