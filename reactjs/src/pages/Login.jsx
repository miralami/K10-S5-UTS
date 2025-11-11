import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Container,
  Heading,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';

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
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Login gagal',
        description: error.message || 'Terjadi kesalahan saat login',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bg="gray.900"
      py={10}
      backgroundImage="linear-gradient(to bottom right, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))"
    >
      <Container maxW="lg">
        <VStack spacing={8} mx="auto" maxW="md" px={6}>
          <Heading
            fontSize="4xl"
            bgGradient="linear(to-r, cyan.200, blue.200)"
            bgClip="text"
          >
            Login
          </Heading>

          <Box
            rounded="lg"
            bg="rgba(15, 23, 42, 0.75)"
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            p={8}
            w="full"
          >
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel color="whiteAlpha.900">Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    _hover={{
                      borderColor: "whiteAlpha.300"
                    }}
                    _focus={{
                      borderColor: "cyan.200",
                      boxShadow: "0 0 0 1px cyan.200"
                    }}
                    color="white"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="whiteAlpha.900">Password</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    _hover={{
                      borderColor: "whiteAlpha.300"
                    }}
                    _focus={{
                      borderColor: "cyan.200",
                      boxShadow: "0 0 0 1px cyan.200"
                    }}
                    color="white"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="cyan"
                  size="lg"
                  fontSize="md"
                  w="full"
                  isLoading={isLoading}
                >
                  Login
                </Button>
              </VStack>
            </form>
          </Box>

          <Text color="whiteAlpha.700">
            Belum punya akun?{' '}
            <Button
              variant="link"
              color="cyan.200"
              onClick={() => navigate('/register')}
            >
              Daftar di sini
            </Button>
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}