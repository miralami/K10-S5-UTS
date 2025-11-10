import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { createNote, listNotes } from '../services/journalService';

const RECENT_LIMIT = 4;

function formatDate(value) {
  if (!value) return 'Tidak diketahui';
  try {
    return new Date(value).toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  } catch (error) {
    return value;
  }
}

export default function DailyEntry() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [userId, setUserId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentNotes, setRecentNotes] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState('');

  const toast = useToast();

  useEffect(() => {
    fetchRecentNotes();
  }, []);

  const fetchRecentNotes = async () => {
    setRecentError('');
    setIsLoadingRecent(true);
    try {
      const notes = await listNotes();
      setRecentNotes(notes.slice(0, RECENT_LIMIT));
    } catch (error) {
      setRecentError(error.message || 'Tidak dapat mengambil catatan terbaru.');
      setRecentNotes([]);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!body.trim()) {
      setSubmitError('Isi jurnal tidak boleh kosong.');
      return;
    }

    const trimmedUserId = userId.trim();
    const parsedUserId = trimmedUserId ? Number(trimmedUserId) : undefined;

    if (trimmedUserId && Number.isNaN(parsedUserId)) {
      setSubmitError('User ID harus berupa angka.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      await createNote({
        userId: parsedUserId,
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

      await fetchRecentNotes();
    } catch (error) {
      setSubmitError(error.message || 'Gagal menyimpan catatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-br, gray.900, gray.800)" py={{ base: 10, md: 16 }}>
      <Container maxW="5xl">
        <Stack spacing={12} color="whiteAlpha.900">
          <Stack spacing={4} textAlign={{ base: 'left', md: 'left' }}>
            <Heading size="2xl">Halo, bagaimana harimu?</Heading>
            <Text color="whiteAlpha.700" fontSize="lg">
              Tulis apa pun yang kamu rasakan hari ini. Anggap saja sedang bercakap dengan mentor emosionalmu—
              kami akan menyimpannya sebagai catatan harian yang bisa kamu refleksikan kapan pun.
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
            as="form"
            onSubmit={handleSubmit}
            bg="rgba(15, 23, 42, 0.75)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="3xl"
            px={{ base: 6, md: 10 }}
            py={{ base: 8, md: 10 }}
          >
            <Stack spacing={6}>
              <Stack spacing={2}>
                <Heading size="lg">Catatan baru</Heading>
                <Text color="whiteAlpha.600">
                  Bagikan cerita, pikiran, atau emosi yang kamu rasakan hari ini. Semakin jujur kamu menulis,
                  semakin kaya wawasan yang bisa kami berikan nanti.
                </Text>
              </Stack>

              <FormControl>
                <FormLabel color="whiteAlpha.700">Judul (opsional)</FormLabel>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Contoh: Hari produktif di kantor"
                  bg="whiteAlpha.100"
                  borderColor="whiteAlpha.200"
                  _focus={{ borderColor: 'cyan.300', boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.6)' }}
                  isDisabled={isSubmitting}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="whiteAlpha.700">Bagaimana perasaanmu hari ini?</FormLabel>
                <Textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Ceritakan secara bebas. Apa yang terjadi? Apa yang kamu pelajari?"
                  rows={8}
                  bg="whiteAlpha.100"
                  borderColor="whiteAlpha.200"
                  _focus={{ borderColor: 'cyan.300', boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.6)' }}
                  isDisabled={isSubmitting}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="whiteAlpha.700">User ID (opsional)</FormLabel>
                <Input
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="Masukkan ID pengguna jika ingin mengaitkan catatan"
                  bg="whiteAlpha.100"
                  borderColor="whiteAlpha.200"
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
                isLoading={isSubmitting}
                loadingText="Menyimpan catatan..."
              >
                Simpan cerita hari ini
              </Button>
            </Stack>
          </Box>

          <Stack spacing={5}>
            <HStack justify="space-between" align="center">
              <Heading size="lg">Catatan terbaru</Heading>
              <Button variant="ghost" colorScheme="cyan" onClick={fetchRecentNotes} isDisabled={isLoadingRecent}>
                Muat ulang
              </Button>
            </HStack>
            <Text color="whiteAlpha.600">
              Lihat sekilas tulisan terakhirmu sebelum menjelajah ke dashboard analisis.
            </Text>

            {recentError ? (
              <Alert status="error" variant="left-accent" borderRadius="lg">
                <AlertIcon />
                {recentError}
              </Alert>
            ) : null}

            {isLoadingRecent ? (
              <HStack spacing={3} color="whiteAlpha.800">
                <Spinner color="cyan.300" />
                <Text>Memuat catatan terbaru...</Text>
              </HStack>
            ) : recentNotes.length ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                {recentNotes.map((note) => (
                  <RecentNoteCard key={note.id} note={note} />
                ))}
              </SimpleGrid>
            ) : (
              <Box
                border="1px solid"
                borderColor="whiteAlpha.200"
                borderRadius="2xl"
                bg="rgba(15, 23, 42, 0.7)"
                px={{ base: 6, md: 8 }}
                py={{ base: 6, md: 8 }}
              >
                <Stack spacing={3}>
                  <Heading size="md">Belum ada catatan</Heading>
                  <Text color="whiteAlpha.700">
                    Mulailah menulis cerita pertamamu hari ini. Setiap catatan akan membantu kami memberi wawasan
                    emosi yang lebih akurat.
                  </Text>
                </Stack>
              </Box>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

function RecentNoteCard({ note }) {
  return (
    <Box
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="2xl"
      bg="rgba(15, 23, 42, 0.75)"
      px={{ base: 6, md: 8 }}
      py={{ base: 6, md: 7 }}
    >
      <Stack spacing={4}>
        <VStack align="start" spacing={1}>
          <Heading size="md">{note.title || 'Tanpa judul'}</Heading>
          <Text fontSize="sm" color="whiteAlpha.600">
            Ditulis pada {formatDate(note.createdAt)}
          </Text>
          {note.userId ? (
            <Badge colorScheme="cyan" borderRadius="full" px={3}>
              Pengguna #{note.userId}
            </Badge>
          ) : null}
        </VStack>

        <Divider borderColor="whiteAlpha.200" />

        <Text color="whiteAlpha.800" whiteSpace="pre-wrap">
          {note.body || 'Tidak ada isi catatan.'}
        </Text>
      </Stack>
    </Box>
  );
}
