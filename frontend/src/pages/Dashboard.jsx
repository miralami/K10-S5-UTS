import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { format, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';

// Helper untuk greeting dinamis
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 10) {
    return { greeting: 'Selamat pagi! ☀️', message: 'Semoga hari ini penuh energi positif' };
  } else if (hour >= 10 && hour < 15) {
    return { greeting: 'Halo! 👋', message: 'Ayo lihat perjalanan moodmu minggu ini' };
  } else if (hour >= 15 && hour < 18) {
    return { greeting: 'Selamat sore! 🌤️', message: 'Waktunya refleksi sejenak' };
  } else if (hour >= 18 && hour < 22) {
    return { greeting: 'Selamat malam! 🌙', message: 'Lihat catatan harianmu hari ini' };
  } else {
    return { greeting: 'Masih terjaga? 🦉', message: 'Jangan lupa istirahat ya' };
  }
};
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Image,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Textarea,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast,
  SlideFade,
  ScaleFade,
  useDisclosure,
  useBreakpointValue,
  Badge,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { GlassCard } from '../components/GlassCard';
import CircularProgress from '../components/CircularProgress';
import { motion } from 'framer-motion';
import MoodEmoji from '../components/MoodEmoji';
import {
  AddIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DeleteIcon,
  EditIcon,
  RepeatIcon,
  HamburgerIcon,
} from '@chakra-ui/icons';
import JournalCalendar from '../components/JournalCalendar';
import {
  getWeeklySummary,
  listNotes,
  updateNote,
  deleteNote,
  generateWeeklyForCurrentUser,
} from '../services/journalService';

// Helper component for info cards - commented out as it's unused currently
// function InfoCard({ label, value, color = 'whiteAlpha.800' }) {
//   return (
//     <Box bg="whiteAlpha.100" p={4} borderRadius="lg">
//       <Text fontSize="sm" color="whiteAlpha.600" mb={1}>
//         {label}
//       </Text>
//       <Text color={color} fontWeight="medium">
//         {value}
//       </Text>
//     </Box>
//   );
// }

// lightweight SVG fallback used when poster fails to load or is aborted
const POSTER_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 900'>" +
      "<rect width='100%' height='100%' fill='%23101720'/>" +
      "<text x='50%' y='50%' fill='%23a3a3a3' font-size='22' text-anchor='middle' dominant-baseline='middle'>No Image</text>" +
      '</svg>'
  );

function getOmdbHref(movie) {
  const imdbId = movie?.imdbId;
  const title = movie?.title || '';
  const year = movie?.year ? String(movie.year) : '';
  if (imdbId) return `https://www.imdb.com/title/${imdbId}/`;
  const qs = new URLSearchParams();
  if (title) qs.set('t', title);
  if (year) qs.set('y', year);
  qs.set('apikey', '19886b2');
  return `https://www.omdbapi.com/?${qs.toString()}`;
}

function MoodMovieCard({ movie }) {
  return (
    <Box
      bg="whiteAlpha.100"
      borderRadius="lg"
      border="1px solid"
      borderColor="whiteAlpha.200"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      h="100%"
      _hover={{
        borderColor: 'pink.300',
      }}
      transition="all 0.3s"
    >
      {movie.posterUrl ? (
        <Link href={getOmdbHref(movie)} isExternal>
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            objectFit="cover"
            w="100%"
            h="120px"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            fallbackSrc={POSTER_FALLBACK}
          />
        </Link>
      ) : (
        <Flex align="center" justify="center" w="100%" h="120px" bg="whiteAlpha.200">
          <Text fontSize="2xl">🎬</Text>
        </Flex>
      )}
      <Stack spacing={1.5} p={2} flex="1">
        <Box>
          <Heading size="xs" color="pink.200" noOfLines={1}>
            {movie.title}
          </Heading>
          <HStack spacing={1} mt={1}>
            {movie.year && (
              <Badge colorScheme="purple" variant="subtle" fontSize="2xs">
                {movie.year}
              </Badge>
            )}
            {movie.imdbId && (
              <Badge colorScheme="pink" variant="outline" fontSize="2xs">
                IMDb
              </Badge>
            )}
          </HStack>
        </Box>
        <Text fontSize="2xs" color="whiteAlpha.900" lineHeight="short" noOfLines={2}>
          {movie.reason}
        </Text>
        {Array.isArray(movie.genres) && movie.genres.length > 0 && (
          <Wrap spacing={1}>
            {movie.genres.slice(0, 3).map((genre) => (
              <WrapItem key={genre}>
                <Badge colorScheme="cyan" variant="subtle" fontSize="2xs">
                  {genre}
                </Badge>
              </WrapItem>
            ))}
          </Wrap>
        )}
      </Stack>
    </Box>
  );
}

MoodMovieCard.propTypes = {
  movie: PropTypes.shape({
    posterUrl: PropTypes.string,
    title: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    imdbId: PropTypes.string,
    reason: PropTypes.string,
    genres: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

export default function Dashboard() {
  const { isOpen: isSidebarOpen, onToggle: onSidebarToggle } = useDisclosure({
    defaultIsOpen: true,
  });
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const showSidebarToggle = useBreakpointValue({ base: true, xl: false });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [greeting, setGreeting] = useState({ greeting: '', message: '' });
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    return {
      start: startOfWeek(today, { locale: id, weekStartsOn: 1 }),
      end: endOfWeek(today, { locale: id, weekStartsOn: 1 }),
    };
  });

  // Set greeting saat mount
  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
  }, []);

  const [weeklyData, setWeeklyData] = useState({
    analysis: null,
    dailySummaries: [],
    recommendations: null,
    status: 'idle',
    message: null,
  });
  const [weeklyLoading, setWeeklyLoading] = useState(true);

  const [allNotes, setAllNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const toast = useToast();

  // Get notes for the selected date
  const notesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    // Filter notes by selectedDate using normalized `note_date` or `createdAt` fields.
    const seen = new Set();
    const filtered = allNotes.filter((note) => {
      // group strictly by note_date to avoid moving to today after edits
      const dateStr =
        note.note_date ||
        note.noteDate ||
        note.createdAt ||
        note.created_at ||
        note.updatedAt ||
        note.updated_at;
      if (!dateStr) return false;
      const noteDate = new Date(dateStr);
      if (!isSameDay(noteDate, selectedDate)) return false;
      // dedupe by id if present, otherwise by combination key
      const key = note.id ?? `${dateStr}::${(note.body || '').slice(0, 40)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // sort by updated time descending (most recent first), fallbacks included
    filtered.sort(
      (a, b) =>
        new Date(b.updatedAt || b.note_date || b.createdAt) -
        new Date(a.updatedAt || a.note_date || a.createdAt)
    );
    return filtered;
  }, [allNotes, selectedDate]);

  // Fetch notes for the current date range
  const fetchAllNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      console.log('Fetching notes for date range:', dateRange);
      const response = await listNotes({
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      // journalService.listNotes may return either an array or an object with `data`.
      // Normalize to an array, dedupe by id, and sort by date desc so latest appears first.
      const raw = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];
      const byId = new Map();
      for (const n of raw) {
        if (!n) continue;
        // prefer server-provided id; if none, fallback to updated timestamp+body hash to avoid accidental dupes
        const key =
          n.id ??
          `${n.updatedAt || n.updated_at || n.note_date || n.createdAt || n.created_at || ''}::${(n.body || '').slice(0, 40)}`;
        byId.set(key, n);
      }
      const normalized = Array.from(byId.values())
        .map((note) => ({
          // normalize common date fields for consistent parsing elsewhere
          id: note.id,
          title: note.title,
          body: note.body,
          note_date:
            note.noteDate ||
            note.note_date ||
            note.createdAt ||
            note.created_at ||
            note.updatedAt ||
            note.updated_at,
          createdAt: note.createdAt || note.created_at,
          updatedAt: note.updatedAt || note.updated_at,
          ...note,
        }))
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.note_date || b.createdAt) -
            new Date(a.updatedAt || a.note_date || a.createdAt)
        );

      setAllNotes(normalized);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Gagal memuat catatan',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setNotesLoading(false);
    }
  }, [dateRange, toast]);

  // Fetch weekly summary data
  const fetchWeeklySummaryData = useCallback(async () => {
    setWeeklyLoading(true);
    try {
      const response = await getWeeklySummary({
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      if (response.status === 'error') {
        throw new Error(response.message);
      }

      setWeeklyData({
        analysis: response?.analysis || null,
        dailySummaries: response?.dailySummaries || [],
        recommendations: response?.recommendations || null,
        status: response?.status || 'success',
        message: response?.message || null,
      });
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
      setWeeklyData({
        analysis: null,
        dailySummaries: [],
        recommendations: null,
        status: 'error',
        message: error.message || 'Gagal memuat data',
      });
      toast({
        title: 'Gagal memuat ringkasan mingguan',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setWeeklyLoading(false);
    }
  }, [dateRange, toast]);

  // Initial data fetch
  useEffect(() => {
    fetchWeeklySummaryData();
    fetchAllNotes();
  }, [fetchAllNotes, fetchWeeklySummaryData]);

  // Handle date selection
  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  // Navigation between weeks
  const goToPreviousWeek = useCallback(() => {
    const prevWeek = new Date(dateRange.start);
    prevWeek.setDate(prevWeek.getDate() - 7);
    const start = startOfWeek(prevWeek, { locale: id, weekStartsOn: 1 });
    const end = endOfWeek(prevWeek, { locale: id, weekStartsOn: 1 });
    setDateRange({ start, end });
  }, [dateRange.start]);

  const goToNextWeek = useCallback(() => {
    const nextWeek = new Date(dateRange.start);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const start = startOfWeek(nextWeek, { locale: id, weekStartsOn: 1 });
    const end = endOfWeek(nextWeek, { locale: id, weekStartsOn: 1 });
    setDateRange({ start, end });
  }, [dateRange.start]);

  // Trigger manual generation for the logged-in user
  const handleGenerateWeekly = useCallback(async () => {
    setIsGeneratingWeekly(true);
    try {
      const result = await generateWeeklyForCurrentUser({
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
      });
      if (result?._isError || result?.status === 'error') {
        throw new Error(result?.message || 'Gagal menghasilkan ringkasan');
      }
      toast({ title: 'Ringkasan mingguan berhasil dibuat', status: 'success', duration: 3000 });
      // If backend returned the week that was generated, ensure dashboard uses it
      if (result?.week?.start && result?.week?.end) {
        setDateRange({ start: new Date(result.week.start), end: new Date(result.week.end) });
      }
      // Refresh UI for that week
      await fetchWeeklySummaryData();
      await fetchAllNotes();
    } catch (error) {
      console.error('Error generating weekly for user:', error);
      toast({
        title: 'Gagal membuat ringkasan',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsGeneratingWeekly(false);
    }
  }, [fetchWeeklySummaryData, fetchAllNotes, toast, dateRange.start, dateRange.end]);

  const canEdit = useCallback((note) => {
    if (!note) return false;
    const now = new Date();
    const noteDateStr = note.updatedAt || note.note_date || note.createdAt;
    if (!noteDateStr) return false;
    const noteDate = new Date(noteDateStr);
    if (isNaN(noteDate.getTime())) return false;
    if (noteDate > now) return false;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfNote = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate());
    const diffDays = Math.floor((startOfToday - startOfNote) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }, []);

  const handleStartEdit = useCallback(
    (note) => {
      if (!canEdit(note)) return;
      setSelectedNote(note);
      setEditTitle(note.title || '');
      setEditBody(note.body || '');
      onEditOpen();
    },
    [canEdit, onEditOpen]
  );

  const handleSaveEdit = useCallback(async () => {
    if (!selectedNote) return;
    setIsSavingEdit(true);
    try {
      await updateNote(selectedNote.id, { title: editTitle, body: editBody });
      setAllNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id
            ? { ...n, title: editTitle, body: editBody, updatedAt: new Date().toISOString() }
            : n
        )
      );
      await fetchWeeklySummaryData();
      await fetchAllNotes();
      toast({ title: 'Catatan diperbarui', status: 'success', duration: 3000, isClosable: true });
      onEditClose();
    } catch (e) {
      toast({
        title: 'Gagal menyimpan',
        description: e.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSavingEdit(false);
    }
  }, [
    selectedNote,
    editTitle,
    editBody,
    toast,
    onEditClose,
    fetchWeeklySummaryData,
    fetchAllNotes,
  ]);

  const handleDeleteNote = async (note) => {
    if (!note) return;

    setIsDeleting(true);
    try {
      await deleteNote(note.id);

      setAllNotes((prevNotes) => prevNotes.filter((n) => n.id !== note.id));

      toast({
        title: 'Catatan berhasil dihapus',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Gagal menghapus catatan',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (weeklyLoading || notesLoading) {
    return (
      <Flex
        justify="center"
        align="center"
        minH="100vh"
        bgGradient="linear(to-br, #1a1a2e, #16213e, #0f3460, #533483)"
        flexDirection="column"
        gap={4}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Text fontSize="4xl">📔</Text>
        </motion.div>
        <Spinner size="xl" color="pink.300" thickness="3px" />
        <Text color="whiteAlpha.800" fontSize="lg" fontWeight="medium">
          Memuat refleksi harianmu...
        </Text>
        <Text color="whiteAlpha.600" fontSize="sm">
          Sebentar ya, kami sedang menyiapkan wawasanmu ✨
        </Text>
      </Flex>
    );
  }

  return (
    <Box
      h="100vh"
      overflow="hidden"
      bgGradient="linear(to-br, #1a1a2e, #16213e, #0f3460, #533483)"
      color="white"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgImage:
          'radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(167, 139, 250, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
      }}
    >
      <Container maxW="7xl" h="full" py={3} position="relative" zIndex={1}>
        <Stack spacing={3} h="full">
          {/* Header - Compact */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard p={3} backdropFilter="blur(20px)">
              <Flex justify="space-between" align="center" gap={3}>
                <HStack spacing={3}>
                  <Box>
                    <HStack spacing={2} mb={1}>
                      <Badge
                        colorScheme="purple"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        textTransform="none"
                        fontSize="xs"
                      >
                        🔒 Private
                      </Badge>
                      <Badge
                        colorScheme="pink"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        textTransform="none"
                        fontSize="xs"
                      >
                        Refleksi
                      </Badge>
                    </HStack>
                    <Heading
                      size="md"
                      bgGradient="linear(to-r, orange.200, pink.200)"
                      bgClip="text"
                    >
                      {greeting.greeting}
                    </Heading>
                    <Text color="whiteAlpha.600" fontSize="xs">
                      {format(selectedDate, 'EEEE, d MMM yyyy', { locale: id })}
                    </Text>
                  </Box>
                </HStack>
                <HStack spacing={2}>
                  <IconButton
                    icon={<RepeatIcon />}
                    onClick={() => {
                      fetchWeeklySummaryData();
                      fetchAllNotes();
                    }}
                    isLoading={weeklyLoading || notesLoading}
                    variant="ghost"
                    colorScheme="purple"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    size="sm"
                    aria-label="Refresh"
                  />
                  <Button
                    colorScheme="pink"
                    size="sm"
                    onClick={() => (window.location.href = '/')}
                    leftIcon={<AddIcon />}
                  >
                    Tulis
                  </Button>
                </HStack>
              </Flex>
            </GlassCard>
          </motion.div>

          {/* Sidebar Toggle Button (Mobile) */}
          {showSidebarToggle && (
            <Box mb={4}>
              <IconButton
                icon={<HamburgerIcon />}
                onClick={onSidebarToggle}
                variant="ghost"
                aria-label="Toggle Sidebar"
                size="lg"
                _hover={{ bg: 'whiteAlpha.200' }}
              />
            </Box>
          )}

          <Grid
            templateColumns={{ base: '1fr', xl: isSidebarOpen ? '320px 1fr' : '0 1fr' }}
            gap={3}
            flex="1"
            overflow="hidden"
          >
            {/* Left Side - Calendar & Notes */}
            <Box
              display={{ base: isSidebarOpen ? 'block' : 'none', xl: 'block' }}
              width={{ base: 'full', xl: isSidebarOpen ? '320px' : '0' }}
              transition="width 0.2s"
              overflow="hidden"
            >
              <Stack
                spacing={3}
                h="full"
                overflow="auto"
                pr={2}
                sx={{
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-track': { bg: 'whiteAlpha.100' },
                  '&::-webkit-scrollbar-thumb': { bg: 'whiteAlpha.400', borderRadius: 'full' },
                }}
              >
                {/* Calendar */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Box
                    bg="rgba(15, 23, 42, 0.75)"
                    borderRadius="xl"
                    p={3}
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    backdropFilter="blur(20px)"
                    _hover={{ borderColor: 'purple.300' }}
                    transition="all 0.3s"
                  >
                    <JournalCalendar
                      selectedDate={selectedDate}
                      onSelectDate={handleDateSelect}
                      notes={allNotes}
                    />
                    <Flex justify="space-between" mt={2} align="center" gap={1}>
                      <IconButton
                        icon={<ChevronLeftIcon />}
                        onClick={goToPreviousWeek}
                        size="xs"
                        variant="ghost"
                        colorScheme="purple"
                        aria-label="Previous week"
                      />
                      <Text fontSize="xs" fontWeight="medium" color="orange.200" textAlign="center">
                        {format(dateRange.start, 'd MMM', { locale: id })} -{' '}
                        {format(dateRange.end, 'd MMM', { locale: id })}
                      </Text>
                      <IconButton
                        icon={<ChevronRightIcon />}
                        onClick={goToNextWeek}
                        size="xs"
                        variant="ghost"
                        colorScheme="purple"
                        aria-label="Next week"
                      />
                    </Flex>
                  </Box>
                </motion.div>

                {/* Daily Notes */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Box
                    bg="rgba(15, 23, 42, 0.75)"
                    borderRadius="xl"
                    p={3}
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    backdropFilter="blur(20px)"
                    _hover={{ borderColor: 'pink.300' }}
                    transition="all 0.3s"
                    maxH="calc(100vh - 420px)"
                    overflow="auto"
                    sx={{
                      '&::-webkit-scrollbar': { width: '6px' },
                      '&::-webkit-scrollbar-track': { bg: 'whiteAlpha.100' },
                      '&::-webkit-scrollbar-thumb': { bg: 'whiteAlpha.400', borderRadius: 'full' },
                    }}
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <HStack>
                        <Heading size="sm">Catatan</Heading>
                        <Text fontSize="lg">📝</Text>
                      </HStack>
                    </Flex>

                    {notesForSelectedDate.length === 0 ? (
                      <Box textAlign="center" py={4} color="whiteAlpha.600">
                        <Text fontSize="2xl" mb={1}>
                          ✨
                        </Text>
                        <Text fontSize="sm">Belum ada catatan</Text>
                      </Box>
                    ) : (
                      <Stack spacing={2}>
                        {notesForSelectedDate.map((note, idx) => (
                          <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                          >
                            <Box
                              p={2}
                              bg="whiteAlpha.50"
                              borderRadius="lg"
                              border="1px solid"
                              borderColor="whiteAlpha.100"
                              _hover={{
                                bg: 'whiteAlpha.100',
                                borderColor: 'pink.300',
                              }}
                              transition="all 0.2s"
                            >
                              <Flex justify="space-between" align="start" gap={2}>
                                <Box flex="1" minW="0">
                                  <Flex align="center" mb={1}>
                                    <Text
                                      fontWeight="semibold"
                                      fontSize="xs"
                                      color="orange.200"
                                      noOfLines={1}
                                    >
                                      {note.title || 'Tanpa Judul'}
                                    </Text>
                                    <Text
                                      fontSize="xs"
                                      color="whiteAlpha.600"
                                      ml={2}
                                      flexShrink={0}
                                    >
                                      {format(
                                        new Date(
                                          note.createdAt || note.note_date || note.updatedAt
                                        ),
                                        'HH:mm'
                                      )}
                                    </Text>
                                  </Flex>
                                  <Text
                                    fontSize="xs"
                                    color="whiteAlpha.800"
                                    noOfLines={2}
                                    lineHeight="short"
                                  >
                                    {note.body}
                                  </Text>
                                </Box>
                                <HStack spacing={0.5}>
                                  <IconButton
                                    icon={<EditIcon />}
                                    size="xs"
                                    variant="ghost"
                                    aria-label="Edit"
                                    colorScheme="purple"
                                    isDisabled={!canEdit(note)}
                                    onClick={() => handleStartEdit(note)}
                                  />
                                  <IconButton
                                    icon={<DeleteIcon />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    aria-label="Hapus"
                                    onClick={() => handleDeleteNote(note)}
                                    isLoading={isDeleting}
                                  />
                                </HStack>
                              </Flex>
                            </Box>
                          </motion.div>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </motion.div>
              </Stack>
            </Box>

            {/* Right Side - Weekly Summary */}
            <Box
              overflow="auto"
              h="full"
              sx={{
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { bg: 'whiteAlpha.100' },
                '&::-webkit-scrollbar-thumb': { bg: 'whiteAlpha.400', borderRadius: 'full' },
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <Box
                  bg="rgba(15, 23, 42, 0.75)"
                  borderRadius="xl"
                  p={3}
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  backdropFilter="blur(20px)"
                  boxShadow="0 0 40px rgba(167, 139, 250, 0.1)"
                >
                  <Stack spacing={3}>
                    <Flex justify="space-between" align="center">
                      <HStack>
                        <Heading
                          size="sm"
                          bgGradient="linear(to-r, cyan.200, purple.200)"
                          bgClip="text"
                        >
                          Refleksi Mingguan
                        </Heading>
                        <Text fontSize="lg">🌟</Text>
                      </HStack>
                      <HStack spacing={2}>
                        <Text color="orange.200" fontWeight="medium" fontSize="xs">
                          {format(dateRange.start, 'd MMM', { locale: id })} -{' '}
                          {format(dateRange.end, 'd MMM', { locale: id })}
                        </Text>
                        <Button
                          size="xs"
                          colorScheme="cyan"
                          onClick={handleGenerateWeekly}
                          isLoading={isGeneratingWeekly}
                        >
                          Generate
                        </Button>
                      </HStack>
                    </Flex>

                    {weeklyLoading ? (
                      <Box textAlign="center" py={8}>
                        <Spinner size="lg" color="cyan.200" />
                        <Text mt={2} color="whiteAlpha.700">
                          Memuat data...
                        </Text>
                      </Box>
                    ) : weeklyData.status === 'error' ? (
                      <Box textAlign="center" py={8} color="red.300">
                        <Text>Gagal memuat data: {weeklyData.message}</Text>
                        <Button
                          mt={4}
                          size="sm"
                          onClick={fetchWeeklySummaryData}
                          leftIcon={<RepeatIcon />}
                        >
                          Coba Lagi
                        </Button>
                      </Box>
                    ) : weeklyData.analysis ? (
                      <Stack spacing={6}>
                        {/* Mood Summary */}
                        <ScaleFade in={true} initialScale={0.9}>
                          <Box>
                            <Flex direction={{ base: 'column', md: 'row' }} gap={3} mb={3}>
                              {/* Mood Score */}
                              <Box
                                flex="1"
                                bg="whiteAlpha.100"
                                p={3}
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="whiteAlpha.200"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexDirection="column"
                                gap={2}
                                _hover={{
                                  borderColor: 'purple.300',
                                }}
                                transition="all 0.3s"
                              >
                                <Flex align="center" gap={1}>
                                  <Heading size="xs">Skor</Heading>
                                  <MoodEmoji mood={weeklyData.analysis.dominantMood} size="20px" />
                                </Flex>
                                <CircularProgress
                                  value={weeklyData.analysis.moodScore || 0}
                                  size={100}
                                  color="pink.400"
                                />
                              </Box>

                              {/* Mood Details */}
                              <Stack flex="2" spacing={2}>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                  <Box
                                    bg="whiteAlpha.100"
                                    p={3}
                                    borderRadius="lg"
                                    border="1px solid"
                                    borderColor="whiteAlpha.200"
                                    _hover={{
                                      borderColor: 'cyan.300',
                                    }}
                                    transition="all 0.3s"
                                  >
                                    <Text fontSize="xs" color="whiteAlpha.600" mb={1}>
                                      🎭 Mood Dominan
                                    </Text>
                                    <Heading size="xs" color="cyan.200">
                                      {weeklyData.analysis.dominantMood || 'Belum ada data'}
                                    </Heading>
                                  </Box>
                                  <Box
                                    bg="whiteAlpha.100"
                                    p={3}
                                    borderRadius="lg"
                                    border="1px solid"
                                    borderColor="whiteAlpha.200"
                                    _hover={{
                                      borderColor: 'orange.300',
                                    }}
                                    transition="all 0.3s"
                                  >
                                    <Text fontSize="xs" color="whiteAlpha.600" mb={1}>
                                      ✨ Afirmasi
                                    </Text>
                                    <Text
                                      fontSize="xs"
                                      color="orange.200"
                                      fontWeight="500"
                                      lineHeight="short"
                                      noOfLines={2}
                                    >
                                      {weeklyData.analysis.affirmation || 'Belum ada'}
                                    </Text>
                                  </Box>
                                </SimpleGrid>
                              </Stack>
                            </Flex>
                          </Box>
                        </ScaleFade>

                        {/* Summary */}
                        {weeklyData.analysis.summary && (
                          <SlideFade in={true} offsetY={20}>
                            <Box>
                              <Flex align="center" mb={1}>
                                <Heading size="xs" mr={2} color="purple.200">
                                  Ringkasan
                                </Heading>
                                <Text fontSize="md">📝</Text>
                              </Flex>
                              <Box
                                bg="whiteAlpha.100"
                                p={3}
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="whiteAlpha.200"
                                _hover={{
                                  borderColor: 'purple.300',
                                }}
                                transition="all 0.3s"
                              >
                                <Text lineHeight="short" color="whiteAlpha.900" fontSize="xs">
                                  {weeklyData.analysis.summary}
                                </Text>
                              </Box>
                            </Box>
                          </SlideFade>
                        )}

                        {/* Highlights & Advice */}
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                          <Box>
                            <Flex align="center" mb={1}>
                              <Heading size="xs" mr={2} color="orange.200">
                                Sorotan
                              </Heading>
                              <Text fontSize="md">🌟</Text>
                            </Flex>
                            <Box
                              bg="whiteAlpha.100"
                              p={3}
                              borderRadius="lg"
                              border="1px solid"
                              borderColor="whiteAlpha.200"
                              _hover={{
                                borderColor: 'orange.300',
                              }}
                              transition="all 0.3s"
                            >
                              <Stack spacing={1.5}>
                                {(weeklyData.analysis.highlights || ['Belum ada sorotan']).map(
                                  (item, idx) => (
                                    <Text
                                      key={idx}
                                      display="flex"
                                      alignItems="flex-start"
                                      color="whiteAlpha.900"
                                      lineHeight="short"
                                      fontSize="xs"
                                    >
                                      <Text as="span" mr={1} color="orange.300">
                                        ✦
                                      </Text>
                                      {item}
                                    </Text>
                                  )
                                )}
                              </Stack>
                            </Box>
                          </Box>

                          <Box>
                            <Flex align="center" mb={1}>
                              <Heading size="xs" mr={2} color="cyan.200">
                                Saran
                              </Heading>
                              <Text fontSize="md">💡</Text>
                            </Flex>
                            <Box
                              bg="whiteAlpha.100"
                              p={3}
                              borderRadius="lg"
                              border="1px solid"
                              borderColor="whiteAlpha.200"
                              _hover={{
                                borderColor: 'cyan.300',
                              }}
                              transition="all 0.3s"
                            >
                              <Stack spacing={1.5}>
                                {(weeklyData.analysis.advice || ['Belum ada saran']).map(
                                  (item, idx) => (
                                    <Text
                                      key={idx}
                                      display="flex"
                                      alignItems="flex-start"
                                      color="whiteAlpha.900"
                                      lineHeight="short"
                                      fontSize="xs"
                                    >
                                      <Text as="span" mr={1} color="cyan.300">
                                        ⚡
                                      </Text>
                                      {item}
                                    </Text>
                                  )
                                )}
                              </Stack>
                            </Box>
                          </Box>
                        </SimpleGrid>

                        {weeklyData.recommendations?.items?.length ? (
                          <Box>
                            <Flex align="center" mb={2}>
                              <Heading size="xs" mr={2} color="pink.200">
                                {weeklyData.recommendations.headline || 'Rekomendasi Film'}
                              </Heading>
                              <Text fontSize="md">🎬</Text>
                            </Flex>
                            <Text color="whiteAlpha.700" mb={2} fontSize="xs">
                              {weeklyData.recommendations.description ||
                                'Film pilihan untuk mood minggu ini.'}
                            </Text>
                            {/* Rekomendasi film tematik berbasis mood mingguan */}
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2}>
                              {weeklyData.recommendations.items.map((movie, idx) => (
                                <MoodMovieCard
                                  key={`${movie.title}-${idx}`}
                                  movie={movie}
                                  index={idx}
                                />
                              ))}
                            </SimpleGrid>
                          </Box>
                        ) : null}
                      </Stack>
                    ) : (
                      <Box textAlign="center" py={8} color="whiteAlpha.600">
                        <Text fontSize="3xl" mb={2}>
                          📊
                        </Text>
                        <Text>Belum ada data refleksi untuk minggu ini.</Text>
                        <Text mt={2} fontSize="sm">
                          Tulis catatan harianmu untuk melihat wawasan mingguan.
                        </Text>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </motion.div>
            </Box>
          </Grid>
        </Stack>
      </Container>

      <Modal isOpen={isEditOpen} onClose={onEditClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="rgba(15, 23, 42, 0.98)" border="1px solid" borderColor="whiteAlpha.200">
          <ModalHeader>Edit Catatan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={3}>
              <Input
                placeholder="Judul (opsional)"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <Textarea
                placeholder="Tulis isi catatan"
                rows={8}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
              />
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Batal
            </Button>
            <Button
              colorScheme="pink"
              onClick={handleSaveEdit}
              isLoading={isSavingEdit}
              isDisabled={!editBody?.trim()?.length}
            >
              Simpan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
