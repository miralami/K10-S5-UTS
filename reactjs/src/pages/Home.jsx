import { useState } from 'react';
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
  Stack,
  Text,
  Textarea,
  useToast,
  Wrap,
  WrapItem,
  Input,
} from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { createNote } from '../services/journalService';

const MOOD_OPTIONS = [
  {
    id: 'lega',
    label: 'Lega',
    helper: 'Napaskan rasa lega itu—ceritakan momen yang membuatmu tersenyum lebih tenang.',
    template: 'Hari ini aku merasa lega karena ...',
    placeholder: 'Apa yang membuatmu merasa lega belakangan ini?'
  },
  {
    id: 'lelah',
    label: 'Lelah',
    helper: 'Tidak apa-apa merasa lelah. Tuliskan apa yang paling menguras energimu.',
    template: 'Aku merasa lelah karena ...',
    placeholder: 'Apa yang menguras energimu hari ini?'
  },
  {
    id: 'bersyukur',
    label: 'Bersyukur',
    helper: 'Rayakan hal kecil yang membuatmu bersyukur hari ini.',
    template: 'Aku bersyukur karena ...',
    placeholder: 'Momen kecil apa yang ingin kamu syukuri?'
  },
  {
    id: 'penasaran',
    label: 'Penasaran',
    helper: 'Tuliskan hal baru yang ingin kamu eksplor atau pelajari.',
    template: 'Hal yang membuatku penasaran akhir-akhir ini ...',
    placeholder: 'Apa yang ingin kamu gali lebih jauh saat ini?'
  },
];

const QUICK_PROMPTS = [
  { id: 'highlight', label: 'Highlight Hari Ini', text: 'Momen terbaik hari ini terjadi ketika ...' },
  { id: 'lesson', label: 'Pelajaran Penting', text: 'Hal paling berharga yang kupelajari hari ini adalah ...' },
  { id: 'selfcare', label: 'Self-care', text: 'Untuk menjaga diri, aku ingin ...' },
  { id: 'shoutout', label: 'Ucapan Terima Kasih', text: 'Seseorang yang ingin aku ucapkan terima kasih hari ini adalah ...' },
];

export default function DailyEntry() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [activeMood, setActiveMood] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

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

      toast({
        title: 'Catatan tersimpan',
        description: 'Jurnal harianmu berhasil direkam.',
        status: 'success',
        duration: 4000,
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
    <Box minH="100vh" bgGradient="linear(to-br, gray.900, gray.800)" py={{ base: 10, md: 16 }}>
      <Container maxW="5xl">
        <Stack spacing={14} color="whiteAlpha.900">
          <Stack spacing={3} textAlign="center" align="center">
            <Badge colorScheme="purple" px={3} py={1} borderRadius="full" textTransform="none">
              Mood Journal versi ramah hati
            </Badge>
            <Heading size="2xl">Apa yang ada di pikiranmu hari ini?</Heading>
            <Text color="whiteAlpha.700" fontSize="lg" maxW="3xl">
              Curhatlah seolah kamu sedang ngobrol dengan sahabat yang selalu mendengar. Kami bantu simpan dan
              nantinya menganalisisnya menjadi wawasan emosimu.
            </Text>
            <Button
              as={RouterLink}
              to="/dashboard"
              variant="outline"
              colorScheme="cyan"
              rightIcon={<ArrowForwardIcon />}
            >
              Lihat dashboard jurnal
            </Button>
          </Stack>

          <Box
            bg="rgba(15, 23, 42, 0.75)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="3xl"
            px={{ base: 6, md: 12 }}
            py={{ base: 10, md: 14 }}
            boxShadow="xl"
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
                        <Button
                          variant={isActive ? 'solid' : 'outline'}
                          colorScheme="cyan"
                          size="sm"
                          onClick={() => handleSelectMood(option)}
                        >
                          {option.label}
                        </Button>
                      </WrapItem>
                    );
                  })}
                </Wrap>
                <Text color="cyan.200" fontSize="sm" textAlign="center" maxW="2xl">
                  {activeMood ? activeMood.helper : 'Kalau bingung mulai dari mana, klik salah satu mood di atas untuk inspirasi kalimat pertama.'}
                </Text>
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
                      _focus={{ borderColor: 'cyan.300', boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.6)' }}
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
                      <Button
                        variant="ghost"
                        colorScheme="cyan"
                        size="sm"
                        onClick={() => handleApplyPrompt(prompt)}
                      >
                        {prompt.label}
                      </Button>
                    </WrapItem>
                  ))}
                </Wrap>
                <Text color="whiteAlpha.500" fontSize="sm">
                  Klik sekali untuk menambahkan kalimat pembuka ke catatanmu.
                </Text>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
