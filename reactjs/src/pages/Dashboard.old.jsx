import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
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
  const [weeklyError, setWeeklyError] = useState('');

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
  const fetchAllNotes = useCallback(async ({ startDate, endDate } = {}) => {
    setNotesLoading(true);
    try {
      const response = await listNotes({
        startDate: startDate || dateRange.start,
        endDate: endDate || dateRange.end,
      });

      const notes = Array.isArray(response?.data) ? response.data : [];
      setAllNotes(notes);
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
  const fetchWeeklySummaryData = useCallback(async ({ startDate, endDate } = {}) => {
    setWeeklyLoading(true);
    try {
      const response = await getWeeklySummary({
        startDate: startDate || dateRange.start,
        endDate: endDate || dateRange.end,
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

  // Initial data fetch and setup
  useEffect(() => {
    // Set initial date range if not set
    if (!dateRange.start || !dateRange.end) {
      const today = new Date();
      const start = startOfWeek(today, { locale: id, weekStartsOn: 1 });
      const end = endOfWeek(today, { locale: id, weekStartsOn: 1 });
      setDateRange({ start, end });
      setSelectedDate(today);
    }
    
    // Fetch data for current date range
    if (dateRange.start && dateRange.end) {
      fetchWeeklySummaryData({ startDate: dateRange.start, endDate: dateRange.end });
      fetchAllNotes({ startDate: dateRange.start, endDate: dateRange.end });
    }
  }, [dateRange.start, dateRange.end, fetchAllNotes, fetchWeeklySummaryData]);

  // Open edit modal with note data
  const openEditModal = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title || '');
    setEditBody(note.body || '');
  };

  // Handle note update
  const handleUpdateNote = async () => {
    if (!selectedNote) return;
    
    setIsSavingEdit(true);
    try {
      const updatedNote = await updateNote(selectedNote.id, {
        title: editTitle,
        body: editBody,
      });
      
      setAllNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === updatedNote.id ? updatedNote : note
        )
      );
      
      toast({
        title: 'Catatan berhasil diperbarui',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Gagal memperbarui catatan',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (note) => {
    setSelectedNote(note);
  };

  // Handle note deletion
  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    
    setIsDeleting(true);
    try {
      await deleteNote(selectedNote.id);
      
      setAllNotes(prevNotes => 
        prevNotes.filter(note => note.id !== selectedNote.id)
      );
      setSelectedNote(null);
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

  // Calculate mood statistics
  const moodStats = useMemo(() => {
    const stats = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    if (weeklyData.analysis?.moodScore) {
      // Count mood occurrences from daily summaries
      weeklyData.dailySummaries.forEach(summary => {
        const mood = summary.analysis?.mood?.toLowerCase() || 'neutral';
        if (mood.includes('positive')) stats.positive++;
        else if (mood.includes('negative')) stats.negative++;
        else stats.neutral++;
      });
    }

    return stats;
  }, [weeklyData.analysis, weeklyData.dailySummaries]);

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

  // Handle date selection
  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
  }, []);

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
              isLoading={notesLoading || weeklyLoading}
            >
              Muat Ulang
            </Button>
          </Flex>

          <Grid templateColumns={{ base: '1fr', lg: '1fr 2fr' }} gap={6}>
            {/* Left Sidebar - Calendar */}
            <Stack spacing={6}>
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
                    onClick={() => {
                      // Add new note functionality
                    }}
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
                              onClick={() => openEditModal(note)}
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              aria-label="Hapus catatan"
                              onClick={() => openDeleteModal(note)}
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
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    if (weeklyData.analysis?.moodScore) {
      // Count mood occurrences from daily summaries
      weeklyData.dailySummaries.forEach(summary => {
        const mood = summary.analysis?.mood?.toLowerCase() || 'neutral';
        if (mood.includes('positive')) stats.positive++;
        else if (mood.includes('negative')) stats.negative++;
        else stats.neutral++;
      });
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
                isLoading={notesLoading || weeklyLoading}
              >
                Muat Ulang
              </Button>
            </Flex>

            <Grid templateColumns={{ base: '1fr', lg: '1fr 2fr' }} gap={6}>
              {/* Left Sidebar - Calendar */}
              <Stack spacing={6}>
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
                      onClick={() => {
                        // Add new note functionality
                      }}
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

  // Helper component for info cards
  function InfoCard({ label, value, color = 'whiteAlpha.800' }) {
    return (
      <Box>
        <Text fontSize="sm" color="whiteAlpha.600" mb={1}>
          {label}
        </Text>
        <Text color={color} fontWeight="medium">
          {value}
        </Text>
      </Box>
    );
  }

  // Edit Note Modal Component
  function EditNoteModal({ isOpen, onClose, title, body, onTitleChange, onBodyChange, onSubmit, isSubmitting }) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Edit Catatan</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={4}>
              <FormLabel>Judul</FormLabel>
              <Input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Judul catatan"
                bg="gray.700"
                borderColor="whiteAlpha.300"
                _hover={{ borderColor: 'whiteAlpha.400' }}
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Isi Catatan</FormLabel>
              <Textarea
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                placeholder="Tulis catatan Anda di sini..."
                rows={10}
                bg="gray.700"
                borderColor="whiteAlpha.300"
                _hover={{ borderColor: 'whiteAlpha.400' }}
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
                }}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSubmitting}>
              Batal
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={onSubmit}
              isLoading={isSubmitting}
              loadingText="Menyimpan..."
            >
              Simpan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  // Delete Confirmation Modal
  function DeleteNoteModal({ isOpen, onClose, onConfirm, isDeleting }) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Hapus Catatan</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text>Apakah Anda yakin ingin menghapus catatan ini? Tindakan ini tidak dapat dibatalkan.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isDeleting}>
              Batal
            </Button>
            <Button 
              colorScheme="red" 
              onClick={onConfirm}
              isLoading={isDeleting}
              loadingText="Menghapus..."
            >
              Hapus
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
