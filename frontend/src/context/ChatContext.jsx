import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useToast, Box, Text, Button, HStack } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { getAuthUser, isAuthenticated } from '../services/authService';

/**
 * ChatContext - Menyediakan koneksi chat global ke seluruh aplikasi
 * Ini memungkinkan notifikasi muncul di halaman manapun, bukan hanya di halaman Chat.
 *
 * ChatContext - Provides global chat connection to the entire app
 * This allows notifications to appear on any page, not just the Chat page.
 */

const ChatContext = createContext(null);

/**
 * Chat context types (tipe konteks chat)
 */
export const CHAT_CONTEXT = {
  GLOBAL: 'global',
  PRIVATE: 'private',
};

/**
 * ChatProvider - Wrapper component yang mengelola koneksi WebSocket global
 * ChatProvider - Wrapper component that manages the global WebSocket connection
 */
export function ChatProvider({ children }) {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getAuthUser();

  // Connection state (status koneksi)
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Users list (daftar pengguna online)
  const [users, setUsers] = useState([]);

  // Messages storage - keyed by conversation ID (penyimpanan pesan per percakapan)
  const [conversations, setConversations] = useState({
    global: [],
  });

  // Typing indicators - keyed by context ID (indikator mengetik per konteks)
  const [typingUsers, setTypingUsers] = useState({});

  // Active chat context - digunakan oleh halaman Chat (konteks chat aktif)
  const [activeChat, setActiveChat] = useState({ type: CHAT_CONTEXT.GLOBAL });

  // Refs
  const connectionRef = useRef(null); // Untuk mencegah koneksi ganda (prevent double connection)
  const toastIdRef = useRef(null); // Untuk tracking toast ID

  /**
   * Cek apakah user sedang aktif di halaman Chat dan percakapan yang sama
   * Check if user is currently on Chat page and same conversation
   */
  const isUserViewingConversation = useCallback(
    (senderId) => {
      // Jika tidak di halaman chat, return false
      if (location.pathname !== '/chat') {
        return false;
      }

      // Jika di halaman chat, cek apakah sedang melihat percakapan yang sama
      // Untuk private chat, cek apakah activeChat.user.id === senderId
      if (activeChat.type === CHAT_CONTEXT.PRIVATE && activeChat.user?.id === senderId) {
        return true;
      }

      return false;
    },
    [location.pathname, activeChat]
  );

  /**
   * Tampilkan notifikasi toast untuk pesan baru
   * Show toast notification for new message
   */
  const showMessageNotification = useCallback(
    (msg, isPrivate = false) => {
      // Jangan tampilkan notifikasi jika pesan dari diri sendiri
      // Don't show notification if message is from self
      if (msg.sender.id === String(currentUser?.id)) {
        return;
      }

      // Jangan tampilkan notifikasi jika user sedang melihat percakapan tersebut
      // Don't show if user is viewing the same conversation
      if (isPrivate && isUserViewingConversation(msg.sender.id)) {
        return;
      }

      // Untuk global chat, jangan tampilkan notifikasi jika sedang di halaman chat dengan global aktif
      if (!isPrivate && location.pathname === '/chat' && activeChat.type === CHAT_CONTEXT.GLOBAL) {
        return;
      }

      const title = isPrivate
        ? `Pesan dari ${msg.sender.name}`
        : `${msg.sender.name} di Global Chat`;

      const truncatedText = msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text;

      // Buat fungsi navigasi untuk toast
      // Create navigation function for toast
      const handleNavigate = () => {
        navigate('/chat', {
          state: {
            openPrivateChat: isPrivate,
            userId: msg.sender.id,
          },
        });
      };

      // Tampilkan toast dengan tombol navigasi
      // Show toast with navigation button
      toastIdRef.current = toast({
        position: 'top-right',
        duration: 5000,
        isClosable: true,
        render: ({ onClose }) => (
          <NotificationToast
            title={title}
            message={truncatedText}
            onNavigate={handleNavigate}
            onClose={onClose}
          />
        ),
      });
    },
    [currentUser?.id, isUserViewingConversation, location.pathname, activeChat, toast, navigate]
  );

  /**
   * Connect ke WebSocket saat user authenticated
   * Connect to WebSocket when user is authenticated
   */
  useEffect(() => {
    if (!currentUser || !isAuthenticated()) {
      // Jika tidak authenticated, reset state
      setIsConnected(false);
      setIsConnecting(false);
      return;
    }

    // Cegah koneksi ganda (React StrictMode double-mount)
    // Prevent double connection
    if (connectionRef.current) {
      console.log('[ChatContext] Connection already in progress, skipping');
      return;
    }
    connectionRef.current = true;

    setIsConnecting(true);
    let mounted = true;

    const connectToChat = async () => {
      await chatService.startChatStream({
        onGlobalMessage: (msg) => {
          if (!mounted) return;

          // Simpan pesan ke conversations
          setConversations((prev) => ({
            ...prev,
            global: [
              ...(prev.global || []),
              {
                id: msg.id,
                text: msg.text,
                sender: msg.sender,
                timestamp: msg.timestamp,
                type: msg.sender.id === String(currentUser.id) ? 'sent' : 'received',
              },
            ],
          }));

          // Tampilkan notifikasi untuk global message
          showMessageNotification(msg, false);
        },

        onPrivateMessage: (msg) => {
          if (!mounted) return;

          // Tentukan conversation ID (user lain)
          // Determine conversation ID (the other user)
          const otherUserId =
            msg.sender.id === String(currentUser.id) ? msg.recipient.id : msg.sender.id;

          setConversations((prev) => ({
            ...prev,
            [otherUserId]: [
              ...(prev[otherUserId] || []),
              {
                id: msg.id,
                text: msg.text,
                sender: msg.sender,
                recipient: msg.recipient,
                timestamp: msg.timestamp,
                type: msg.sender.id === String(currentUser.id) ? 'sent' : 'received',
              },
            ],
          }));

          // Tampilkan notifikasi untuk private message
          // Show notification for private message
          showMessageNotification(msg, true);
        },

        onPresenceUpdate: (update) => {
          if (!mounted) return;
          setUsers((prev) => {
            const existing = prev.find((u) => u.id === update.user.id);
            if (existing) {
              return prev.map((u) =>
                u.id === update.user.id ? { ...u, isOnline: update.isOnline } : u
              );
            } else if (update.isOnline) {
              return [...prev, update.user];
            }
            return prev;
          });
        },

        onTypingEvent: (event) => {
          if (!mounted) return;
          if (event.user.id === String(currentUser.id)) return;

          setTypingUsers((prev) => {
            const contextUsers = prev[event.contextId] || [];
            if (event.isTyping) {
              if (!contextUsers.find((u) => u.id === event.user.id)) {
                return {
                  ...prev,
                  [event.contextId]: [...contextUsers, event.user],
                };
              }
            } else {
              return {
                ...prev,
                [event.contextId]: contextUsers.filter((u) => u.id !== event.user.id),
              };
            }
            return prev;
          });

          // Auto-clear typing after 3 seconds
          setTimeout(() => {
            if (!mounted) return;
            setTypingUsers((prev) => ({
              ...prev,
              [event.contextId]: (prev[event.contextId] || []).filter(
                (u) => u.id !== event.user.id
              ),
            }));
          }, 3000);
        },

        onUserList: (userList) => {
          if (!mounted) return;
          setUsers(userList.filter((u) => u.id !== String(currentUser.id)));
          setIsConnected(true);
          setIsConnecting(false);
        },

        onError: (err) => {
          if (!mounted) return;
          console.error('[ChatContext] Chat error:', err);
          setIsConnected(false);
          setIsConnecting(false);
          // Tidak perlu toast error di sini karena bisa mengganggu UX di halaman lain
          // No need for error toast here as it might disrupt UX on other pages
        },

        onEnd: () => {
          if (!mounted) return;
          setIsConnected(false);
        },
      });
    };

    connectToChat();

    return () => {
      mounted = false;
      // Jangan reset connectionRef di sini agar React HMR tidak trigger reconnect
      // Don't reset connectionRef here to avoid React HMR triggering reconnect
      // connectionRef.current = false;
      chatService.endChatStream();
    };
  }, [currentUser?.id]); // Hanya depend pada currentUser.id untuk menghindari re-connection

  /**
   * Send message helper function
   */
  const sendMessage = useCallback(async (text, recipientId = null) => {
    return chatService.sendMessage(text, recipientId);
  }, []);

  /**
   * Send typing indicator helper function
   */
  const sendTyping = useCallback((contextId, isTyping) => {
    chatService.sendTyping(contextId, isTyping);
  }, []);

  /**
   * Select active chat (untuk digunakan oleh halaman Chat)
   * Select active chat (to be used by Chat page)
   */
  const selectChat = useCallback(
    (type, user = null) => {
      if (type === CHAT_CONTEXT.GLOBAL) {
        setActiveChat({ type: CHAT_CONTEXT.GLOBAL });
      } else {
        setActiveChat({ type: CHAT_CONTEXT.PRIVATE, user });
        // Initialize conversation if not exists
        if (user && !conversations[user.id]) {
          setConversations((prev) => ({ ...prev, [user.id]: [] }));
        }
      }
    },
    [conversations]
  );

  /**
   * Get conversation ID for current active chat
   */
  const getConversationId = useCallback(() => {
    if (activeChat.type === CHAT_CONTEXT.GLOBAL) {
      return 'global';
    }
    return activeChat.user?.id || '';
  }, [activeChat]);

  // Context value yang akan di-share ke seluruh aplikasi
  // Context value to be shared across the app
  const value = {
    // Connection state
    isConnected,
    isConnecting,

    // Users
    users,

    // Conversations & messages
    conversations,
    activeChat,
    selectChat,
    getConversationId,

    // Typing
    typingUsers,

    // Actions
    sendMessage,
    sendTyping,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

ChatProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook untuk menggunakan ChatContext
 * Custom hook to use ChatContext
 */
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

/**
 * NotificationToast - Komponen toast kustom dengan tombol navigasi
 * NotificationToast - Custom toast component with navigation button
 *
 * Note: Tidak bisa menggunakan useNavigate di sini karena toast di-render di luar Router context.
 * Sebagai gantinya, kita pass fungsi onNavigate dari parent.
 *
 * Note: Cannot use useNavigate here because toast is rendered outside Router context.
 * Instead, we pass onNavigate function from parent.
 */
function NotificationToast({ title, message, onNavigate, onClose }) {
  const handleClick = () => {
    onNavigate();
    onClose();
  };

  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="lg"
      border="1px solid"
      borderColor="gray.200"
      p={4}
      minW="300px"
      cursor="pointer"
      onClick={handleClick}
      _hover={{ bg: 'gray.50' }}
    >
      <HStack justify="space-between" align="start">
        <Box flex="1">
          <Text fontWeight="bold" fontSize="sm" color="teal.600">
            {title}
          </Text>
          <Text fontSize="sm" color="gray.600" mt={1}>
            {message}
          </Text>
        </Box>
        <Button
          size="xs"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          ✕
        </Button>
      </HStack>
      <Text fontSize="xs" color="gray.400" mt={2}>
        Klik untuk membuka chat
      </Text>
    </Box>
  );
}

NotificationToast.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ChatContext;
