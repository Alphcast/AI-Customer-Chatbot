import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useChatStore } from '../../store/chat-store';
import { getMessages, sendMessage } from '@shared/api-client';
import { io, Socket } from 'socket.io-client';
import { config } from '@shared/config';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

export function ChatDetailScreen({ navigation, route }: Props) {
  const { conversationId } = route.params as { conversationId: string };
  const { messages, setMessages, addMessage } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    connectSocket();
    return () => {
      socket?.disconnect();
    };
  }, []);

  const loadMessages = async () => {
    try {
      const response = await getMessages(conversationId);
      setMessages(response.data || []);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const connectSocket = () => {
    const s = io(`${config.api.socketUrl}/chat`, {
      auth: { token: '' },
      transports: ['websocket'],
    });
    s.on('message:new', (msg: any) => {
      addMessage(msg);
    });
    s.connect();
    setSocket(s);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    try {
      await sendMessage(conversationId, { content: inputText.trim() });
      setInputText('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const renderMessage = ({ item }: any) => {
    const isCustomer = item.senderType === 'customer';
    return (
      <View style={[styles.messageBubble, isCustomer ? styles.customerMsg : styles.agentMsg]}>
        <Text style={[styles.messageText, isCustomer ? styles.customerMsgText : styles.agentMsgText]}>
          {item.content}
        </Text>
        <Text style={[styles.messageTime, isCustomer ? styles.customerMsgText : styles.agentMsgText]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  messageList: { padding: 16 },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  customerMsg: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  agentMsg: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: { fontSize: 16, lineHeight: 22 },
  customerMsgText: { color: '#fff' },
  agentMsgText: { color: '#1a1a1a' },
  messageTime: { fontSize: 11, marginTop: 4, opacity: 0.7 },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
