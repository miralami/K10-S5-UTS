import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import TypingIndicator from '../components/TypingIndicator';
import { typingService } from '../services/typingService';

const MotionBox = motion(Box);

const DEFAULT_WS_URL = import.meta.env.VITE_WEBSOCKET_URL ?? 'ws://localhost:8080';

function buildMessageEntry({ text, type }) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    text,
    type,
  };
}

export default function Chat() {
  const [tempUserName, setTempUserName] = useState('');
  const [userName, setUserName] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const wsUrl = useMemo(() => DEFAULT_WS_URL, []);

  const headerBg = useColorModeValue('rgba(15, 23, 42, 0.7)', 'rgba(15, 23, 42, 0.85)');
  const messagesBg = useColorModeValue('rgba(15, 20, 40, 0.8)', 'rgba(12, 18, 32, 0.85)');
  const inputBg = useColorModeValue('rgba(17, 25, 42, 0.9)', 'rgba(17, 25, 42, 0.9)');

  // Komentar: efek ini membuka koneksi WebSocket hanya setelah pengguna memilih nama, sehingga sesi tetap personal.
  useEffect(() => {
    if (!userName) {
      return undefined;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionError('');
      ws.send(JSON.stringify({ type: 'username', name: userName }));
      setMessages((prev) => [
        ...prev,
        buildMessageEntry({ text: `Terhubung ke server chat sebagai ${userName}.`, type: 'system' }),
      ]);
    };

    ws.onmessage = (event) => {
      const payload = event.data;
      // Try to parse JSON for structured messages (typing events)
      try {
        const parsed = JSON.parse(payload);
        // Handle typing events
        if (parsed && parsed.type === 'typing') {
          const detail = {
            userId: parsed.user_id || parsed.userId,
            userName: parsed.user_name || parsed.userName,
            channelId: parsed.channel_id || parsed.channelId,
            isTyping: parsed.is_typing !== undefined ? parsed.is_typing : parsed.isTyping,
            timestamp: parsed.timestamp || Date.now(),
          };
          console.log('[Chat] Dispatching typing event:', detail);
          window.dispatchEvent(new CustomEvent('typingEvent', { detail }));
          return; // Don't show typing JSON in chat messages
        }
        // If JSON but not a typing event, ignore (don't display in chat)
        return;
      } catch (e) {
        // Not JSON, treat as plain text chat message
      }

      // Only add plain text messages to chat
      setMessages((prev) => [
        ...prev,
        buildMessageEntry({ text: payload, type: 'received' }),
      ]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionError('Terjadi gangguan koneksi. Coba muat ulang halaman untuk menyambung ulang.');
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
  }, [userName, wsUrl]);

  // Komentar: auto-scroll memastikan pesan terbaru selalu terlihat tanpa harus menggulir manual.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);

    if (userName) {
      // Send typing via WebSocket for realtime, and also attempt gRPC if available
      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'typing', channel: 'global', isTyping: true }));
        }
      } catch (e) {
        console.warn('Failed to send typing via WebSocket', e);
      }
      // Also call typingService (it will fallback or log if gRPC not available)
      typingService.sendTyping('global', true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        try {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'typing', channel: 'global', isTyping: false }));
          }
        } catch (e) {
          console.warn('Failed to send typing=false via WebSocket', e);
        }
        typingService.sendTyping('global', false);
      }, 2000);
    }
  };

  const handleStartChat = () => {
    if (!tempUserName.trim()) {
      return;
    }
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
      buildMessageEntry({ text: `${userName}: ${message}`, type: 'sent' }),
    ]);
    setInputValue('');
  };

  const handleEnterPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (!userName) {
    return (
      <Box
        minH="100vh"
        bgGradient="linear(to-br, #0f172a, #1e293b, #334155)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={4}
      >
        <Box
          w="full"
          maxW="lg"
          bg="rgba(15, 23, 42, 0.85)"
          borderRadius="2xl"
          border="1px solid rgba(148, 163, 184, 0.2)"
          p={10}
          boxShadow="2xl"
        >
          <Stack spacing={6} color="whiteAlpha.900">
            <Heading size="lg" textAlign="center">
              Mulai ngobrol
            </Heading>
            <Text textAlign="center" color="whiteAlpha.700">
              Pilih nama panggilan agar teman chat tahu kamu siapa.
            </Text>
            <Stack spacing={4}>
              <Input
                placeholder="Contoh: Aurora"
                value={tempUserName}
                onChange={(event) => setTempUserName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleStartChat();
                  }
                }}
                bg="rgba(148, 163, 184, 0.15)"
                borderColor="rgba(148, 163, 184, 0.3)"
                _focus={{ borderColor: 'cyan.300', boxShadow: '0 0 0 1px rgba(8, 145, 178, 0.5)' }}
              />
              <Button
                colorScheme="cyan"
                onClick={handleStartChat}
                isDisabled={!tempUserName.trim()}
              >
                Gabung Chat
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, #0f172a, #1e293b, #334155)"
      py={12}
    >
      <Container maxW="5xl">
        <Stack spacing={6}>
          <Box
            borderRadius="2xl"
            border="1px solid rgba(148, 163, 184, 0.2)"
            overflow="hidden"
            bg={headerBg}
            backdropFilter="blur(12px)"
          >
            <Flex
              align="center"
              justify="space-between"
              px={{ base: 4, md: 6 }}
              py={4}
            >
              <Box>
                <Heading size="md" color="whiteAlpha.900">
                  Ruang Chat Real-time
                </Heading>
                <Text color="whiteAlpha.600" fontSize="sm">
                  Logged in sebagai {userName}
                </Text>
              </Box>
              <HStack spacing={3}>
                <Badge
                  colorScheme={isConnected ? 'green' : 'red'}
                  variant="subtle"
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  {isConnected ? 'Terhubung' : 'Terputus'}
                </Badge>
                {connectionError ? (
                  <Text color="red.300" fontSize="xs" maxW="xs" textAlign="right">
                    {connectionError}
                  </Text>
                ) : null}
              </HStack>
            </Flex>

            <Flex direction="column" px={{ base: 3, md: 6 }} py={6} bg={messagesBg} h="calc(100vh - 220px)" overflow="hidden">
              <Stack flex="1" spacing={3} overflowY="auto" pr={2}>
                {messages.length === 0 ? (
                  <Box
                    flex="1"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="whiteAlpha.600"
                    textAlign="center"
                    py={12}
                  >
                    <Text>
                      Belum ada pesan. Kirim sesuatu untuk memulai percakapan!
                    </Text>
                  </Box>
                ) : (
                  messages.map((message) => {
                    // Separate sender and body so sender label sits above the bubble
                    let sender = null;
                    let body = message.text;
                    const isSystem = message.type === 'system';
                    const isSent = message.type === 'sent';

                    if (!isSystem) {
                      const idx = message.text.indexOf(': ');
                      if (idx > -1) {
                        sender = message.text.slice(0, idx);
                        body = message.text.slice(idx + 2);
                      }
                    }

                    // Use Flex justify to position the message container; the inner Box
                    // should have a constrained maxWidth so it doesn't fill the whole row.
                    const justify = isSystem ? 'center' : isSent ? 'flex-end' : 'flex-start';

                    return (
                      <Flex key={message.id} w="full" justify={justify}>
                        <Box maxW={isSystem ? '80%' : '70%'}>
                          {sender ? (
                            <Text
                              fontSize="xs"
                              color={isSent ? 'whiteAlpha.800' : 'whiteAlpha.700'}
                              mb={1}
                              textAlign={isSent ? 'right' : 'left'}
                            >
                              {sender}
                            </Text>
                          ) : null}

                          <MotionBox
                            initial={{ opacity: 0, y: isSystem ? 6 : 8, scale: isSystem ? 1 : 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.18 }}
                            bg={isSystem ? 'whiteAlpha.200' : isSent ? 'cyan.500' : 'rgba(148, 163, 184, 0.18)'}
                            color={isSent ? 'white' : 'whiteAlpha.900'}
                            px={4}
                            py={2.5}
                            borderRadius="xl"
                            boxShadow="md"
                            fontSize="sm"
                          >
                            {body}
                          </MotionBox>
                        </Box>
                      </Flex>
                    );
                  })
                )}
                <span ref={messagesEndRef} />
              </Stack>

              <Box minH="28px" px={2} py={1}>
                <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  <TypingIndicator channelId="global" currentUserId={userName} />
                </MotionBox>
              </Box>

              <HStack mt={2} spacing={3} align="flex-end">
                <Box flex="1">
                  <Input
                    value={inputValue}
                    placeholder="Tulis pesan..."
                    onChange={handleInputChange}
                    onKeyDown={handleEnterPress}
                    bg={inputBg}
                    borderColor="rgba(148, 163, 184, 0.35)"
                    color="whiteAlpha.900"
                    _placeholder={{ color: 'whiteAlpha.500' }}
                    _focus={{ borderColor: 'cyan.300', boxShadow: '0 0 0 1px rgba(8, 145, 178, 0.5)' }}
                    isDisabled={!isConnected}
                  />
                </Box>
                <Button
                  colorScheme="cyan"
                  onClick={handleSendMessage}
                  isDisabled={!isConnected || !inputValue.trim()}
                >
                  Kirim
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
