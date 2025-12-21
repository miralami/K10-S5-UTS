import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { format, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
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
  LinkBox,
  LinkOverlay,
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
  VStack,
  Text,
  useToast,
  SlideFade,
  ScaleFade,
  useDisclosure,
  useBreakpointValue,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
} from '@chakra-ui/react';
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

// --- THEME CONFIGURATION (Warm Organic & Minimal Sans - matching Home.jsx) ---
const THEME = {
  colors: {
    bg: '#FDFCF8', // Warm off-white
    cardBg: '#FFFFFF',
    textPrimary: '#2D3748',
    textSecondary: '#718096',
    textMuted: '#A0AEC0',
    accent: '#D6BCFA', // Soft Purple
    accentHover: '#B794F4',
    warmHighlight: '#F6E05E', // Soft Yellow
    success: '#68D391',
    border: '#E2E8F0',
    borderLight: '#EDF2F7',
  },
  fonts: {
    sans: '"Inter", sans-serif',
    serif: '"Merriweather", serif',
  },
};

// Helper untuk greeting dinamis
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 10) {
    return { greeting: 'Good Morning', message: 'Start your day with reflection' };
  } else if (hour >= 10 && hour < 15) {
    return { greeting: 'Good Afternoon', message: "Check your week's journey" };
  } else if (hour >= 15 && hour < 18) {
    return { greeting: 'Good Evening', message: 'Time for a moment of clarity' };
  } else if (hour >= 18 && hour < 22) {
    return { greeting: 'Good Night', message: "Review today's thoughts" };
  } else {
    return { greeting: 'Still awake?', message: "Don't forget to rest" };
  }
};

// Framer Motion wrapper
const MotionBox = motion(Box);

// Warm Card Component - Following AI guide principles
const WarmCard = ({ children, hover = true, ...props }) => (
  <MotionBox
    bg="white"
    borderRadius="2xl"
    p={6}
    border="1px solid"
    borderColor="gray.200"
    boxShadow="0 4px 20px rgba(0, 0, 0, 0.06)"
    transition="all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)"
    {...(hover && {
      _hover: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
        transform: 'translateY(-2px)',
        borderColor: 'gray.300',
      },
    })}
    {...props}
  >
    {children}
  </MotionBox>
);

WarmCard.propTypes = {
  children: PropTypes.node.isRequired,
  hover: PropTypes.bool,
};

// lightweight SVG fallback used when poster fails to load or is aborted
const POSTER_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 900'>" +
      "<rect width='100%' height='100%' fill='%23F7FAFC'/>" +
      "<text x='50%' y='50%' fill='%23A0AEC0' font-size='22' text-anchor='middle' dominant-baseline='middle'>No Image</text>" +
      '</svg>'
  );

function getLastfmHref(track) {
  const explicitUrl = track?.lastfmUrl;
  if (typeof explicitUrl === 'string' && explicitUrl.trim()) return explicitUrl;
  const artist = track?.artist ? String(track.artist).trim() : '';
  const title = track?.title ? String(track.title).trim() : '';
  if (artist && title) {
    return `https://www.last.fm/music/${encodeURIComponent(artist)}/_/${encodeURIComponent(title)}`;
  }
  if (artist) {
    return `https://www.last.fm/music/${encodeURIComponent(artist)}`;
  }
  return '';
}

function MoodMusicCard({ track }) {
  const lastfmHref = getLastfmHref(track);
  const hasLink = Boolean(lastfmHref);
  return (
    <LinkBox
      as={Box}
      bg="white"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.100"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      h="100%"
      cursor={hasLink ? 'pointer' : 'default'}
      _hover={{
        borderColor: 'purple.200',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        transform: 'translateY(-2px)',
      }}
      transition="all 0.3s"
    >
      {hasLink ? (
        <LinkOverlay href={lastfmHref} isExternal>
          {track.coverUrl ? (
            <Image
              src={track.coverUrl}
              alt={`${track.title} - ${track.artist}`}
              objectFit="cover"
              w="100%"
              h="120px"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              fallbackSrc={POSTER_FALLBACK}
            />
          ) : (
            <Flex align="center" justify="center" w="100%" h="120px" bg="gray.50">
              <Text fontSize="2xl">🎵</Text>
            </Flex>
          )}

          <Stack spacing={1.5} p={3} flex="1">
            <Box>
              <Heading size="xs" color={THEME.colors.textPrimary} noOfLines={1}>
                {track.title}
              </Heading>
              <Text fontSize="xs" color={THEME.colors.textSecondary} noOfLines={1}>
                {track.artist}
              </Text>
            </Box>

            {track.reason ? (
              <Text
                fontSize="xs"
                color={THEME.colors.textSecondary}
                lineHeight="short"
                noOfLines={2}
              >
                {track.reason}
              </Text>
            ) : null}

            {Array.isArray(track.tags) && track.tags.length > 0 ? (
              <Wrap spacing={1}>
                {track.tags.slice(0, 4).map((tag) => (
                  <WrapItem key={tag}>
                    <Tag
                      size="sm"
                      borderRadius="full"
                      variant="subtle"
                      colorScheme="teal"
                      bg="teal.50"
                    >
                      <TagLabel fontSize="2xs">{tag}</TagLabel>
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            ) : null}
          </Stack>
        </LinkOverlay>
      ) : (
        <>
          {track.coverUrl ? (
            <Image
              src={track.coverUrl}
              alt={`${track.title} - ${track.artist}`}
              objectFit="cover"
              w="100%"
              h="120px"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              fallbackSrc={POSTER_FALLBACK}
            />
          ) : (
            <Flex align="center" justify="center" w="100%" h="120px" bg="gray.50">
              <Text fontSize="2xl">🎵</Text>
            </Flex>
          )}

          <Stack spacing={1.5} p={3} flex="1">
            <Box>
              <Heading size="xs" color={THEME.colors.textPrimary} noOfLines={1}>
                {track.title}
              </Heading>
              <Text fontSize="xs" color={THEME.colors.textSecondary} noOfLines={1}>
                {track.artist}
              </Text>
            </Box>

            {track.reason ? (
              <Text
                fontSize="xs"
                color={THEME.colors.textSecondary}
                lineHeight="short"
                noOfLines={2}
              >
                {track.reason}
              </Text>
            ) : null}

            {Array.isArray(track.tags) && track.tags.length > 0 ? (
              <Wrap spacing={1}>
                {track.tags.slice(0, 4).map((tag) => (
                  <WrapItem key={tag}>
                    <Tag
                      size="sm"
                      borderRadius="full"
                      variant="subtle"
                      colorScheme="teal"
                      bg="teal.50"
                    >
                      <TagLabel fontSize="2xs">{tag}</TagLabel>
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            ) : null}
          </Stack>
        </>
      )}
    </LinkBox>
  );
}

MoodMusicCard.propTypes = {
  track: PropTypes.shape({
    title: PropTypes.string,
    artist: PropTypes.string,
    reason: PropTypes.string,
    coverUrl: PropTypes.string,
    lastfmUrl: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

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
      bg="white"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.100"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      h="100%"
      _hover={{
        borderColor: 'purple.200',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        transform: 'translateY(-2px)',
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
        <Flex align="center" justify="center" w="100%" h="120px" bg="gray.50">
          <Text fontSize="2xl">🎬</Text>
        </Flex>
      )}
      <Stack spacing={1.5} p={3} flex="1">
        <Box>
          <Heading size="xs" color={THEME.colors.textPrimary} noOfLines={1}>
            {movie.title}
          </Heading>
          <HStack spacing={1} mt={1}>
            {movie.year && (
              <Tag
                size="sm"
                borderRadius="full"
                variant="subtle"
                colorScheme="purple"
                bg="purple.50"
              >
                <TagLabel fontSize="2xs">{movie.year}</TagLabel>
              </Tag>
            )}
            {movie.imdbId && (
              <Tag size="sm" borderRadius="full" variant="outline" colorScheme="orange">
                <TagLabel fontSize="2xs">IMDb</TagLabel>
              </Tag>
            )}
          </HStack>
        </Box>
        <Text fontSize="xs" color={THEME.colors.textSecondary} lineHeight="short" noOfLines={2}>
          {movie.reason}
        </Text>
        {Array.isArray(movie.genres) && movie.genres.length > 0 && (
          <Wrap spacing={1}>
            {movie.genres.slice(0, 3).map((genre) => (
              <WrapItem key={genre}>
                <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="teal" bg="teal.50">
                  <TagLabel fontSize="2xs">{genre}</TagLabel>
                </Tag>
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
    musicRecommendations: null,
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
        musicRecommendations: response?.musicRecommendations || null,
        status: response?.status || 'success',
        message: response?.message || null,
      });
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
      setWeeklyData({
        analysis: null,
        dailySummaries: [],
        recommendations: null,
        musicRecommendations: null,
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
    const quotes = [
      'Reflection is the bridge between experience and wisdom ✨',
      'Every note is a step towards self-understanding 🌟',
      'Your words today are a gift to your future self 💫',
      'In the stillness of reflection, we find strength 🌙',
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    return (
      <Flex
        justify="center"
        align="center"
        minH="100vh"
        bg={THEME.colors.bg}
        flexDirection="column"
        gap={6}
        position="relative"
        overflow="hidden"
      >
        {/* Floating Background Elements - Subtle & Organic */}
        <Box
          position="absolute"
          top="-10%"
          right="-5%"
          w="500px"
          h="500px"
          bg="radial-gradient(circle, rgba(214, 188, 250, 0.15) 0%, rgba(255,255,255,0) 70%)"
          borderRadius="full"
          filter="blur(60px)"
          zIndex={0}
        />
        <Box
          position="absolute"
          bottom="10%"
          left="-10%"
          w="400px"
          h="400px"
          bg="radial-gradient(circle, rgba(246, 224, 94, 0.1) 0%, rgba(255,255,255,0) 70%)"
          borderRadius="full"
          filter="blur(50px)"
          zIndex={0}
        />

        {/* Breathing Circle Animation */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Box
            w="150px"
            h="150px"
            borderRadius="full"
            bg="linear-gradient(135deg, rgba(214, 188, 250, 0.4) 0%, rgba(183, 148, 244, 0.3) 100%)"
            filter="blur(30px)"
          />
        </motion.div>

        {/* Icon with stagger animation */}
        <motion.div
          style={{ position: 'absolute' }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
          }}
        >
          <Text fontSize="5xl">📔</Text>
        </motion.div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Stack spacing={3} align="center" textAlign="center" maxW="md" px={6}>
            <Text color={THEME.colors.textPrimary} fontSize="xl" fontWeight="500">
              Loading your reflections
            </Text>
            <Text color={THEME.colors.textSecondary} fontSize="sm" fontStyle="italic">
              {randomQuote}
            </Text>
          </Stack>
        </motion.div>
      </Flex>
    );
  }

  return (
    <Box
      minH="100vh"
      bg={THEME.colors.bg}
      color={THEME.colors.textPrimary}
      fontFamily={THEME.fonts.sans}
      position="relative"
      overflowX="hidden"
    >
      {/* Floating Background Elements - Subtle & Organic */}
      <Box
        position="absolute"
        top="-10%"
        right="-5%"
        w="500px"
        h="500px"
        bg="radial-gradient(circle, rgba(214, 188, 250, 0.12) 0%, rgba(255,255,255,0) 70%)"
        borderRadius="full"
        filter="blur(60px)"
        zIndex={0}
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="10%"
        left="-10%"
        w="400px"
        h="400px"
        bg="radial-gradient(circle, rgba(246, 224, 94, 0.08) 0%, rgba(255,255,255,0) 70%)"
        borderRadius="full"
        filter="blur(50px)"
        zIndex={0}
        pointerEvents="none"
      />

      <Container maxW="7xl" pt={{ base: 6, md: 10 }} pb={10} position="relative" zIndex={1}>
        <Stack spacing={8}>
          {/* Header Section - Minimal & Welcoming */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
          >
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={4}>
              <Stack spacing={1}>
                <Text
                  fontSize="sm"
                  color={THEME.colors.textSecondary}
                  letterSpacing="wide"
                  textTransform="uppercase"
                >
                  {format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: id })}
                </Text>
                <Heading
                  fontSize={{ base: '3xl', md: '4xl' }}
                  fontWeight="300"
                  fontFamily={THEME.fonts.serif}
                  letterSpacing="-0.02em"
                  color={THEME.colors.textPrimary}
                >
                  {greeting.greeting}
                </Heading>
                <Text fontSize="md" color={THEME.colors.textSecondary} maxW="xl" mt={1}>
                  {greeting.message}
                </Text>
              </Stack>
              <HStack spacing={3}>
                <IconButton
                  icon={<RepeatIcon />}
                  onClick={() => {
                    fetchWeeklySummaryData();
                    fetchAllNotes();
                  }}
                  isLoading={weeklyLoading || notesLoading}
                  variant="ghost"
                  size="md"
                  borderRadius="full"
                  color={THEME.colors.textSecondary}
                  _hover={{ bg: 'gray.100' }}
                  aria-label="Refresh"
                />
                <Button
                  size="md"
                  onClick={() => (window.location.href = '/')}
                  leftIcon={<AddIcon />}
                  bg="gray.900"
                  color="white"
                  borderRadius="full"
                  px={6}
                  fontWeight="500"
                  _hover={{ bg: 'gray.700', transform: 'translateY(-2px)' }}
                  _active={{ transform: 'scale(0.98)' }}
                  transition="all 0.2s"
                  boxShadow="lg"
                >
                  New Entry
                </Button>
              </HStack>
            </Flex>
          </MotionBox>

          {/* Sidebar Toggle Button (Mobile) */}
          {showSidebarToggle && (
            <Box>
              <IconButton
                icon={<HamburgerIcon />}
                onClick={onSidebarToggle}
                variant="ghost"
                aria-label="Toggle Sidebar"
                size="lg"
                borderRadius="full"
                _hover={{ bg: 'gray.100' }}
              />
            </Box>
          )}

          <Grid templateColumns={{ base: '1fr', xl: isSidebarOpen ? '340px 1fr' : '1fr' }} gap={8}>
            {/* Left Side - Calendar & Notes */}
            <Box
              display={{
                base: isSidebarOpen ? 'block' : 'none',
                xl: isSidebarOpen ? 'block' : 'none',
              }}
            >
              <Stack spacing={6}>
                {/* Calendar Card */}
                <MotionBox
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <WarmCard p={5}>
                    <JournalCalendar
                      selectedDate={selectedDate}
                      onSelectDate={handleDateSelect}
                      notes={allNotes}
                    />
                    <Flex justify="space-between" mt={4} align="center" gap={2}>
                      <IconButton
                        icon={<ChevronLeftIcon />}
                        onClick={goToPreviousWeek}
                        size="sm"
                        variant="solid"
                        bg="gray.100"
                        color="gray.600"
                        borderRadius="full"
                        aria-label="Previous week"
                        _hover={{ bg: 'purple.100', color: 'purple.600' }}
                      />
                      <Tag
                        size="md"
                        borderRadius="full"
                        variant="subtle"
                        colorScheme="purple"
                        bg="purple.50"
                        px={4}
                      >
                        <TagLabel fontWeight="500" color="purple.700">
                          {format(dateRange.start, 'd MMM', { locale: id })} -{' '}
                          {format(dateRange.end, 'd MMM', { locale: id })}
                        </TagLabel>
                      </Tag>
                      <IconButton
                        icon={<ChevronRightIcon />}
                        onClick={goToNextWeek}
                        size="sm"
                        variant="solid"
                        bg="gray.100"
                        color="gray.600"
                        borderRadius="full"
                        aria-label="Next week"
                        _hover={{ bg: 'purple.100', color: 'purple.600' }}
                      />
                    </Flex>
                  </WarmCard>
                </MotionBox>

                {/* Daily Notes Card */}
                <MotionBox
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <WarmCard
                    p={5}
                    maxH="calc(100vh - 500px)"
                    overflow="auto"
                    sx={{
                      '&::-webkit-scrollbar': { width: '4px' },
                      '&::-webkit-scrollbar-track': { bg: 'transparent' },
                      '&::-webkit-scrollbar-thumb': { bg: 'gray.200', borderRadius: 'full' },
                    }}
                  >
                    <Flex justify="space-between" align="center" mb={4}>
                      <HStack>
                        <Heading size="sm" color={THEME.colors.textPrimary}>
                          Notes
                        </Heading>
                        <Text fontSize="lg">📝</Text>
                      </HStack>
                    </Flex>

                    {notesForSelectedDate.length === 0 ? (
                      <Box textAlign="center" py={8}>
                        <Text fontSize="3xl" mb={2}>
                          ✨
                        </Text>
                        <Text fontSize="sm" color={THEME.colors.textSecondary}>
                          No notes for this day
                        </Text>
                        <Text fontSize="xs" color={THEME.colors.textMuted} mt={1}>
                          Start writing to capture your thoughts
                        </Text>
                      </Box>
                    ) : (
                      <Stack spacing={3}>
                        {notesForSelectedDate.map((note, idx) => (
                          <MotionBox
                            key={note.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                          >
                            <Box
                              p={4}
                              bg="white"
                              borderRadius="xl"
                              border="1px solid"
                              borderColor="gray.200"
                              boxShadow="0 1px 3px rgba(0,0,0,0.04)"
                              _hover={{
                                borderColor: 'purple.300',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              }}
                              transition="all 0.2s"
                            >
                              <VStack spacing={3} align="stretch">
                                {note.imageUrl && (
                                  <Box
                                    borderRadius="lg"
                                    overflow="hidden"
                                    maxH="200px"
                                    position="relative"
                                  >
                                    <Image
                                      src={note.imageUrl}
                                      alt={note.title || 'Journal image'}
                                      objectFit="cover"
                                      w="100%"
                                      h="100%"
                                      fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f7fafc' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23a0aec0' font-size='16'%3EImage%3C/text%3E%3C/svg%3E"
                                    />
                                  </Box>
                                )}
                                <Flex justify="space-between" align="start" gap={3}>
                                  <Box flex="1" minW="0">
                                    <Flex align="center" mb={2}>
                                      <Text
                                        fontWeight="600"
                                        fontSize="sm"
                                        color={THEME.colors.textPrimary}
                                        noOfLines={1}
                                      >
                                        {note.title || 'Untitled'}
                                      </Text>
                                      <Text
                                        fontSize="xs"
                                        color={THEME.colors.textMuted}
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
                                      fontSize="sm"
                                      color={THEME.colors.textSecondary}
                                      noOfLines={2}
                                      lineHeight="tall"
                                    >
                                      {note.body}
                                    </Text>
                                    {(note.gratitude1 || note.gratitude2 || note.gratitude3) && (
                                      <HStack mt={2} spacing={1}>
                                        <Text fontSize="xs" color="purple.500">✨</Text>
                                        <Text fontSize="xs" color="purple.600" fontWeight="medium">
                                          {[note.gratitude1, note.gratitude2, note.gratitude3].filter(Boolean).length} gratitude{[note.gratitude1, note.gratitude2, note.gratitude3].filter(Boolean).length > 1 ? 's' : ''}
                                        </Text>
                                      </HStack>
                                    )}
                                  </Box>
                                  <HStack spacing={1}>
                                    <IconButton
                                      icon={<EditIcon />}
                                      size="sm"
                                      variant="solid"
                                      aria-label="Edit"
                                      borderRadius="full"
                                      isDisabled={!canEdit(note)}
                                      onClick={() => handleStartEdit(note)}
                                      bg="gray.100"
                                      color="gray.500"
                                      _hover={{ bg: 'purple.100', color: 'purple.600' }}
                                    />
                                    <IconButton
                                      icon={<DeleteIcon />}
                                      size="sm"
                                      variant="solid"
                                      aria-label="Delete"
                                      borderRadius="full"
                                      onClick={() => handleDeleteNote(note)}
                                      isLoading={isDeleting}
                                      bg="gray.100"
                                      color="gray.500"
                                      _hover={{ bg: 'red.100', color: 'red.500' }}
                                    />
                                  </HStack>
                                </Flex>
                              </VStack>
                            </Box>
                          </MotionBox>
                        ))}
                      </Stack>
                    )}
                  </WarmCard>
                </MotionBox>
              </Stack>
            </Box>

            {/* Right Side - Weekly Summary */}
            <Box>
              <MotionBox
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <WarmCard p={{ base: 5, md: 8 }}>
                  <Stack spacing={6}>
                    <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                      <HStack>
                        <Heading
                          size="md"
                          fontWeight="400"
                          fontFamily={THEME.fonts.serif}
                          color={THEME.colors.textPrimary}
                        >
                          Weekly Reflection
                        </Heading>
                        <Text fontSize="xl">🌟</Text>
                      </HStack>
                      <HStack spacing={3}>
                        <Tag
                          size="md"
                          borderRadius="full"
                          variant="subtle"
                          colorScheme="orange"
                          bg="orange.50"
                          px={4}
                        >
                          <TagLabel fontWeight="500" color="orange.700">
                            {format(dateRange.start, 'd MMM', { locale: id })} -{' '}
                            {format(dateRange.end, 'd MMM', { locale: id })}
                          </TagLabel>
                        </Tag>
                        <Button
                          size="sm"
                          onClick={handleGenerateWeekly}
                          isLoading={isGeneratingWeekly}
                          bg="purple.500"
                          color="white"
                          borderRadius="full"
                          _hover={{ bg: 'purple.600', transform: 'translateY(-1px)' }}
                          _active={{ transform: 'scale(0.98)' }}
                        >
                          Generate
                        </Button>
                      </HStack>
                    </Flex>

                    {weeklyLoading ? (
                      <Box textAlign="center" py={12}>
                        <Spinner size="lg" color="purple.400" thickness="3px" />
                        <Text mt={3} color={THEME.colors.textSecondary}>
                          Loading data...
                        </Text>
                      </Box>
                    ) : weeklyData.status === 'error' ? (
                      <Box textAlign="center" py={12}>
                        <Text color="red.500" mb={4}>
                          Failed to load: {weeklyData.message}
                        </Text>
                        <Button
                          size="sm"
                          onClick={fetchWeeklySummaryData}
                          leftIcon={<RepeatIcon />}
                          variant="outline"
                          borderRadius="full"
                        >
                          Try Again
                        </Button>
                      </Box>
                    ) : weeklyData.analysis ? (
                      <Stack spacing={8}>
                        {/* Mood Summary */}
                        <ScaleFade in={true} initialScale={0.95}>
                          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                            {/* Mood Score */}
                            <Box
                              flex="1"
                              bg="purple.50"
                              p={6}
                              borderRadius="2xl"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              flexDirection="column"
                              gap={3}
                            >
                              <Flex align="center" gap={2}>
                                <Heading size="sm" color="purple.700">
                                  Score
                                </Heading>
                                <MoodEmoji mood={weeklyData.analysis.dominantMood} size="24px" />
                              </Flex>
                              <CircularProgress
                                value={weeklyData.analysis.moodScore || 0}
                                size={100}
                                color="purple.500"
                              />
                            </Box>

                            {/* Mood Details */}
                            <Stack flex="2" spacing={3}>
                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                                <Box bg="teal.50" p={5} borderRadius="xl">
                                  <Text
                                    fontSize="xs"
                                    color="teal.600"
                                    fontWeight="600"
                                    mb={2}
                                    textTransform="uppercase"
                                    letterSpacing="wide"
                                  >
                                    🎭 Dominant Mood
                                  </Text>
                                  <Heading size="sm" color="teal.800">
                                    {weeklyData.analysis.dominantMood || 'No data yet'}
                                  </Heading>
                                </Box>
                                <Box bg="orange.50" p={5} borderRadius="xl">
                                  <Text
                                    fontSize="xs"
                                    color="orange.600"
                                    fontWeight="600"
                                    mb={2}
                                    textTransform="uppercase"
                                    letterSpacing="wide"
                                  >
                                    ✨ Affirmation
                                  </Text>
                                  <Text
                                    fontSize="sm"
                                    color="orange.800"
                                    fontWeight="500"
                                    lineHeight="tall"
                                    noOfLines={3}
                                  >
                                    {weeklyData.analysis.affirmation || 'None yet'}
                                  </Text>
                                </Box>
                              </SimpleGrid>
                            </Stack>
                          </Flex>
                        </ScaleFade>

                        {/* Summary */}
                        {weeklyData.analysis.summary && (
                          <SlideFade in={true} offsetY={20}>
                            <Box>
                              <Flex align="center" mb={3}>
                                <Heading
                                  size="sm"
                                  mr={2}
                                  color={THEME.colors.textPrimary}
                                  fontWeight="500"
                                >
                                  Summary
                                </Heading>
                                <Text fontSize="lg">📝</Text>
                              </Flex>
                              <Box bg="gray.50" p={5} borderRadius="xl">
                                <Text
                                  lineHeight="tall"
                                  color={THEME.colors.textSecondary}
                                  fontSize="sm"
                                >
                                  {weeklyData.analysis.summary}
                                </Text>
                              </Box>
                            </Box>
                          </SlideFade>
                        )}

                        {/* Highlights & Advice */}
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <Box>
                            <Flex align="center" mb={3}>
                              <Heading
                                size="sm"
                                mr={2}
                                color={THEME.colors.textPrimary}
                                fontWeight="500"
                              >
                                Highlights
                              </Heading>
                              <Text fontSize="lg">🌟</Text>
                            </Flex>
                            <Box bg="yellow.50" p={5} borderRadius="xl">
                              <Stack spacing={2}>
                                {(weeklyData.analysis.highlights || ['No highlights yet']).map(
                                  (item, idx) => (
                                    <Text
                                      key={idx}
                                      display="flex"
                                      alignItems="flex-start"
                                      color="yellow.800"
                                      lineHeight="tall"
                                      fontSize="sm"
                                    >
                                      <Text as="span" mr={2} color="yellow.600">
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
                            <Flex align="center" mb={3}>
                              <Heading
                                size="sm"
                                mr={2}
                                color={THEME.colors.textPrimary}
                                fontWeight="500"
                              >
                                Suggestions
                              </Heading>
                              <Text fontSize="lg">💡</Text>
                            </Flex>
                            <Box bg="blue.50" p={5} borderRadius="xl">
                              <Stack spacing={2}>
                                {(weeklyData.analysis.advice || ['No suggestions yet']).map(
                                  (item, idx) => (
                                    <Text
                                      key={idx}
                                      display="flex"
                                      alignItems="flex-start"
                                      color="blue.800"
                                      lineHeight="tall"
                                      fontSize="sm"
                                    >
                                      <Text as="span" mr={2} color="blue.500">
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

                        {/* Movie Recommendations */}
                        {weeklyData.recommendations?.items?.length ? (
                          <Box>
                            <Flex align="center" mb={3}>
                              <Heading
                                size="sm"
                                mr={2}
                                color={THEME.colors.textPrimary}
                                fontWeight="500"
                              >
                                {weeklyData.recommendations.headline || 'Movie Recommendations'}
                              </Heading>
                              <Text fontSize="lg">🎬</Text>
                            </Flex>
                            <Text color={THEME.colors.textSecondary} mb={4} fontSize="sm">
                              {weeklyData.recommendations.description ||
                                'Films curated for your weekly mood.'}
                            </Text>
                            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                              {weeklyData.recommendations.items.map((movie, idx) => (
                                <MoodMovieCard key={`${movie.title}-${idx}`} movie={movie} />
                              ))}
                            </SimpleGrid>
                          </Box>
                        ) : null}

                        {weeklyData.musicRecommendations?.items?.length ? (
                          <Box mt={8}>
                            <Flex align="center" mb={3}>
                              <Heading
                                size="sm"
                                mr={2}
                                color={THEME.colors.textPrimary}
                                fontWeight="500"
                              >
                                {weeklyData.musicRecommendations.headline || 'Music Recommendations'}
                              </Heading>
                              <Text fontSize="lg">🎵</Text>
                            </Flex>
                            <Text color={THEME.colors.textSecondary} mb={4} fontSize="sm">
                              {weeklyData.musicRecommendations.description ||
                                'Tracks curated for your weekly mood.'}
                            </Text>
                            <Box>
                              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                                {weeklyData.musicRecommendations.items.slice(0, 3).map((track, idx) => (
                                  <MoodMusicCard key={track.id || idx} track={track} />
                                ))}
                              </SimpleGrid>
                            </Box>
                          </Box>
                        ) : null}
                      </Stack>
                    ) : (
                      <Box textAlign="center" py={12}>
                        <Text fontSize="4xl" mb={3}>
                          📊
                        </Text>
                        <Text color={THEME.colors.textSecondary} fontSize="md">
                          No reflection data for this week.
                        </Text>
                        <Text mt={2} fontSize="sm" color={THEME.colors.textMuted}>
                          Write daily entries to see weekly insights.
                        </Text>
                      </Box>
                    )}
                  </Stack>
                </WarmCard>
              </MotionBox>
            </Box>
          </Grid>
        </Stack>
      </Container>

      {/* Edit Note Modal - Warm Theme */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent
          bg="white"
          borderRadius="2xl"
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.15)"
          mx={4}
        >
          <ModalHeader
            fontFamily={THEME.fonts.serif}
            fontWeight="400"
            fontSize="xl"
            color={THEME.colors.textPrimary}
            pb={2}
          >
            Edit Note
          </ModalHeader>
          <ModalCloseButton borderRadius="full" />
          <ModalBody>
            <Stack spacing={4}>
              <Input
                placeholder="Title (optional)"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                variant="unstyled"
                fontSize="lg"
                fontWeight="600"
                color={THEME.colors.textPrimary}
                _placeholder={{ color: 'gray.300' }}
                px={0}
              />
              <Textarea
                placeholder="Write your thoughts..."
                rows={8}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                variant="unstyled"
                fontSize="md"
                lineHeight="1.8"
                color={THEME.colors.textPrimary}
                _placeholder={{ color: 'gray.300' }}
                resize="none"
                px={0}
              />
            </Stack>
          </ModalBody>
          <ModalFooter pt={4} borderTop="1px solid" borderColor="gray.100">
            <Button
              variant="ghost"
              mr={3}
              onClick={onEditClose}
              borderRadius="full"
              color={THEME.colors.textSecondary}
              _hover={{ bg: 'gray.100' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              isLoading={isSavingEdit}
              isDisabled={!editBody?.trim()?.length}
              bg="gray.900"
              color="white"
              borderRadius="full"
              px={6}
              _hover={{ bg: 'gray.700', transform: 'translateY(-1px)' }}
              _active={{ transform: 'scale(0.98)' }}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
