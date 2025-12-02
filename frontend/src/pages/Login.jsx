import { useState } from 'react';
import PropTypes from 'prop-types';
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

// WarmCard component
const WarmCard = ({ children, ...props }) => (
  <Box
    bg={THEME.card}
    borderRadius="2xl"
    border="1px solid"
    borderColor="gray.200"
    boxShadow={`0 4px 20px ${THEME.shadow}`}
    p={{ base: 6, md: 8 }}
    transition="all 0.2s ease"
    {...props}
  >
    {children}
  </Box>
);

WarmCard.propTypes = {
  children: PropTypes.node.isRequired,
};

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
      bg={THEME.bg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      overflow="hidden"
    >
      {/* Decorative floating orbs */}
      <Box
        position="absolute"
        top="10%"
        left="10%"
        w="300px"
        h="300px"
        bg="purple.100"
        borderRadius="full"
        opacity={0.4}
        filter="blur(60px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="20%"
        right="10%"
        w="250px"
        h="250px"
        bg="blue.100"
        borderRadius="full"
        opacity={0.3}
        filter="blur(50px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        top="50%"
        right="30%"
        w="200px"
        h="200px"
        bg="yellow.100"
        borderRadius="full"
        opacity={0.3}
        filter="blur(40px)"
        pointerEvents="none"
      />

      <Container maxW="md" position="relative" zIndex={1}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <WarmCard>
            <VStack spacing={8}>
              <Box textAlign="center">
                <Heading fontSize="3xl" fontWeight="700" color={THEME.accent} mb={2}>
                  Selamat Datang
                </Heading>
                <Text color={THEME.textSecondary}>Masuk untuk melanjutkan perjalananmu</Text>
              </Box>

              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <Stack spacing={5}>
                  <FormControl isRequired>
                    <FormLabel color={THEME.textPrimary} fontWeight="500">
                      Email
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={EmailIcon} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type="email"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        bg={THEME.card}
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="xl"
                        _hover={{ borderColor: 'gray.300' }}
                        _focus={{
                          borderColor: THEME.accent,
                          boxShadow: `0 0 0 3px ${THEME.accentLight}`,
                        }}
                        _placeholder={{ color: 'gray.400' }}
                        color={THEME.textPrimary}
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={THEME.textPrimary} fontWeight="500">
                      Password
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={LockIcon} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        bg={THEME.card}
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="xl"
                        _hover={{ borderColor: 'gray.300' }}
                        _focus={{
                          borderColor: THEME.accent,
                          boxShadow: `0 0 0 3px ${THEME.accentLight}`,
                        }}
                        _placeholder={{ color: 'gray.400' }}
                        color={THEME.textPrimary}
                      />
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    size="lg"
                    w="full"
                    isLoading={isLoading}
                    bg={THEME.accent}
                    color="white"
                    borderRadius="xl"
                    fontWeight="600"
                    _hover={{
                      bg: THEME.accentDark,
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

              <Text color={THEME.textSecondary} fontSize="sm">
                Belum punya akun?{' '}
                <Button
                  variant="link"
                  color={THEME.accent}
                  fontWeight="bold"
                  onClick={() => navigate('/register')}
                  _hover={{ textDecoration: 'none', color: THEME.accentDark }}
                >
                  Daftar sekarang
                </Button>
              </Text>
            </VStack>
          </WarmCard>
        </MotionBox>
      </Container>
    </Box>
  );
}
