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
  FormErrorMessage,
  Icon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EmailIcon, LockIcon, InfoIcon } from '@chakra-ui/icons';
import { register } from '../services/authService';

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
      bg={THEME.bg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      overflow="hidden"
      py={10}
    >
      {/* Decorative floating orbs */}
      <Box
        position="absolute"
        top="5%"
        right="15%"
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
        bottom="10%"
        left="10%"
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
        top="40%"
        left="20%"
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
                  Buat Akun Baru
                </Heading>
                <Text color={THEME.textSecondary}>Bergabunglah dengan komunitas kami</Text>
              </Box>

              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <Stack spacing={5}>
                  <FormControl isInvalid={!!errors.name} isRequired>
                    <FormLabel color={THEME.textPrimary} fontWeight="500">
                      Nama
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={InfoIcon} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        name="name"
                        placeholder="Nama Lengkap"
                        value={formData.name}
                        onChange={handleChange}
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
                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.email} isRequired>
                    <FormLabel color={THEME.textPrimary} fontWeight="500">
                      Email
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={EmailIcon} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        name="email"
                        type="email"
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={handleChange}
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
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.password} isRequired>
                    <FormLabel color={THEME.textPrimary} fontWeight="500">
                      Password
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={LockIcon} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
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
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.password_confirmation} isRequired>
                    <FormLabel color={THEME.textPrimary} fontWeight="500">
                      Konfirmasi Password
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={LockIcon} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        name="password_confirmation"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password_confirmation}
                        onChange={handleChange}
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
                    <FormErrorMessage>{errors.password_confirmation}</FormErrorMessage>
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
                    Daftar
                  </Button>
                </Stack>
              </form>

              <Text color={THEME.textSecondary} fontSize="sm">
                Sudah punya akun?{' '}
                <Button
                  variant="link"
                  color={THEME.accent}
                  fontWeight="bold"
                  onClick={() => navigate('/login')}
                  _hover={{ textDecoration: 'none', color: THEME.accentDark }}
                >
                  Login sekarang
                </Button>
              </Text>
            </VStack>
          </WarmCard>
        </MotionBox>
      </Container>
    </Box>
  );
}
