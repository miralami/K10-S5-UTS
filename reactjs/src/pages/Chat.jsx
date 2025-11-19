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
import TypingIndicator from '../components/TypingIndicator';
import { typingService } from '../services/typingService';

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
      typingService.sendTyping('global', true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
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

            <Flex direction="column" px={{ base: 3, md: 6 }} py={6} bg={messagesBg} minH="440px">
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
                  messages.map((message) => (
                    <Flex
                      key={message.id}
                      justify={message.type === 'sent' ? 'flex-end' : 'flex-start'}
                    >
                      <Box
                        bg={message.type === 'sent' ? 'cyan.500' : message.type === 'system' ? 'whiteAlpha.200' : 'rgba(148, 163, 184, 0.18)'}
                        color={message.type === 'sent' ? 'white' : 'whiteAlpha.900'}
                        px={4}
                        py={2.5}
                        borderRadius="xl"
                        maxW="70%"
                        boxShadow="md"
                        fontSize="sm"
                      >
                        {message.text}
                      </Box>
                    </Flex>
                  ))
                )}
                <span ref={messagesEndRef} />
              </Stack>

              <Box minH="24px" px={2} py={1}>
                <TypingIndicator channelId="global" currentUserId={userName} />
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
