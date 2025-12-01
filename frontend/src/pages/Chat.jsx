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
import { ArrowUpIcon, ChatIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { getAuthUser, isAuthenticated } from '../services/authService';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChatBubble } from '../components/ChatBubble';
import { useChat, CHAT_CONTEXT } from '../context/ChatContext';

const MotionBox = motion(Box);

// Theme configuration
const THEME = {
  bg: '#FDFCF8',
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  accent: '#805AD5',
  accentLight: '#E9D8FD',
  accentDark: '#6B46C1',
  card: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.06)',
};

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const currentUser = getAuthUser();

  // Menggunakan ChatContext untuk state dan actions
  // Using ChatContext for state and actions
  const {
    isConnected,
    isConnecting,
    users,
    conversations,
    activeChat,
    selectChat,
    getConversationId,
    typingUsers,
    sendMessage,
    sendTyping,
  } = useChat();

  // Input state (local untuk komponen ini)
  // Input state (local to this component)
  const [inputValue, setInputValue] = useState('');

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Handle navigation state untuk membuka private chat dari notifikasi
  // Handle navigation state to open private chat from notification
  useEffect(() => {
    if (location.state?.openPrivateChat && location.state?.userId) {
      const targetUser = users.find((u) => u.id === location.state.userId);
      if (targetUser) {
        selectChat(CHAT_CONTEXT.PRIVATE, targetUser);
      }
      // Clear navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, users, selectChat, navigate, location.pathname]);

  // Get messages for current chat (dari context)
  // Get messages for current chat (from context)
  const currentMessages = conversations[getConversationId()] || [];

  // Get typing users for current context (dari context)
  // Get typing users for current context (from context)
  const currentTypingUsers = typingUsers[getConversationId()] || [];

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Handle input change with typing indicator
  // Menggunakan sendTyping dari context
  const handleInputChange = (event) => {
    setInputValue(event.target.value);

    const contextId =
      activeChat.type === CHAT_CONTEXT.GLOBAL
        ? 'global'
        : activeChat.user?.id;

    sendTyping(contextId, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(contextId, false);
    }, 2000);
  };

  // Send message - menggunakan sendMessage dari context
  // Send message - using sendMessage from context
  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || !isConnected) return;

    const recipientId =
      activeChat.type === CHAT_CONTEXT.PRIVATE
        ? activeChat.user?.id
        : null;

    try {
      await sendMessage(text, recipientId);
      setInputValue('');

      // Clear typing indicator
      const contextId = recipientId || 'global';
      sendTyping(contextId, false);
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

  // Loading state (menggunakan isConnecting dari context)
  // Loading state (using isConnecting from context)
  if (isConnecting) {
    return (
      <Box
        h="100vh"
        bg={THEME.bg}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color={THEME.accent} thickness="3px" />
          <Text color={THEME.textSecondary}>Menghubungkan ke chat...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box h="100vh" bg={THEME.bg}>
      <Flex h="full">
        {/* Sidebar - User List */}
        <Box
          w="300px"
          bg={THEME.card}
          borderRight="1px solid"
          borderColor="gray.200"
          display="flex"
          flexDirection="column"
        >
          {/* Sidebar Header dengan tombol kembali */}
          {/* Sidebar Header with back button */}
          <Box p={4} borderBottom="1px solid" borderColor="gray.100">
            <HStack spacing={3}>
              {/* Tombol kembali ke halaman utama */}
              {/* Back button to main page */}
              <Button
                variant="ghost"
                size="sm"
                p={0}
                minW="auto"
                onClick={() => navigate('/')}
                _hover={{ bg: 'gray.100' }}
                title="Kembali ke beranda"
              >
                <Icon as={ArrowBackIcon} w={5} h={5} color="gray.600" />
              </Button>
              <Avatar
                size="sm"
                name={currentUser?.name}
                bg={THEME.accent}
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
              bg={activeChat.type === CHAT_CONTEXT.GLOBAL ? 'purple.50' : 'transparent'}
              borderLeft={activeChat.type === CHAT_CONTEXT.GLOBAL ? '3px solid' : '3px solid transparent'}
              borderColor={THEME.accent}
              _hover={{ bg: 'gray.50' }}
              onClick={() => selectChat(CHAT_CONTEXT.GLOBAL)}
            >
              <HStack spacing={3}>
                <Box
                  w={10}
                  h={10}
                  borderRadius="full"
                  bg={THEME.accent}
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
                    ? 'purple.50'
                    : 'transparent'
                }
                borderLeft={
                  activeChat.type === CHAT_CONTEXT.PRIVATE &&
                  activeChat.user?.id === user.id
                    ? '3px solid'
                    : '3px solid transparent'
                }
                borderColor={THEME.accent}
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
                    <Badge colorScheme="purple" borderRadius="full" fontSize="xs">
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
        <Flex flex="1" direction="column" bg={THEME.card}>
          {/* Chat Header */}
          <Box
            px={6}
            py={4}
            borderBottom="1px solid"
            borderColor="gray.100"
            bg={THEME.card}
          >
            <HStack spacing={3}>
              {activeChat.type === CHAT_CONTEXT.GLOBAL ? (
                <>
                  <Box
                    w={10}
                    h={10}
                    borderRadius="full"
                    bg={THEME.accent}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={ChatIcon} color="white" w={5} h={5} />
                  </Box>
                  <Box>
                    <Heading size="sm" color={THEME.textPrimary}>
                      Global Chat
                    </Heading>
                    <Text fontSize="xs" color={THEME.textSecondary}>
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
                    <Heading size="sm" color={THEME.textPrimary}>
                      {activeChat.user?.name}
                    </Heading>
                    <Text fontSize="xs" color={THEME.textSecondary}>
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
            bg={THEME.bg}
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
            <Box px={6} py={2} bg={THEME.card}>
              <Text fontSize="xs" color={THEME.textSecondary} fontStyle="italic">
                {currentTypingUsers.map((u) => u.name).join(', ')} sedang mengetik...
              </Text>
            </Box>
          )}

          {/* Input Area */}
          <Box
            p={4}
            bg={THEME.card}
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
                color={THEME.textPrimary}
                border="1px solid"
                borderColor="gray.200"
                borderRadius="full"
                _focus={{
                  bg: THEME.card,
                  borderColor: THEME.accent,
                  boxShadow: `0 0 0 3px ${THEME.accentLight}`,
                }}
                _placeholder={{ color: 'gray.400' }}
                isDisabled={!isConnected}
              />
              <Button
                bg={THEME.accent}
                color="white"
                borderRadius="full"
                w="12"
                h="12"
                onClick={handleSendMessage}
                isDisabled={!isConnected || !inputValue.trim()}
                _hover={{ bg: THEME.accentDark }}
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
