import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  Icon,
  Input,
  Stack,
  Text,
  VStack,
  useToast,
  Avatar,
  Tooltip,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, ChatIcon, InfoIcon } from '@chakra-ui/icons';
import TypingIndicator from '../components/TypingIndicator';
import { typingService } from '../services/typingService';
import { GlassCard } from '../components/GlassCard';
import { ChatBubble } from '../components/ChatBubble';

const MotionBox = motion(Box);


const DEFAULT_WS_URL = import.meta.env.VITE_WEBSOCKET_URL ?? 'ws://localhost:8080';

function buildMessageEntry({ text, type, sender }) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    text,
    type,
    sender,
    timestamp: new Date(),
  };
}

export default function Chat() {
  const [tempUserName, setTempUserName] = useState('');
  const [userName, setUserName] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const toast = useToast();

  const wsUrl = useMemo(() => DEFAULT_WS_URL, []);

  // Efek ini membuka koneksi WebSocket hanya setelah pengguna memilih nama
  useEffect(() => {
    if (!userName) {
      return undefined;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'username', name: userName }));
      setMessages((prev) => [
        ...prev,
        buildMessageEntry({
          text: `Selamat datang, ${userName}! Kamu sudah terhubung.`,
          type: 'system',
        }),
      ]);
    };

    ws.onmessage = (event) => {
      const payload = event.data;
      try {
        const parsed = JSON.parse(payload);
        if (parsed && parsed.type === 'typing') {
          const detail = {
            userId: parsed.user_id || parsed.userId,
            userName: parsed.user_name || parsed.userName,
            channelId: parsed.channel_id || parsed.channelId,
            isTyping: parsed.is_typing !== undefined ? parsed.is_typing : parsed.isTyping,
            timestamp: parsed.timestamp || Date.now(),
          };
          window.dispatchEvent(new CustomEvent('typingEvent', { detail }));
          return;
        }
        return;
      } catch (e) {
        // Not JSON, treat as plain text chat message
      }

      // Parse sender and message from "sender: message" format
      let sender = null;
      let messageText = payload;
      const colonIndex = payload.indexOf(': ');
      if (colonIndex > -1) {
        sender = payload.slice(0, colonIndex);
        messageText = payload.slice(colonIndex + 2);
      }

      setMessages((prev) => [
        ...prev,
        buildMessageEntry({ text: messageText, type: 'received', sender }),
      ]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Koneksi Bermasalah',
        description: 'Coba muat ulang halaman jika pesan tidak masuk.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    };

    ws.onclose = () => {
      setIsConnected(false);
      setMessages((prev) => [
        ...prev,
        buildMessageEntry({ text: 'Koneksi chat terputus.', type: 'system' }),
      ]);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [userName, wsUrl, toast]);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);

    if (userName) {
      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'typing', channel: 'global', isTyping: true }));
        }
      } catch (e) {
        console.warn('Failed to send typing via WebSocket', e);
      }
      typingService.sendTyping('global', true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        try {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({ type: 'typing', channel: 'global', isTyping: false })
            );
          }
        } catch (e) {
          console.warn('Failed to send typing=false via WebSocket', e);
        }
        typingService.sendTyping('global', false);
      }, 2000);
    }
  };

  const handleStartChat = () => {
    if (!tempUserName.trim()) return;
    setMessages([]);
    setTempUserName(tempUserName.trim());
    setUserName(tempUserName.trim());
  };

  const handleSendMessage = () => {
    const message = inputValue.trim();
    if (!message || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(message);
    setMessages((prev) => [
      ...prev,
      buildMessageEntry({ text: message, type: 'sent', sender: userName }),
    ]);
    setInputValue('');
  };

  const handleEnterPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Login Screen
  if (!userName) {
    return (
      <Box
        minH="100vh"
        bgGradient="linear(to-br, #1a1a2e, #16213e, #0f3460, #533483)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={4}
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgImage:
            'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      >
        <Container maxW="md" position="relative" zIndex={1}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard p={8} textAlign="center">
              <VStack spacing={6}>
                <Box
                  p={4}
                  bg="whiteAlpha.100"
                  borderRadius="full"
                  boxShadow="0 0 20px rgba(56, 189, 248, 0.2)"
                >
                  <Icon as={ChatIcon} w={8} h={8} color="cyan.300" />
                </Box>
                <Box>
                  <Heading
                    size="lg"
                    mb={2}
                    bgGradient="linear(to-r, cyan.200, purple.200)"
                    bgClip="text"
                  >
                    Mulai Mengobrol
                  </Heading>
                  <Text color="whiteAlpha.600">
                    Bergabunglah dengan komunitas dan bagikan ceritamu.
                  </Text>
                </Box>
                <VStack spacing={4} w="full">
                  <Input
                    placeholder="Nama panggilanmu..."
                    value={tempUserName}
                    onChange={(event) => setTempUserName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleStartChat();
                    }}
                    bg="whiteAlpha.50"
                    borderColor="whiteAlpha.200"
                    borderRadius="xl"
                    height="50px"
                    _focus={{
                      borderColor: 'cyan.300',
                      bg: 'whiteAlpha.100',
                      boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.5)',
                    }}
                    _placeholder={{ color: 'whiteAlpha.400' }}
                    textAlign="center"
                    fontSize="lg"
                  />
                  <Button
                    colorScheme="cyan"
                    size="lg"
                    w="full"
                    borderRadius="xl"
                    onClick={handleStartChat}
                    isDisabled={!tempUserName.trim()}
                    bgGradient="linear(to-r, cyan.500, blue.500)"
                    _hover={{
                      bgGradient: 'linear(to-r, cyan.400, blue.400)',
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                    }}
                  >
                    Gabung Chat
                  </Button>
                </VStack>
              </VStack>
            </GlassCard>
          </MotionBox>
        </Container>
      </Box>
    );
  }

  // Chat Interface
  return (
    <Box
      h="100vh"
      bgGradient="linear(to-br, #1a1a2e, #16213e, #0f3460, #533483)"
      position="relative"
      overflow="hidden"
    >
      <Container maxW="5xl" h="full" py={{ base: 4, md: 6 }}>
        <Stack spacing={4} h="full">
          {/* Header */}
          <GlassCard p={4}>
            <Flex align="center" justify="space-between">
              <HStack spacing={4}>
                <Avatar size="sm" name={userName} bgGradient="linear(to-br, cyan.400, blue.500)" />
                <Box>
                  <Heading size="sm" color="whiteAlpha.900">
                    Community Chat
                  </Heading>
                  <HStack spacing={2}>
                    <Box
                      w={2}
                      h={2}
                      borderRadius="full"
                      bg={isConnected ? 'green.400' : 'red.400'}
                      boxShadow={isConnected ? '0 0 8px #4ade80' : 'none'}
                    />
                    <Text fontSize="xs" color="whiteAlpha.600">
                      {isConnected ? 'Online' : 'Terputus'}
                    </Text>
                  </HStack>
                </Box>
              </HStack>
              <Tooltip label="Pesan di sini bersifat publik untuk semua pengguna yang sedang online.">
                <Icon as={InfoIcon} color="whiteAlpha.400" />
              </Tooltip>
            </Flex>
          </GlassCard>

          {/* Messages Area */}
          <GlassCard
            flex="1"
            overflow="hidden"
            display="flex"
            flexDirection="column"
            p={0}
            bg="rgba(15, 23, 42, 0.6)"
          >
            <Box
              flex="1"
              overflowY="auto"
              p={6}
              css={{
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                },
              }}
            >
              <Stack spacing={4}>
                <AnimatePresence initial={false}>
                  {messages.length === 0 ? (
                    <MotionBox
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      h="full"
                      color="whiteAlpha.500"
                      py={10}
                    >
                      <Icon as={ChatIcon} w={12} h={12} mb={4} opacity={0.5} />
                      <Text>Belum ada pesan. Jadilah yang pertama menyapa!</Text>
                    </MotionBox>
                  ) : (
                    messages.map((message) => (
                      <ChatBubble
                        key={message.id}
                        message={message}
                        isOwn={message.type === 'sent'}
                        currentUserName={userName}
                      />
                    ))
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </Stack>
            </Box>

            {/* Typing Indicator Area */}
            <Box px={6} py={2} minH="24px">
              <TypingIndicator channelId="global" currentUserId={userName} />
            </Box>

            {/* Input Area */}
            <Box p={4} bg="whiteAlpha.50" borderTop="1px solid" borderColor="whiteAlpha.100">
              <HStack spacing={3}>
                <Input
                  value={inputValue}
                  placeholder="Ketik pesan..."
                  onChange={handleInputChange}
                  onKeyDown={handleEnterPress}
                  bg="whiteAlpha.100"
                  borderColor="transparent"
                  borderRadius="full"
                  _focus={{
                    bg: 'whiteAlpha.200',
                    borderColor: 'cyan.300',
                    boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.5)',
                  }}
                  _placeholder={{ color: 'whiteAlpha.400' }}
                  isDisabled={!isConnected}
                />
                <Button
                  colorScheme="cyan"
                  borderRadius="full"
                  w="12"
                  h="12"
                  onClick={handleSendMessage}
                  isDisabled={!isConnected || !inputValue.trim()}
                  bgGradient="linear(to-r, cyan.500, blue.500)"
                  _hover={{
                    bgGradient: 'linear(to-r, cyan.400, blue.400)',
                    transform: 'scale(1.05)',
                  }}
                  boxShadow="0 0 15px rgba(6, 182, 212, 0.4)"
                >
                  <ArrowUpIcon w={5} h={5} />
                </Button>
              </HStack>
            </Box>
          </GlassCard>
        </Stack>
      </Container>
    </Box>
  );
}
