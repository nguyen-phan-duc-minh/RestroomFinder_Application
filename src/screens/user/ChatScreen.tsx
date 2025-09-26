import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';

import { RootStackParamList } from '../../../App';
import { useUser } from '../../context/UserContext';
import { ChatMessage } from '../../types';
import { api } from '../../services/api';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const { restaurantId } = route.params;
  const { user } = useUser();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const fetchMessages = async () => {
    try {
      const data = await api.getMessages(restaurantId);
      setMessages(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageData = {
      restroom_id: restaurantId,
      user_id: user.id,
      message: newMessage.trim(),
      message_type: 'normal' as const,
    };

    try {
      const success = await api.sendMessage(messageData);
      if (success) {
        setNewMessage('');
        // Add message optimistically
        const optimisticMessage: ChatMessage = {
          id: Date.now(),
          user_id: user.id,
          message: messageData.message,
          message_type: 'normal',
          is_from_admin: false,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticMessage]);
        
        // Fetch fresh messages after a short delay
        setTimeout(fetchMessages, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'sos':
        return <Ionicons name="warning" size={16} color="#FF4444" />;
      case 'paper_request':
        return <Ionicons name="newspaper" size={16} color="#007AFF" />;
      default:
        return null;
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.user_id === user?.id && !item.is_from_admin;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          item.message_type === 'sos' && styles.sosMessage,
        ]}>
          <View style={styles.messageHeader}>
            {getMessageTypeIcon(item.message_type)}
            {item.is_from_admin && (
              <Text style={styles.adminLabel}>Quản lý</Text>
            )}
          </View>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            item.message_type === 'sos' && styles.sosMessageText,
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
          ]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải tin nhắn...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Ionicons name="chatbubble" size={24} color="#007AFF" />
        <Text style={styles.headerTitle}>Chat với quản lý</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Nhập tin nhắn..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
  },
  otherBubble: {
    backgroundColor: 'white',
  },
  sosMessage: {
    backgroundColor: '#FFE6E6',
    borderColor: '#FF4444',
    borderWidth: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  sosMessageText: {
    color: '#FF4444',
    fontWeight: 'bold',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default ChatScreen;