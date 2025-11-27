import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Icon,
  Input,
  Text,
  VStack,
  useToast,
  Avatar,
  Divider,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ChatIcon } from '@chakra-ui/icons';
import { chatService } from '../services/chatService';
import { getAuthUser, isAuthenticated } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { ChatBubble } from '../components/ChatBubble';

const MotionBox = motion(Box);

/**
 * Chat context types
 */
const CHAT_CONTEXT = {
  GLOBAL: 'global',
  PRIVATE: 'private',
};

export default function Chat() {
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = getAuthUser();

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  // Users list
  const [users, setUsers] = useState([]);

  // Active chat context
  const [activeChat, setActiveChat] = useState({ type: CHAT_CONTEXT.GLOBAL });

  // Messages storage - keyed by conversation ID
  const [conversations, setConversations] = useState({
    global: [],
  });

  // Typing indicators - keyed by context ID
  const [typingUsers, setTypingUsers] = useState({});

  // Input
  const [inputValue, setInputValue] = useState('');

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const connectionRef = useRef(null); // Untuk mencegah koneksi ganda

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Get conversation ID for current chat
  const getConversationId = useCallback(() => {
    if (activeChat.type === CHAT_CONTEXT.GLOBAL) {
      return 'global';
    }
    return activeChat.user?.id || '';
  }, [activeChat]);

  // Get messages for current chat
  const currentMessages = conversations[getConversationId()] || [];

  // Get typing users for current context
  const currentTypingUsers = typingUsers[getConversationId()] || [];

  // Connect to chat stream
  useEffect(() => {
    if (!currentUser) return;
    
    // Cegah koneksi ganda (React StrictMode double-mount)
    if (connectionRef.current) {
      console.log('Connection already in progress, skipping');
      return;
    }
    connectionRef.current = true;

    setIsConnecting(true);
    let mounted = true;

    const connectToChat = async () => {
      const stream = await chatService.startChatStream({
        onGlobalMessage: (msg) => {
          if (!mounted) return;
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
        },

        onPrivateMessage: (msg) => {
          if (!mounted) return;
          // Determine conversation ID (the other user)
          const otherUserId =
            msg.sender.id === String(currentUser.id)
              ? msg.recipient.id
              : msg.sender.id;

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
        },

        onPresenceUpdate: (update) => {
          if (!mounted) return;
          setUsers((prev) => {
            const existing = prev.find((u) => u.id === update.user.id);
            if (existing) {
              return prev.map((u) =>
                u.id === update.user.id
                  ? { ...u, isOnline: update.isOnline }
                  : u
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
                [event.contextId]: contextUsers.filter(
                  (u) => u.id !== event.user.id
                ),
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
          console.error('Chat error:', err);
          setIsConnected(false);
          setIsConnecting(false);
          toast({
            title: 'Koneksi Bermasalah',
            description: 'Tidak dapat terhubung ke server chat. Pastikan WebSocket server berjalan di port 8080.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
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
      connectionRef.current = false;
      chatService.endChatStream();
    };
  }, [currentUser?.id, toast]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Handle input change with typing indicator
  const handleInputChange = (event) => {
    setInputValue(event.target.value);

    const contextId =
      activeChat.type === CHAT_CONTEXT.GLOBAL
        ? 'global'
        : activeChat.user?.id;

    chatService.sendTyping(contextId, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      chatService.sendTyping(contextId, false);
    }, 2000);
  };

  // Send message
  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || !isConnected) return;

    const recipientId =
      activeChat.type === CHAT_CONTEXT.PRIVATE
        ? activeChat.user?.id
        : null;

    try {
      await chatService.sendMessage(text, recipientId);
      setInputValue('');

      // Clear typing indicator
      const contextId = recipientId || 'global';
      chatService.sendTyping(contextId, false);
    } catch (err) {
      toast({
        title: 'Gagal mengirim pesan',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Handle enter key
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Select a chat (global or private)
  const selectChat = (type, user = null) => {
    if (type === CHAT_CONTEXT.GLOBAL) {
      setActiveChat({ type: CHAT_CONTEXT.GLOBAL });
    } else {
      setActiveChat({ type: CHAT_CONTEXT.PRIVATE, user });
      // Initialize conversation if not exists
      if (!conversations[user.id]) {
        setConversations((prev) => ({ ...prev, [user.id]: [] }));
      }
    }
  };

  // Loading state
  if (isConnecting) {
    return (
      <Box
        h="100vh"
        bg="#faf9f7"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="teal.500" thickness="3px" />
          <Text color="gray.600">Menghubungkan ke chat...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box h="100vh" bg="#faf9f7">
      <Flex h="full">
        {/* Sidebar - User List */}
        <Box
          w="300px"
          bg="white"
          borderRight="1px solid"
          borderColor="gray.200"
          display="flex"
          flexDirection="column"
        >
          {/* Sidebar Header */}
          <Box p={4} borderBottom="1px solid" borderColor="gray.100">
            <HStack spacing={3}>
              <Avatar
                size="sm"
                name={currentUser?.name}
                bg="teal.500"
                color="white"
              />
              <Box flex="1">
                <Text fontWeight="600" fontSize="sm" color="gray.800">
                  {currentUser?.name}
                </Text>
                <HStack spacing={1}>
                  <Box
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg={isConnected ? 'green.400' : 'gray.400'}
                  />
                  <Text fontSize="xs" color="gray.500">
                    {isConnected ? 'Online' : 'Offline'}
                  </Text>
                </HStack>
              </Box>
            </HStack>
          </Box>

          {/* Chat List */}
          <Box flex="1" overflowY="auto">
            {/* Global Chat */}
            <Box
              px={3}
              py={3}
              cursor="pointer"
              bg={activeChat.type === CHAT_CONTEXT.GLOBAL ? 'teal.50' : 'transparent'}
              borderLeft={activeChat.type === CHAT_CONTEXT.GLOBAL ? '3px solid' : '3px solid transparent'}
              borderColor="teal.500"
              _hover={{ bg: 'gray.50' }}
              onClick={() => selectChat(CHAT_CONTEXT.GLOBAL)}
            >
              <HStack spacing={3}>
                <Box
                  w={10}
                  h={10}
                  borderRadius="full"
                  bg="teal.500"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={ChatIcon} color="white" w={5} h={5} />
                </Box>
                <Box flex="1">
                  <Text fontWeight="600" fontSize="sm" color="gray.800">
                    Global Chat
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Chat dengan semua orang
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Divider />

            {/* Online Users Header */}
            <Box px={4} py={2}>
              <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase">
                Pengguna Online ({users.filter((u) => u.isOnline).length})
              </Text>
            </Box>

            {/* Users */}
            {users.map((user) => (
              <Box
                key={user.id}
                px={3}
                py={2}
                cursor="pointer"
                bg={
                  activeChat.type === CHAT_CONTEXT.PRIVATE &&
                  activeChat.user?.id === user.id
                    ? 'teal.50'
                    : 'transparent'
                }
                borderLeft={
                  activeChat.type === CHAT_CONTEXT.PRIVATE &&
                  activeChat.user?.id === user.id
                    ? '3px solid'
                    : '3px solid transparent'
                }
                borderColor="teal.500"
                _hover={{ bg: 'gray.50' }}
                onClick={() => selectChat(CHAT_CONTEXT.PRIVATE, user)}
              >
                <HStack spacing={3}>
                  <Box position="relative">
                    <Avatar size="sm" name={user.name} bg="gray.400" />
                    <Box
                      position="absolute"
                      bottom={0}
                      right={0}
                      w={3}
                      h={3}
                      borderRadius="full"
                      bg={user.isOnline ? 'green.400' : 'gray.400'}
                      border="2px solid white"
                    />
                  </Box>
                  <Box flex="1">
                    <Text fontWeight="500" fontSize="sm" color="gray.700">
                      {user.name}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {user.isOnline ? 'Online' : 'Offline'}
                    </Text>
                  </Box>
                  {conversations[user.id]?.length > 0 && (
                    <Badge colorScheme="teal" borderRadius="full" fontSize="xs">
                      {conversations[user.id].length}
                    </Badge>
                  )}
                </HStack>
              </Box>
            ))}

            {users.length === 0 && (
              <Box px={4} py={6} textAlign="center">
                <Text fontSize="sm" color="gray.400">
                  Belum ada pengguna lain online
                </Text>
              </Box>
            )}
          </Box>
        </Box>

        {/* Main Chat Area */}
        <Flex flex="1" direction="column" bg="white">
          {/* Chat Header */}
          <Box
            px={6}
            py={4}
            borderBottom="1px solid"
            borderColor="gray.100"
            bg="white"
          >
            <HStack spacing={3}>
              {activeChat.type === CHAT_CONTEXT.GLOBAL ? (
                <>
                  <Box
                    w={10}
                    h={10}
                    borderRadius="full"
                    bg="teal.500"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={ChatIcon} color="white" w={5} h={5} />
                  </Box>
                  <Box>
                    <Heading size="sm" color="gray.800">
                      Global Chat
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                      {users.filter((u) => u.isOnline).length + 1} pengguna online
                    </Text>
                  </Box>
                </>
              ) : (
                <>
                  <Box position="relative">
                    <Avatar size="md" name={activeChat.user?.name} bg="gray.400" />
                    <Box
                      position="absolute"
                      bottom={0}
                      right={0}
                      w={3}
                      h={3}
                      borderRadius="full"
                      bg={activeChat.user?.isOnline ? 'green.400' : 'gray.400'}
                      border="2px solid white"
                    />
                  </Box>
                  <Box>
                    <Heading size="sm" color="gray.800">
                      {activeChat.user?.name}
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                      {activeChat.user?.isOnline ? 'Online' : 'Offline'}
                    </Text>
                  </Box>
                </>
              )}
            </HStack>
          </Box>

          {/* Messages */}
          <Box
            flex="1"
            overflowY="auto"
            p={6}
            bg="#faf9f7"
            css={{
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '20px',
              },
            }}
          >
            <VStack spacing={4} align="stretch">
              {currentMessages.length === 0 ? (
                <MotionBox
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={20}
                >
                  <Icon as={ChatIcon} w={12} h={12} color="gray.300" mb={4} />
                  <Text color="gray.400">
                    {activeChat.type === CHAT_CONTEXT.GLOBAL
                      ? 'Belum ada pesan. Jadilah yang pertama menyapa!'
                      : `Mulai percakapan dengan ${activeChat.user?.name}`}
                  </Text>
                </MotionBox>
              ) : (
                currentMessages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.type === 'sent'}
                    currentUserName={currentUser?.name}
                    isPrivateChat={activeChat.type === CHAT_CONTEXT.PRIVATE}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </VStack>
          </Box>

          {/* Typing Indicator */}
          {currentTypingUsers.length > 0 && (
            <Box px={6} py={2} bg="white">
              <Text fontSize="xs" color="gray.500" fontStyle="italic">
                {currentTypingUsers.map((u) => u.name).join(', ')} sedang mengetik...
              </Text>
            </Box>
          )}

          {/* Input Area */}
          <Box
            p={4}
            bg="white"
            borderTop="1px solid"
            borderColor="gray.100"
          >
            <HStack spacing={3}>
              <Input
                value={inputValue}
                placeholder="Ketik pesan..."
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                bg="gray.50"
                color="gray.800"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="full"
                _focus={{
                  bg: 'white',
                  borderColor: 'teal.400',
                  boxShadow: '0 0 0 1px var(--chakra-colors-teal-400)',
                }}
                _placeholder={{ color: 'gray.400' }}
                isDisabled={!isConnected}
                sx={{ color: '#1a202c !important' }}
              />
              <Button
                colorScheme="teal"
                borderRadius="full"
                w="12"
                h="12"
                onClick={handleSendMessage}
                isDisabled={!isConnected || !inputValue.trim()}
              >
                <ArrowUpIcon w={5} h={5} />
              </Button>
            </HStack>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
}
