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
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, ChevronLeftIcon, ChevronRightIcon, DeleteIcon, EditIcon, RepeatIcon } from '@chakra-ui/icons';
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

export default function Dashboard() {
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
    status: null,
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
    return allNotes.filter(note => {
      const noteDate = new Date(note.note_date || note.createdAt);
      return isSameDay(noteDate, selectedDate);
    });
  }, [allNotes, selectedDate]);

  // Fetch notes for the current date range
  const fetchAllNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
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
      
      setWeeklyData({
        analysis: response?.analysis || null,
        dailySummaries: response?.dailySummaries || [],
        status: response?.status || 'pending',
      });
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
      toast({
        title: 'Gagal memuat ringkasan mingguan',
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
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900" color="white" p={4}>
      <Container maxW="6xl" py={8}>
        <Stack spacing={8}>
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="xl">Jurnal Harian</Heading>
              <Text color="whiteAlpha.700">
                {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
              </Text>
            </Box>
            <Button
              leftIcon={<RepeatIcon />}
              onClick={() => {
                fetchWeeklySummaryData();
                fetchAllNotes();
              }}
              isLoading={weeklyLoading || notesLoading}
            >
              Muat Ulang
            </Button>
          </Flex>

          <Grid templateColumns={{ base: '1fr', lg: '1fr 2fr' }} gap={6}>
            {/* Left Side - Calendar & Notes */}
            <Stack spacing={6}>
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
                  <Button
                    leftIcon={<AddIcon />}
                    size="sm"
                    colorScheme="blue"
                  >
                    Tambah
                  </Button>
                </Flex>

                {notesForSelectedDate.length === 0 ? (
                  <Box textAlign="center" py={8} color="whiteAlpha.600">
                    <Text>Belum ada catatan untuk hari ini</Text>
                  </Box>
                ) : (
                  <Stack spacing={4}>
                    {notesForSelectedDate.map((note) => (
                      <Box 
                        key={note.id}
                        p={4}
                        bg="whiteAlpha.100"
                        borderRadius="lg"
                        _hover={{ bg: 'whiteAlpha.200' }}
                      >
                        <Flex justify="space-between" align="start">
                          <Box>
                            <Text fontWeight="medium" mb={1}>
                              {note.title || 'Tanpa Judul'}
                            </Text>
                            <Text fontSize="sm" color="whiteAlpha.700" noOfLines={2}>
                              {note.body}
                            </Text>
                          </Box>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              aria-label="Edit catatan"
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              aria-label="Hapus catatan"
                              onClick={() => handleDeleteNote(note)}
                              isLoading={isDeleting}
                            />
                          </HStack>
                        </Flex>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>

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

                  {weeklyData.status === 'pending' ? (
                    <Box textAlign="center" py={8}>
                      <Spinner size="lg" />
                      <Text mt={2} color="whiteAlpha.700">Menyiapkan ringkasan mingguan...</Text>
                    </Box>
                  ) : weeklyData.analysis ? (
                    <Stack spacing={6}>
                      {/* Mood Summary */}
                      <Box>
                        <Heading size="md" mb={3}>Mood Minggu Ini</Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                          <InfoCard 
                            label="Mood Dominan" 
                            value={weeklyData.analysis.dominantMood || 'Belum ada data'} 
                          />
                          <InfoCard 
                            label="Skor Mood" 
                            value={weeklyData.analysis.moodScore || '—'} 
                          />
                          <InfoCard 
                            label="Afirmasi" 
                            value={weeklyData.analysis.affirmation || 'Belum ada'} 
                          />
                        </SimpleGrid>
                      </Box>

                      {/* Summary */}
                      {weeklyData.analysis.summary && (
                        <Box>
                          <Heading size="md" mb={3}>Ringkasan</Heading>
                          <Box bg="whiteAlpha.100" p={4} borderRadius="lg">
                            <Text>{weeklyData.analysis.summary}</Text>
                          </Box>
                        </Box>
                      )}

                      {/* Highlights & Advice */}
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Box>
                          <Heading size="md" mb={3}>Sorotan</Heading>
                          <Box bg="whiteAlpha.100" p={4} borderRadius="lg">
                            <Stack spacing={2}>
                              {(weeklyData.analysis.highlights || ['Belum ada sorotan']).map((item, idx) => (
                                <Text key={idx} display="flex" alignItems="flex-start">
                                  <Text as="span" mr={2}>•</Text>
                                  {item}
                                </Text>
                              ))}
                            </Stack>
                          </Box>
                        </Box>
                        <Box>
                          <Heading size="md" mb={3}>Saran</Heading>
                          <Box bg="whiteAlpha.100" p={4} borderRadius="lg">
                            <Stack spacing={2}>
                              {(weeklyData.analysis.advice || ['Belum ada saran']).map((item, idx) => (
                                <Text key={idx} display="flex" alignItems="flex-start">
                                  <Text as="span" mr={2}>•</Text>
                                  {item}
                                </Text>
                              ))}
                            </Stack>
                          </Box>
                        </Box>
                      </SimpleGrid>
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
