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
  FormErrorMessage,
  Icon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EmailIcon, LockIcon, InfoIcon } from '@chakra-ui/icons';
import { register } from '../services/authService';
import { GlassCard } from '../components/GlassCard';

const MotionBox = motion(Box);

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama harus diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email harus diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.password) {
      newErrors.password = 'Password harus diisi';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter';
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Konfirmasi password harus diisi';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await register(formData);
      if (response.status === 'success') {
        toast({
          title: 'Registrasi berhasil',
          description: 'Selamat datang di aplikasi!',
          status: 'success',
          duration: 3000,
          position: 'top',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      let errorMessage = 'Terjadi kesalahan saat registrasi';

      // Handle validation errors from backend
      if (error.response?.errors) {
        const backendErrors = error.response.errors;
        setErrors(backendErrors);
        errorMessage = 'Mohon periksa kembali data yang dimasukkan';
      }

      toast({
        title: 'Registrasi gagal',
        description: error.message || errorMessage,
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
      py={10}
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
                  Buat Akun Baru
                </Heading>
                <Text color="whiteAlpha.600">Bergabunglah dengan komunitas kami</Text>
              </Box>

              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <Stack spacing={5}>
                  <FormControl isInvalid={!!errors.name} isRequired>
                    <FormLabel color="whiteAlpha.900">Nama</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={InfoIcon} color="whiteAlpha.400" />
                      </InputLeftElement>
                      <Input
                        name="name"
                        placeholder="Nama Lengkap"
                        value={formData.name}
                        onChange={handleChange}
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
                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.email} isRequired>
                    <FormLabel color="whiteAlpha.900">Email</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={EmailIcon} color="whiteAlpha.400" />
                      </InputLeftElement>
                      <Input
                        name="email"
                        type="email"
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={handleChange}
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
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.password} isRequired>
                    <FormLabel color="whiteAlpha.900">Password</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={LockIcon} color="whiteAlpha.400" />
                      </InputLeftElement>
                      <Input
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
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
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.password_confirmation} isRequired>
                    <FormLabel color="whiteAlpha.900">Konfirmasi Password</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={LockIcon} color="whiteAlpha.400" />
                      </InputLeftElement>
                      <Input
                        name="password_confirmation"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password_confirmation}
                        onChange={handleChange}
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
                    <FormErrorMessage>{errors.password_confirmation}</FormErrorMessage>
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
                    Daftar
                  </Button>
                </Stack>
              </form>

              <Text color="whiteAlpha.600" fontSize="sm">
                Sudah punya akun?{' '}
                <Button
                  variant="link"
                  color="cyan.300"
                  fontWeight="bold"
                  onClick={() => navigate('/login')}
                  _hover={{ textDecoration: 'none', color: 'cyan.200' }}
                >
                  Login sekarang
                </Button>
              </Text>
            </VStack>
          </GlassCard>
        </MotionBox>
      </Container>
    </Box>
  );
}
