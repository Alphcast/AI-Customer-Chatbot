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
import { useChatStore } from '../../store/chat-store';
import { getConversations } from '@shared/api-client';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function ChatListScreen({ navigation }: Props) {
  const { conversations, setConversations, isLoading, setLoading, setError, error } = useChatStore();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await getConversations();
      setConversations(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('ChatDetail', { conversationId: item.id })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.customer?.firstName?.[0] || '?').toUpperCase()}
        </Text>
      </View>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationName}>
          {item.customer?.firstName || 'Unknown'} {item.customer?.lastName || ''}
        </Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No conversations yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  conversationInfo: { flex: 1 },
  conversationName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  lastMessage: { fontSize: 14, color: '#666' },
  unreadBadge: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
  error: { color: '#dc2626', padding: 16, fontSize: 14 },
});
