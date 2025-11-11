import { useCallback, useEffect, useMemo, useState } from 'react';
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
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast,
  Collapse,
  SlideFade,
  ScaleFade,
  Progress,
  Divider,
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
import StyledInfoCard from '../components/StyledInfoCard';
import { AddIcon, ChevronLeftIcon, ChevronRightIcon, DeleteIcon, EditIcon, RepeatIcon, HamburgerIcon } from '@chakra-ui/icons';
import JournalCalendar from '../components/JournalCalendar';
import { getWeeklySummary, listNotes, updateNote, deleteNote } from '../services/journalService';

// Helper component for info cards
function InfoCard({ label, value, color = 'whiteAlpha.800' }) {
  return (
    <Box bg="whiteAlpha.100" p={4} borderRadius="lg">
      <Text fontSize="sm" color="whiteAlpha.600" mb={1}>
        {label}
      </Text>
      <Text color={color} fontWeight="medium">
        {value}
      </Text>
    </Box>
  );
}

function MoodMovieCard({ movie, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Box
        bg="whiteAlpha.100"
        borderRadius="xl"
        border="1px solid"
        borderColor="whiteAlpha.200"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        h="100%"
      >
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            objectFit="cover"
            w="100%"
            h="200px"
          />
        ) : (
          <Flex
            align="center"
            justify="center"
            w="100%"
            h="200px"
            bg="whiteAlpha.200"
          >
            <Text fontSize="3xl">🎬</Text>
          </Flex>
        )}
        <Stack spacing={4} p={5} flex="1">
          <Box>
            <Heading size="md" color="cyan.200" noOfLines={2}>
              {movie.title}
            </Heading>
            <HStack spacing={2} mt={2}>
              {movie.year && (
                <Badge colorScheme="cyan" variant="subtle">
                  {movie.year}
                </Badge>
              )}
              {movie.imdbId && (
                <Badge colorScheme="purple" variant="outline">
                  IMDb {movie.imdbId.toUpperCase()}
                </Badge>
              )}
            </HStack>
          </Box>
          {movie.tagline && (
            <Text fontSize="sm" color="whiteAlpha.700" fontStyle="italic">
              {movie.tagline}
            </Text>
          )}
          <Text fontSize="sm" color="whiteAlpha.900" lineHeight="tall">
            {movie.reason}
          </Text>
          {Array.isArray(movie.genres) && movie.genres.length > 0 && (
            <Wrap spacing={2} pt={2}>
              {movie.genres.map((genre) => (
                <WrapItem key={genre}>
                  <Badge colorScheme="blue" variant="subtle">
                    {genre}
                  </Badge>
                </WrapItem>
              ))}
            </Wrap>
          )}
        </Stack>
      </Box>
    </motion.div>
  );
}

export default function Dashboard() {
  const { isOpen: isSidebarOpen, onToggle: onSidebarToggle } = useDisclosure({ defaultIsOpen: true });
  const showSidebarToggle = useBreakpointValue({ base: true, xl: false });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    return {
      start: startOfWeek(today, { locale: id, weekStartsOn: 1 }),
      end: endOfWeek(today, { locale: id, weekStartsOn: 1 })
    };
  });

  const [weeklyData, setWeeklyData] = useState({
    analysis: null,
    dailySummaries: [],
    recommendations: null,
    status: 'idle',
    message: null
  });
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  
  const [allNotes, setAllNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const toast = useToast();

  // Get notes for the selected date
  const notesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    console.log('All notes:', allNotes);
    console.log('Selected date:', selectedDate);
    
    return allNotes.filter(note => {
      // Use noteDate first, fallback to created_at/createdAt
      const dateStr = note.noteDate || note.note_date || note.createdAt || note.created_at;
      if (!dateStr) return false;
      
      const noteDate = new Date(dateStr);
      const result = isSameDay(noteDate, selectedDate);
      
      console.log('Comparing:', {
        noteDate: noteDate.toISOString(),
        selectedDate: selectedDate.toISOString(),
        isSame: result
      });
      
      return result;
    });
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
      setAllNotes(Array.isArray(response?.data) ? response.data : []);
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
  }, [dateRange.start, dateRange.end, toast]);

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
        message: error.message || 'Gagal memuat data'
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
  }, [dateRange.start, dateRange.end, toast]);

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

  // Handle note deletion
  const handleDeleteNote = async (note) => {
    if (!note) return;
    
    setIsDeleting(true);
    try {
      await deleteNote(note.id);
      
      setAllNotes(prevNotes => 
        prevNotes.filter(n => n.id !== note.id)
      );
      
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
        bg="gray.900"
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
            ease: "easeInOut"
          }}
        >
          <Text fontSize="4xl">📔</Text>
        </motion.div>
        <Spinner size="xl" color="cyan.200" thickness="3px" />
        <Text color="whiteAlpha.800" fontSize="lg" fontWeight="medium">
          Memuat jurnal Anda...
        </Text>
      </Flex>
    );
  }

  return (
    <Box 
      minH="100vh" 
      bg="gray.900" 
      color="white" 
      p={{ base: 4, md: 6 }}
      backgroundImage="linear-gradient(to bottom right, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))"
    >
      <Container maxW="7xl" py={8}>
        <Stack spacing={6}>
          {/* Header */}
          <GlassCard p={6}>
            <Flex 
              justify="space-between" 
              align="center" 
              direction={{ base: 'column', md: 'row' }}
              gap={4}
            >
              <Stack spacing={1}>
                <Heading 
                  size="xl" 
                  bgGradient="linear(to-r, cyan.200, blue.200)" 
                  bgClip="text"
                >
                  Jurnal Harian
                </Heading>
                <Text color="whiteAlpha.700" fontSize="lg">
                  {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
                </Text>
              </Stack>
              <HStack spacing={4}>
                <Button
                  leftIcon={<RepeatIcon />}
                  onClick={() => {
                    fetchWeeklySummaryData();
                    fetchAllNotes();
                  }}
                  isLoading={weeklyLoading || notesLoading}
                  variant="ghost"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  size="sm"
                >
                  Muat Ulang
                </Button>
                <Button
                  colorScheme="cyan"
                  size="sm"
                  onClick={() => window.location.href = '/'}
                >
                  Tambah Catatan Baru
                </Button>
              </HStack>
            </Flex>
          </GlassCard>

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
            templateColumns={{ base: '1fr', xl: isSidebarOpen ? '350px 1fr' : '0 1fr' }} 
            gap={6}
          >
            {/* Left Side - Calendar & Notes */}
            <Box 
              display={{ base: isSidebarOpen ? 'block' : 'none', xl: 'block' }} 
              width={{ base: 'full', xl: isSidebarOpen ? '350px' : '0' }}
              transition="width 0.2s"
              overflow="hidden"
            >
              <Stack spacing={6} position="sticky" top={6} alignSelf="start">
              {/* Calendar */}
              <Box bg="rgba(15, 23, 42, 0.75)" borderRadius="2xl" p={6} border="1px solid" borderColor="whiteAlpha.200">
                <JournalCalendar
                  selectedDate={selectedDate}
                  onSelectDate={handleDateSelect}
                  notes={allNotes}
                />
                <Flex justify="space-between" mt={4} align="center">
                  <Button
                    leftIcon={<ChevronLeftIcon />}
                    onClick={goToPreviousWeek}
                    size="sm"
                    variant="ghost"
                  >
                    Minggu Lalu
                  </Button>
                  <Text fontSize="md" fontWeight="medium">
                    {format(dateRange.start, 'd MMM', { locale: id })} - {format(dateRange.end, 'd MMM yyyy', { locale: id })}
                  </Text>
                  <Button
                    rightIcon={<ChevronRightIcon />}
                    onClick={goToNextWeek}
                    size="sm"
                    variant="ghost"
                  >
                    Minggu Depan
                  </Button>
                </Flex>
              </Box>

              {/* Daily Notes */}
              <Box bg="rgba(15, 23, 42, 0.75)" borderRadius="2xl" p={6} border="1px solid" borderColor="whiteAlpha.200">
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="md">Catatan Harian</Heading>
                </Flex>

                {notesForSelectedDate.length === 0 ? (
                  <Box textAlign="center" py={8} color="whiteAlpha.600">
                    <Text>Belum ada catatan untuk hari ini</Text>
                  </Box>
                ) : (
                  <Stack spacing={4}>
                    {notesForSelectedDate.map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Box 
                          p={4}
                          bg="whiteAlpha.50"
                          borderRadius="xl"
                          border="1px solid"
                          borderColor="whiteAlpha.100"
                          _hover={{ 
                            bg: 'whiteAlpha.100',
                            transform: 'translateY(-2px)',
                            boxShadow: 'lg',
                            borderColor: 'whiteAlpha.200'
                          }}
                          transition="all 0.2s"
                        >
                          <Flex justify="space-between" align="start" gap={4}>
                            <Box flex="1">
                              <Flex align="center" mb={2}>
                                <Text fontWeight="semibold" fontSize="md" color="whiteAlpha.900">
                                  {note.title || 'Tanpa Judul'}
                                </Text>
                                <Text fontSize="sm" color="whiteAlpha.600" ml={2}>
                                  • {format(new Date(note.note_date || note.createdAt), 'HH:mm')}
                                </Text>
                              </Flex>
                              <Text 
                                fontSize="sm" 
                                color="whiteAlpha.800" 
                                noOfLines={2}
                                lineHeight="tall"
                              >
                                {note.body}
                              </Text>
                            </Box>
                            <HStack spacing={1}>
                              <IconButton
                                icon={<EditIcon />}
                                size="sm"
                                variant="ghost"
                                aria-label="Edit catatan"
                                color="cyan.200"
                                _hover={{ bg: 'whiteAlpha.200' }}
                              />
                              <IconButton
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                aria-label="Hapus catatan"
                                onClick={() => handleDeleteNote(note)}
                                isLoading={isDeleting}
                                _hover={{ bg: 'red.900' }}
                              />
                            </HStack>
                          </Flex>
                        </Box>
                      </motion.div>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
            </Box>

            {/* Right Side - Weekly Summary */}
            <Box>
              <Box bg="rgba(15, 23, 42, 0.75)" borderRadius="2xl" p={6} border="1px solid" borderColor="whiteAlpha.200">
                <Stack spacing={6}>
                  <Box>
                    <Heading size="lg" mb={1}>Ringkasan Mingguan</Heading>
                    <Text color="whiteAlpha.600">
                      {format(dateRange.start, 'd MMM', { locale: id })} - {format(dateRange.end, 'd MMM yyyy', { locale: id })}
                    </Text>
                  </Box>

                  {weeklyLoading ? (
                    <Box textAlign="center" py={8}>
                      <Spinner size="lg" color="cyan.200" />
                      <Text mt={2} color="whiteAlpha.700">Memuat data...</Text>
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
                          <Flex 
                            direction={{ base: "column", md: "row" }}
                            gap={6}
                            mb={6}
                          >
                            {/* Mood Score */}
                            <Box 
                              flex="1"
                              bg="whiteAlpha.100"
                              p={6}
                              borderRadius="xl"
                              border="1px solid"
                              borderColor="whiteAlpha.200"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              flexDirection="column"
                              gap={4}
                            >
                              <Flex align="center" gap={2}>
                                <Heading size="md">Skor Mood</Heading>
                                <MoodEmoji mood={weeklyData.analysis.dominantMood} size="32px" />
                              </Flex>
                              <CircularProgress 
                                value={weeklyData.analysis.moodScore || 0}
                                size={160}
                                color="cyan.400"
                              />
                            </Box>

                            {/* Mood Details */}
                            <Stack flex="2" spacing={4}>
                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                <Box
                                  bg="whiteAlpha.100"
                                  p={6}
                                  borderRadius="xl"
                                  border="1px solid"
                                  borderColor="whiteAlpha.200"
                                >
                                  <Text fontSize="sm" color="whiteAlpha.600" mb={2}>
                                    🎭 Mood Dominan
                                  </Text>
                                  <Heading size="md" color="cyan.200">
                                    {weeklyData.analysis.dominantMood || 'Belum ada data'}
                                  </Heading>
                                </Box>
                                <Box
                                  bg="whiteAlpha.100"
                                  p={6}
                                  borderRadius="xl"
                                  border="1px solid"
                                  borderColor="whiteAlpha.200"
                                >
                                  <Text fontSize="sm" color="whiteAlpha.600" mb={2}>
                                    ✨ Afirmasi Hari Ini
                                  </Text>
                                  <Text fontSize="md" color="yellow.200" fontWeight="500">
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
                            <Flex align="center" mb={3}>
                              <Heading size="md" mr={3}>Ringkasan</Heading>
                              <Text fontSize="xl">📝</Text>
                            </Flex>
                            <Box 
                              bg="whiteAlpha.100" 
                              p={6} 
                              borderRadius="xl"
                              border="1px solid"
                              borderColor="whiteAlpha.200"
                              _hover={{
                                bg: "whiteAlpha.200",
                                transform: "translateY(-2px)",
                                boxShadow: "lg"
                              }}
                              transition="all 0.2s"
                            >
                              <Text lineHeight="tall" color="whiteAlpha.900">
                                {weeklyData.analysis.summary}
                              </Text>
                            </Box>
                          </Box>
                        </SlideFade>
                      )}

                      {/* Highlights & Advice */}
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <SlideFade in={true} offsetY={20}>
                          <Box>
                            <Flex align="center" mb={3}>
                              <Heading size="md" mr={3}>Sorotan</Heading>
                              <Text fontSize="xl">🌟</Text>
                            </Flex>
                            <Box 
                              bg="whiteAlpha.100" 
                              p={6} 
                              borderRadius="xl"
                              border="1px solid"
                              borderColor="whiteAlpha.200"
                              position="relative"
                              _hover={{
                                bg: "whiteAlpha.200",
                                transform: "translateY(-2px)",
                                boxShadow: "lg"
                              }}
                              transition="all 0.2s"
                            >
                              <Stack spacing={3}>
                                {(weeklyData.analysis.highlights || ['Belum ada sorotan']).map((item, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                  >
                                    <Text display="flex" alignItems="flex-start" color="whiteAlpha.900">
                                      <Text as="span" mr={2} color="yellow.200">✦</Text>
                                      {item}
                                    </Text>
                                  </motion.div>
                                ))}
                              </Stack>
                            </Box>
                          </Box>
                        </SlideFade>
                        
                        <SlideFade in={true} offsetY={20}>
                          <Box>
                            <Flex align="center" mb={3}>
                              <Heading size="md" mr={3}>Saran</Heading>
                              <Text fontSize="xl">💡</Text>
                            </Flex>
                            <Box 
                              bg="whiteAlpha.100" 
                              p={6} 
                              borderRadius="xl"
                              border="1px solid"
                              borderColor="whiteAlpha.200"
                              position="relative"
                              _hover={{
                                bg: "whiteAlpha.200",
                                transform: "translateY(-2px)",
                                boxShadow: "lg"
                              }}
                              transition="all 0.2s"
                            >
                              <Stack spacing={3}>
                                {(weeklyData.analysis.advice || ['Belum ada saran']).map((item, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                  >
                                    <Text display="flex" alignItems="flex-start" color="whiteAlpha.900">
                                      <Text as="span" mr={2} color="cyan.200">⚡</Text>
                                      {item}
                                    </Text>
                                  </motion.div>
                                ))}
                              </Stack>
                            </Box>
                          </Box>
                        </SlideFade>
                      </SimpleGrid>

                      {weeklyData.recommendations?.items?.length ? (
                        <SlideFade in={true} offsetY={20}>
                          <Box>
                            <Flex align="center" mb={3}>
                              <Heading size="md" mr={3}>
                                {weeklyData.recommendations.headline || 'Rekomendasi Film Mingguan'}
                              </Heading>
                              <Text fontSize="xl">🎬</Text>
                            </Flex>
                            <Text color="whiteAlpha.700" mb={4}>
                              {weeklyData.recommendations.description || 'Film pilihan untuk menemani perjalanan mood minggu ini.'}
                            </Text>
                            {/* Rekomendasi film tematik berbasis mood mingguan */}
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
                              {weeklyData.recommendations.items.map((movie, idx) => (
                                <MoodMovieCard key={`${movie.title}-${idx}`} movie={movie} index={idx} />
                              ))}
                            </SimpleGrid>
                          </Box>
                        </SlideFade>
                      ) : null}
                    </Stack>
                  ) : (
                    <Box textAlign="center" py={8} color="whiteAlpha.600">
                      <Text>Belum ada data ringkasan untuk minggu ini.</Text>
                      <Text mt={2}>Catat aktivitas harianmu untuk melihat analisis mingguan.</Text>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Box>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
