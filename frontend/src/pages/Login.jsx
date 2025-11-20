import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  VStack,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EmailIcon, LockIcon } from '@chakra-ui/icons';
import { login } from '../services/authService';
import { GlassCard } from '../components/GlassCard';

const MotionBox = motion(Box);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      if (response.status === 'success') {
        toast({
          title: 'Login berhasil',
          description: 'Selamat datang kembali!',
          status: 'success',
          duration: 3000,
          position: 'top',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Login gagal',
        description: error.message || 'Terjadi kesalahan saat login',
        status: 'error',
        duration: 5000,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, #1a1a2e, #16213e, #0f3460, #533483)"
      display="flex"
      alignItems="center"
      justifyContent="center"
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
          <GlassCard p={8}>
            <VStack spacing={8}>
              <Box textAlign="center">
                <Heading
                  fontSize="3xl"
                  bgGradient="linear(to-r, cyan.200, purple.200)"
                  bgClip="text"
                  mb={2}
                >
                  Selamat Datang
                </Heading>
                <Text color="whiteAlpha.600">Masuk untuk melanjutkan perjalananmu</Text>
              </Box>

              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <Stack spacing={5}>
                  <FormControl isRequired>
                    <FormLabel color="whiteAlpha.900">Email</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={EmailIcon} color="whiteAlpha.400" />
                      </InputLeftElement>
                      <Input
                        type="email"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        bg="whiteAlpha.50"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                        _hover={{ borderColor: 'whiteAlpha.300' }}
                        _focus={{
                          borderColor: 'cyan.300',
                          bg: 'whiteAlpha.100',
                          boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.5)',
                        }}
                        _placeholder={{ color: 'whiteAlpha.300' }}
                        color="white"
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color="whiteAlpha.900">Password</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={LockIcon} color="whiteAlpha.400" />
                      </InputLeftElement>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        bg="whiteAlpha.50"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                        _hover={{ borderColor: 'whiteAlpha.300' }}
                        _focus={{
                          borderColor: 'cyan.300',
                          bg: 'whiteAlpha.100',
                          boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.5)',
                        }}
                        _placeholder={{ color: 'whiteAlpha.300' }}
                        color="white"
                      />
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    size="lg"
                    w="full"
                    isLoading={isLoading}
                    bgGradient="linear(to-r, cyan.500, blue.500)"
                    color="white"
                    _hover={{
                      bgGradient: 'linear(to-r, cyan.400, blue.400)',
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                    }}
                    _active={{ transform: 'translateY(0)' }}
                    transition="all 0.2s"
                  >
                    Masuk
                  </Button>
                </Stack>
              </form>

              <Text color="whiteAlpha.600" fontSize="sm">
                Belum punya akun?{' '}
                <Button
                  variant="link"
                  color="cyan.300"
                  fontWeight="bold"
                  onClick={() => navigate('/register')}
                  _hover={{ textDecoration: 'none', color: 'cyan.200' }}
                >
                  Daftar sekarang
                </Button>
              </Text>
            </VStack>
          </GlassCard>
        </MotionBox>
      </Container>
    </Box>
  );
}
