import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  Textarea,
  useToast,
  Wrap, 
  WrapItem,
  Input,
} from '@chakra-ui/react';
import { ArrowForwardIcon, LockIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { createNote } from '../services/journalService';

// Framer Motion wrapper untuk komponen Chakra UI
const MotionBox = motion(Box);
const MotionButton = motion(Button);

// Mood dengan warna dan emoji yang lebih empatik
const MOOD_OPTIONS = [
  {
    id: 'lega',
    label: '😌 Lega',
    helper: 'Napaskan rasa lega itu—ceritakan momen yang membuatmu tersenyum lebih tenang.',
    template: 'Hari ini aku merasa lega karena ...',
    placeholder: 'Apa yang membuatmu merasa lega belakangan ini?',
    gradient: 'linear(to-br, cyan.400, teal.300, green.200)',
    glowColor: 'rgba(56, 189, 248, 0.3)',
  },
  {
    id: 'lelah',
    label: '😔 Lelah',
    helper: 'Tidak apa-apa merasa lelah. Tuliskan apa yang paling menguras energimu.',
    template: 'Aku merasa lelah karena ...',
    placeholder: 'Apa yang menguras energimu hari ini?',
    gradient: 'linear(to-br, purple.400, gray.500, purple.300)',
    glowColor: 'rgba(159, 122, 234, 0.3)',
  },
  {
    id: 'bersyukur',
    label: '🙏 Bersyukur',
    helper: 'Rayakan hal kecil yang membuatmu bersyukur hari ini.',
    template: 'Aku bersyukur karena ...',
    placeholder: 'Momen kecil apa yang ingin kamu syukuri?',
    gradient: 'linear(to-br, orange.300, pink.300, rose.200)',
    glowColor: 'rgba(251, 191, 36, 0.3)',
  },
  {
    id: 'penasaran',
    label: '🤔 Penasaran',
    helper: 'Tuliskan hal baru yang ingin kamu eksplor atau pelajari.',
    template: 'Hal yang membuatku penasaran akhir-akhir ini ...',
    placeholder: 'Apa yang ingin kamu gali lebih jauh saat ini?',
    gradient: 'linear(to-br, blue.300, cyan.300, purple.200)',
    glowColor: 'rgba(96, 165, 250, 0.3)',
  },
];

const QUICK_PROMPTS = [
  { id: 'highlight', label: '✨ Highlight Hari Ini', text: 'Momen terbaik hari ini terjadi ketika ...' },
  { id: 'lesson', label: '💡 Pelajaran Penting', text: 'Hal paling berharga yang kupelajari hari ini adalah ...' },
  { id: 'selfcare', label: '🌸 Self-care', text: 'Untuk menjaga diri, aku ingin ...' },
  { id: 'shoutout', label: '💛 Ucapan Terima Kasih', text: 'Seseorang yang ingin aku ucapkan terima kasih hari ini adalah ...' },
];

// Fungsi untuk mendapatkan sapaan berdasarkan waktu
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 10) {
    return {
      greeting: 'Selamat pagi! ☀️',
      message: 'Bagaimana perasaanmu memulai hari ini?',
    };
  } else if (hour >= 10 && hour < 15) {
    return {
      greeting: 'Halo! 👋',
      message: 'Sudah sempat istirahat sebentar hari ini?',
    };
  } else if (hour >= 15 && hour < 18) {
    return {
      greeting: 'Selamat sore! 🌤️',
      message: 'Bagaimana harimu sejauh ini?',
    };
  } else if (hour >= 18 && hour < 22) {
    return {
      greeting: 'Selamat malam! 🌙',
      message: 'Mau berbagi cerita sebelum istirahat?',
    };
  } else {
    return {
      greeting: 'Halo, night owl! 🦉',
      message: 'Masih ada yang mengganjal di pikiran?',
    };
  }
};

// Fungsi untuk mendapatkan feedback berdasarkan mood
const getMoodFeedback = (moodId) => {
  const feedbacks = {
    lega: 'Senang mendengar kamu merasa lega. Kamu hebat sudah melewati itu! ✨',
    lelah: 'Kelihatannya kamu butuh istirahat. Kamu hebat sudah menuliskannya! 💙',
    bersyukur: 'Indah sekali momen yang kamu syukuri. Terus rayakan hal-hal kecil! 🌟',
    penasaran: 'Rasa penasaranmu membawa pertumbuhan. Terus eksplor! 🚀',
  };
  return feedbacks[moodId] || 'Terima kasih sudah berbagi ceritamu hari ini! 💫';
};

export default function DailyEntry() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [activeMood, setActiveMood] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [greeting, setGreeting] = useState({ greeting: '', message: '' });

  const toast = useToast();

  // Set sapaan dinamis saat komponen mount
  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
  }, []);

  const handleSelectMood = (option) => {
    setSubmitError('');
    const isSameMood = activeMood?.id === option.id;

    if (isSameMood) {
      setActiveMood(null);
      return;
    }

    setActiveMood(option);

    // Saat mood baru dipilih, langsung ganti isi textarea dengan template mood.
    // Ini memastikan klik mood lain langsung memperbarui prompt walau textarea tidak kosong.
    setBody(option.template);
  };

  // Catatan: Prompt ini membantu pengguna keluar dari writer's block dengan menambahkan paragraf awal.
  const handleApplyPrompt = (prompt) => {
    setSubmitError('');
    setBody((current) => {
      const trimmed = current.trim();
      const spacer = trimmed ? '\n\n' : '';
      return `${trimmed}${spacer}${prompt.text}`.trim();
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!body.trim()) {
      setSubmitError('Isi jurnal tidak boleh kosong.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      await createNote({
        title: title.trim() || null,
        body: body.trim(),
      });

      // Feedback yang lebih personal berdasarkan mood
      const moodFeedback = activeMood ? getMoodFeedback(activeMood.id) : 'Terima kasih sudah berbagi ceritamu! 💫';

      toast({
        title: '🔒 Catatan tersimpan dengan aman',
        description: moodFeedback,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setTitle('');
      setBody('');
      setActiveMood(null);
    } catch (error) {
      setSubmitError(error.message || 'Gagal menyimpan catatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box 
      minH="100vh" 
      bgGradient={activeMood?.gradient || "linear(to-br, #1a1a2e, #16213e, #0f3460, #533483)"} 
      py={{ base: 10, md: 16 }}
      transition="background 0.6s ease-in-out"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgImage: 'radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(167, 139, 250, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
      }}
    >
      <Container maxW="5xl" position="relative" zIndex={1}>
        <Stack spacing={14} color="whiteAlpha.900">
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Stack spacing={3} textAlign="center" align="center">
              <HStack spacing={2}>
                <Badge colorScheme="purple" px={3} py={1} borderRadius="full" textTransform="none">
                  🔒 Private by default
                </Badge>
                <Badge colorScheme="pink" px={3} py={1} borderRadius="full" textTransform="none">
                  Mood Journal
                </Badge>
              </HStack>
              <Heading size="2xl" mt={2}>{greeting.greeting}</Heading>
              <Text color="orange.200" fontSize="xl" fontWeight="medium">
                {greeting.message}
              </Text>
              <Text color="whiteAlpha.700" fontSize="md" maxW="3xl" mt={2}>
                Curhatlah seolah kamu sedang ngobrol dengan sahabat. Tulisanmu hanya untukmu—
                tidak ada yang bisa membacanya tanpa izinmu.
              </Text>
              <Button
                as={RouterLink}
                to="/dashboard"
                variant="outline"
                colorScheme="cyan"
                rightIcon={<ArrowForwardIcon />}
                mt={2}
              >
                Lihat refleksi harianmu
              </Button>
            </Stack>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            bg="rgba(15, 23, 42, 0.75)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="3xl"
            px={{ base: 6, md: 12 }}
            py={{ base: 10, md: 14 }}
            boxShadow={activeMood ? `0 0 60px ${activeMood.glowColor}` : 'xl'}
            backdropFilter="blur(20px)"
            sx={{ transition: 'box-shadow 0.5s ease-in-out' }}
          >
            <Stack spacing={10} align="center">
              <Stack spacing={4} align="center" w="full">
                <Text color="whiteAlpha.700" fontSize="md">
                  Pilih vibe harianmu sebagai pemantik cerita:
                </Text>
                <Wrap spacing={3} justify="center">
                  {MOOD_OPTIONS.map((option) => {
                    const isActive = activeMood?.id === option.id;
                    return (
                      <WrapItem key={option.id}>
                        <MotionButton
                          as={Button}
                          variant={isActive ? 'solid' : 'outline'}
                          colorScheme={isActive ? 'purple' : 'cyan'}
                          size="sm"
                          onClick={() => handleSelectMood(option)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                          {option.label}
                        </MotionButton>
                      </WrapItem>
                    );
                  })}
                </Wrap>
                <AnimatePresence mode="wait">
                  <MotionBox
                    key={activeMood?.id || 'default'}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Text color="orange.200" fontSize="sm" textAlign="center" maxW="2xl" fontWeight="medium">
                      {activeMood ? activeMood.helper : 'Kalau bingung mulai dari mana, klik salah satu mood di atas untuk inspirasi kalimat pertama.'}
                    </Text>
                  </MotionBox>
                </AnimatePresence>
              </Stack>

              <Box as="form" onSubmit={handleSubmit} w="full" maxW="3xl">
                <Stack spacing={6}>
                  <FormControl>
                    <FormLabel color="whiteAlpha.700">Judul (opsional)</FormLabel>
                    <Input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Contoh: Hari produktif di kantor"
                      bg="whiteAlpha.100"
                      borderColor="whiteAlpha.200"
                      borderRadius="xl"
                      _focus={{ borderColor: 'cyan.300', boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.6)' }}
                      isDisabled={isSubmitting}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel color="whiteAlpha.700">Ceritakan apa yang kamu rasakan</FormLabel>
                    <Textarea
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      placeholder={activeMood?.placeholder || 'Tulis bebas: apa yang membuatmu tersenyum atau mengernyit hari ini?'}
                      rows={8}
                      fontSize="lg"
                      bg="rgba(8, 47, 73, 0.35)"
                      borderColor="whiteAlpha.200"
                      borderRadius="3xl"
                      px={6}
                      py={5}
                      _focus={{ 
                        borderColor: activeMood ? 'purple.300' : 'cyan.300', 
                        boxShadow: activeMood 
                          ? `0 0 0 1px ${activeMood.glowColor}, 0 0 20px ${activeMood.glowColor}` 
                          : '0 0 0 1px rgba(56, 189, 248, 0.6)' 
                      }}
                      transition="all 0.3s ease-in-out"
                      isDisabled={isSubmitting}
                    />
                  </FormControl>

                  {submitError ? (
                    <Alert status="error" variant="left-accent" borderRadius="lg">
                      <AlertIcon />
                      {submitError}
                    </Alert>
                  ) : null}

                  <Button
                    type="submit"
                    colorScheme="cyan"
                    size="lg"
                    height="56px"
                    borderRadius="full"
                    isLoading={isSubmitting}
                    loadingText="Menyimpan catatan..."
                  >
                    Simpan cerita hari ini
                  </Button>
                </Stack>
              </Box>

              <Stack spacing={4} w="full" maxW="3xl" textAlign="center">
                <Text color="whiteAlpha.600">Butuh ide? Coba salah satu pemantik ini:</Text>
                <Wrap spacing={3} justify="center">
                  {QUICK_PROMPTS.map((prompt) => (
                    <WrapItem key={prompt.id}>
                      <MotionButton
                        as={Button}
                        variant="ghost"
                        colorScheme="pink"
                        size="sm"
                        onClick={() => handleApplyPrompt(prompt)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {prompt.label}
                      </MotionButton>
                    </WrapItem>
                  ))}
                </Wrap>
                <Text color="whiteAlpha.500" fontSize="sm">
                  Klik sekali untuk menambahkan kalimat pembuka ke catatanmu.
                </Text>
              </Stack>
            </Stack>
          </MotionBox>

          {/* Footer dengan reassurance privasi */}
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Stack spacing={2} textAlign="center">
              <HStack justify="center" spacing={2} color="whiteAlpha.600">
                <Icon as={LockIcon} />
                <Text fontSize="sm">
                  Tulisanmu tersimpan dengan enkripsi. Hanya kamu yang bisa mengaksesnya.
                </Text>
              </HStack>
              <Text fontSize="xs" color="whiteAlpha.500">
                Night of Reflection • Mood Journal yang ramah hati
              </Text>
            </Stack>
          </MotionBox>
        </Stack>
      </Container>
    </Box>
  );
}
