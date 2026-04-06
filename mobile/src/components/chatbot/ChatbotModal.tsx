import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as Speech from 'expo-speech';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { colors, fontSize, spacing } from '../../styles/theme';

interface ChatMessage {
  id: number;
  type: 'bot' | 'user' | 'sos-suggestion';
  text?: string;
  timestamp: Date;
  isError?: boolean;
  emergencyType?: string;
}

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
  onSOSRequest?: (type: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const API_BASE_URL = 'http://192.168.1.100:8000'; // Update with your backend URL

const ChatbotModal: React.FC<ChatbotModalProps> = ({
  visible,
  onClose,
  onSOSRequest,
  userLocation,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'bot',
      text: "Hi! I'm your SafeNow safety assistant. I can help answer questions about safety precautions, first aid, and emergency situations. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sessionIdRef = useRef(`session-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Stop speech when modal closes
  useEffect(() => {
    if (!visible) {
      Speech.stop();
      setSpeakingMsgId(null);
    }
  }, [visible]);

  const detectEmergencyType = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();

    const keywords: Record<string, string[]> = {
      ambulance: [
        'accident', 'injured', 'bleeding', 'unconscious', 'heart attack',
        'stroke', 'breathing', 'medical', 'hospital', 'ambulance',
        'hurt', 'pain', 'broken', 'fell',
      ],
      fire: [
        'fire', 'smoke', 'burning', 'flames', 'explosion', 'gas leak',
      ],
      police: [
        'police', 'theft', 'stolen', 'robbery', 'assault', 'attacked',
        'threat', 'weapon', 'knife', 'gun', 'following', 'stalking',
        'harass', 'crime', 'intruder',
      ],
      ngo: [
        'help', 'shelter', 'support', 'homeless', 'food', 'counseling',
        'assistance', 'rescue',
      ],
    };

    for (const [type, typeKeywords] of Object.entries(keywords)) {
      if (typeKeywords.some((keyword) => lowerMessage.includes(keyword))) {
        return type;
      }
    }

    return null;
  };

  const shouldSuggestSOS = (userMessage: string, aiResponse: string): boolean => {
    const userText = userMessage.toLowerCase();
    const aiText = aiResponse.toLowerCase();

    const immediateEmergency = [
      'following me', 'chasing me', 'being followed', 'threatening me',
      'attacked', 'attacking me', 'assaulted', 'mugged', 'robbery',
      'knife', 'gun', 'weapon', 'trapped', 'unconscious', 'not breathing',
      'heart attack', 'chest pain', 'stroke', 'seizure', 'severe bleeding',
      'fire', 'smoke', 'explosion', 'gas leak',
    ];

    if (immediateEmergency.some((p) => userText.includes(p))) return true;

    const moderateSituation = [
      'homeless', 'no shelter', 'abuse', 'domestic violence',
      'injured', 'bleeding', 'burned', 'accident', 'broken',
    ];

    const aiRecommendsHelp = [
      'seek medical', 'medical attention', 'call emergency', 'emergency services',
      'contact', 'hospital', 'doctor', 'ambulance',
    ];

    const userHasRealProblem = moderateSituation.some((p) => userText.includes(p));
    const aiSaysGetHelp = aiRecommendsHelp.some((p) => aiText.includes(p));

    return userHasRealProblem && aiSaysGetHelp;
  };

  const speakText = useCallback(async (text: string, msgId: number) => {
    if (speakingMsgId === msgId) {
      await Speech.stop();
      setSpeakingMsgId(null);
      return;
    }

    await Speech.stop();
    const clean = text.replace(/^[•\-*\d]+[.)\s]*/gm, '').trim();

    Speech.speak(clean, {
      rate: 1.0,
      pitch: 1.0,
      onDone: () => setSpeakingMsgId(null),
      onError: () => setSpeakingMsgId(null),
    });

    setSpeakingMsgId(msgId);
  }, [speakingMsgId]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    const userMsgId = Date.now();

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        type: 'user',
        text: userMessage,
        timestamp: new Date(),
      },
    ]);

    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/sos/chatbot/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionIdRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from chatbot');
      }

      const data = await response.json();
      const aiResponse = data.response;

      const botMsgId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          type: 'bot',
          text: aiResponse,
          timestamp: new Date(),
        },
      ]);

      // Check if SOS should be suggested
      if (shouldSuggestSOS(userMessage, aiResponse)) {
        const emergencyType = detectEmergencyType(userMessage + ' ' + aiResponse);
        const typeMap: Record<string, string> = {
          ambulance: 'Ambulance',
          fire: 'Fire Emergency',
          police: 'Police',
          ngo: 'NGO Support',
        };
        const backendType = typeMap[emergencyType || 'ambulance'] || 'Ambulance';

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 2,
              type: 'sos-suggestion',
              emergencyType: backendType,
              timestamp: new Date(),
            },
          ]);
        }, 500);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'bot',
          text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or if this is an emergency, use the SOS button directly.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSOSClick = (emergencyType: string) => {
    if (!userLocation) {
      Alert.alert(
        'Location Required',
        'Unable to get your location. Please enable location access to send SOS.'
      );
      return;
    }

    if (onSOSRequest) {
      onSOSRequest(emergencyType);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: 'bot',
        text: `SOS request for ${emergencyType} has been sent! Help is on the way. Stay safe!`,
        timestamp: new Date(),
      },
    ]);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.type === 'sos-suggestion') {
      return (
        <View key={message.id} style={styles.sosSuggestion}>
          <View style={styles.sosSuggestionContent}>
            <AlertCircle color={colors.warning[500]} size={20} />
            <View style={styles.sosSuggestionText}>
              <Text style={styles.sosSuggestionLabel}>
                Do you want to send an SOS request for {message.emergencyType}?
              </Text>
              <TouchableOpacity
                style={styles.sosButton}
                onPress={() => handleSOSClick(message.emergencyType || 'Ambulance')}
              >
                <AlertCircle color="#fff" size={16} />
                <Text style={styles.sosButtonText}>Send SOS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    const isBot = message.type === 'bot';

    return (
      <View
        key={message.id}
        style={[styles.messageRow, isBot ? styles.messageRowBot : styles.messageRowUser]}
      >
        {isBot && (
          <View style={styles.botAvatar}>
            <Bot color="#fff" size={16} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isBot
              ? message.isError
                ? styles.messageBubbleError
                : styles.messageBubbleBot
              : styles.messageBubbleUser,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isBot ? styles.messageTextBot : styles.messageTextUser,
              message.isError && styles.messageTextError,
            ]}
          >
            {message.text}
          </Text>
          {isBot && !message.isError && (
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speakText(message.text || '', message.id)}
            >
              {speakingMsgId === message.id ? (
                <>
                  <VolumeX color={colors.dark[400]} size={14} />
                  <Text style={styles.speakButtonText}>Stop</Text>
                </>
              ) : (
                <>
                  <Volume2 color={colors.dark[400]} size={14} />
                  <Text style={styles.speakButtonText}>Listen</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
        </View>
        {!isBot && (
          <View style={styles.userAvatar}>
            <User color={colors.dark[300]} size={16} />
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <View style={styles.chatContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Bot color="#fff" size={20} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>SafeNow Assistant</Text>
                  <Text style={styles.headerSubtitle}>Safety Guidance</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X color="#fff" size={24} />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map(renderMessage)}

              {isLoading && (
                <View style={styles.messageRow}>
                  <View style={styles.botAvatar}>
                    <Bot color="#fff" size={16} />
                  </View>
                  <View style={styles.messageBubbleBot}>
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={colors.primary[500]} />
                      <Text style={styles.loadingText}>Thinking...</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputMessage}
                onChangeText={setInputMessage}
                placeholder="Ask a safety question..."
                placeholderTextColor={colors.dark[500]}
                multiline
                maxLength={500}
                editable={!isLoading}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                <Send color="#fff" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.disclaimer}>
              For life-threatening emergencies, use the main SOS button
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Floating Action Button to open chatbot
export const ChatbotFAB: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <MessageCircle color="#fff" size={24} />
      <View style={styles.fabBadge}>
        <Bot color="#fff" size={10} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    backgroundColor: colors.dark[900],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.primary[600],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  closeButton: {
    padding: spacing.xs,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.dark[900],
  },
  messagesContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dark[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageBubbleBot: {
    backgroundColor: colors.dark[800],
    borderBottomLeftRadius: 4,
  },
  messageBubbleUser: {
    backgroundColor: colors.primary[600],
    borderBottomRightRadius: 4,
  },
  messageBubbleError: {
    backgroundColor: colors.error[500] + '30',
    borderWidth: 1,
    borderColor: colors.error[500] + '50',
  },
  messageText: {
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  messageTextBot: {
    color: colors.dark[200],
  },
  messageTextUser: {
    color: '#fff',
  },
  messageTextError: {
    color: colors.error[400],
  },
  messageTime: {
    fontSize: fontSize.xs,
    color: colors.dark[500],
    marginTop: spacing.xs,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  speakButtonText: {
    fontSize: fontSize.xs,
    color: colors.dark[400],
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
  },
  sosSuggestion: {
    backgroundColor: colors.warning[500] + '20',
    borderWidth: 1,
    borderColor: colors.warning[500] + '50',
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  sosSuggestionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  sosSuggestionText: {
    flex: 1,
  },
  sosSuggestionLabel: {
    fontSize: fontSize.sm,
    color: colors.dark[200],
    marginBottom: spacing.md,
  },
  sosButton: {
    backgroundColor: colors.error[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  sosButtonText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.dark[800],
    borderTopWidth: 1,
    borderTopColor: colors.dark[700],
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.dark[900],
    borderWidth: 1,
    borderColor: colors.dark[700],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.dark[500],
    textAlign: 'center',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  // FAB styles
  fab: {
    position: 'absolute',
    bottom: 90,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatbotModal;
