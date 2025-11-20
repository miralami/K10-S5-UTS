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
  FormErrorMessage,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/authService';

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
          <Heading fontSize="4xl" bgGradient="linear(to-r, cyan.200, blue.200)" bgClip="text">
            Daftar Akun
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
                <FormControl isInvalid={!!errors.name} isRequired>
                  <FormLabel color="whiteAlpha.900">Nama</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    _hover={{
                      borderColor: 'whiteAlpha.300',
                    }}
                    _focus={{
                      borderColor: 'cyan.200',
                      boxShadow: '0 0 0 1px cyan.200',
                    }}
                    color="white"
                  />
                  <FormErrorMessage>{errors.name}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.email} isRequired>
                  <FormLabel color="whiteAlpha.900">Email</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    _hover={{
                      borderColor: 'whiteAlpha.300',
                    }}
                    _focus={{
                      borderColor: 'cyan.200',
                      boxShadow: '0 0 0 1px cyan.200',
                    }}
                    color="white"
                  />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password} isRequired>
                  <FormLabel color="whiteAlpha.900">Password</FormLabel>
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    _hover={{
                      borderColor: 'whiteAlpha.300',
                    }}
                    _focus={{
                      borderColor: 'cyan.200',
                      boxShadow: '0 0 0 1px cyan.200',
                    }}
                    color="white"
                  />
                  <FormErrorMessage>{errors.password}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password_confirmation} isRequired>
                  <FormLabel color="whiteAlpha.900">Konfirmasi Password</FormLabel>
                  <Input
                    name="password_confirmation"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    _hover={{
                      borderColor: 'whiteAlpha.300',
                    }}
                    _focus={{
                      borderColor: 'cyan.200',
                      boxShadow: '0 0 0 1px cyan.200',
                    }}
                    color="white"
                  />
                  <FormErrorMessage>{errors.password_confirmation}</FormErrorMessage>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="cyan"
                  size="lg"
                  fontSize="md"
                  w="full"
                  isLoading={isLoading}
                >
                  Daftar
                </Button>
              </VStack>
            </form>
          </Box>

          <Text color="whiteAlpha.700">
            Sudah punya akun?{' '}
            <Button variant="link" color="cyan.200" onClick={() => navigate('/login')}>
              Login di sini
            </Button>
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}
