import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, isSameDay, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, SearchIcon, RepeatIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import JournalCalendar from '../components/JournalCalendar';
import { getWeeklySummary, listNotes, updateNote, deleteNote } from '../services/journalService';

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

function DailySummaryCard({ summary }) {
  const { date, analysis } = summary;
  const highlights = analysis?.highlights ?? [];
  const advice = analysis?.advice ?? [];

  return (
    <Box border="1px solid" borderColor="whiteAlpha.200" borderRadius="2xl" bg="rgba(15, 23, 42, 0.6)" px={5} py={4}>
      <Stack spacing={3}>
        <HStack justify="space-between" align="center">
          <Heading size="sm">{date ?? 'Tanggal tidak diketahui'}</Heading>
          <Badge colorScheme="cyan" borderRadius="full">
            {analysis?.dominantMood ?? 'unknown'}
          </Badge>
        </HStack>
        <Text color="whiteAlpha.800">{analysis?.summary ?? 'Tidak ada ringkasan.'}</Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <InfoCard label="Skor" value={analysis?.moodScore ?? '—'} />
          <InfoCard label="Catatan" value={`${analysis?.noteCount ?? 0} catatan`} />
        </SimpleGrid>
        {highlights.length ? (
          <Stack spacing={2}>
            <Heading size="xs" color="whiteAlpha.700">
              Sorotan
            </Heading>
            {highlights.map((item, idx) => (
              <Text key={`highlight-${idx}`} color="whiteAlpha.800">
                • {item}
              </Text>
            ))}
          </Stack>
        ) : null}
        {advice.length ? (
          <Stack spacing={2}>
            <Heading size="xs" color="whiteAlpha.700">
              Saran
            </Heading>
            {advice.map((item, idx) => (
              <Text key={`advice-${idx}`} color="whiteAlpha.800">
                • {item}
              </Text>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}


export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { locale: id }),
    end: endOfWeek(new Date(), { locale: id }),
  });

  const [weeklyData, setWeeklyData] = useState({
    week: null,
    notes: [],
    analysis: null,
    dailySummaries: [],
    status: null,
    message: null,
  });
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyError, setWeeklyError] = useState('');

  const [allNotes, setAllNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const toast = useToast();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  const [selectedNote, setSelectedNote] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter notes based on search query and date range
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    
    const filtered = allNotes.filter(note => {
      const noteDate = new Date(note.note_date || note.createdAt);
      const matchesSearch = !query || 
        (note.title?.toLowerCase().includes(query) || 
         note.body?.toLowerCase().includes(query));
      
      const matchesDateRange = isWithinInterval(noteDate, {
        start: dateRange.start,
        end: dateRange.end,
      });
      
      return matchesSearch && matchesDateRange;
    });
    
    setFilteredNotes(filtered);
  }, [allNotes, searchQuery, dateRange]);

  // Handle date range changes
  const handleDateRangeChange = useCallback((newDate) => {
    const start = startOfWeek(newDate, { locale: id });
    const end = endOfWeek(newDate, { locale: id });
    
    setDateRange({ start, end });
    fetchWeeklySummaryData(start, end);
    fetchAllNotes();
  }, [fetchAllNotes, fetchWeeklySummaryData]);

  // Handle calendar date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    handleDateRangeChange(date);
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    handleDateSelect(newDate);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    handleDateSelect(newDate);
  };

  const fetchAllNotes = useCallback(async () => {
    setNotesError('');
    setNotesLoading(true);
    try {
      const notes = await listNotes({
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      setAllNotes(notes);
    } catch (error) {
      setNotesError(error.message || 'Gagal mengambil catatan');
      console.error('Error fetching notes:', error);
      setAllNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  const fetchWeeklySummaryData = useCallback(async (startDate = null, endDate = null) => {
    setWeeklyError('');
    setWeeklyLoading(true);
    try {
      const params = {};
      if (startDate) {
        params.start_date = format(startDate, 'yyyy-MM-dd');
        params.end_date = endDate ? format(endDate, 'yyyy-MM-dd') : format(startDate, 'yyyy-MM-dd');
      }
      
      const payload = await getWeeklySummary(params);
      setWeeklyData({
        week: payload.week || null,
        notes: Array.isArray(payload.notes) ? payload.notes : [],
        analysis: payload.analysis || null,
        dailySummaries: Array.isArray(payload.dailySummaries) ? payload.dailySummaries : [],
        status: payload.status || 'ready',
        message: payload.message || null,
      });
    } catch (error) {
      setWeeklyError(error.message || 'Gagal mengambil ringkasan mingguan');
      console.error('Error fetching weekly summary:', error);
      setWeeklyData({
        week: null,
        notes: [],
        analysis: null,
        dailySummaries: [],
        status: null,
        message: null,
      });
    } finally {
      setWeeklyLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchWeeklySummaryData(dateRange.start, dateRange.end);
    fetchAllNotes();
  }, [fetchAllNotes, fetchWeeklySummaryData, dateRange.start, dateRange.end]);
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      setAllNotes(notes);
    } catch (error) {
      setNotesError(error.message || 'Gagal mengambil seluruh catatan.');
      setAllNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  const openEditModal = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title ?? '');
    setEditBody(note.body ?? '');
    editModal.onOpen();
  };

  const handleUpdateNote = async () => {
    if (!selectedNote) return;
    if (!editBody.trim()) {
      toast({
        title: 'Isi catatan tidak boleh kosong',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSavingEdit(true);
    try {
      await updateNote(selectedNote.id, {
        title: editTitle.trim() || null,
        body: editBody.trim(),
        userId: selectedNote.userId,
      });

      toast({
        title: 'Catatan diperbarui',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      editModal.onClose();
      setSelectedNote(null);
      await Promise.all([fetchWeeklySummaryData(), fetchAllNotes()]);
    } catch (error) {
      toast({
        title: 'Gagal memperbarui catatan',
        description: error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openDeleteModal = (note) => {
    setSelectedNote(note);
    deleteModal.onOpen();
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    setIsDeleting(true);
    try {
      await deleteNote(selectedNote.id);
      toast({
        title: 'Catatan dihapus',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      deleteModal.onClose();
      setSelectedNote(null);
      await Promise.all([fetchWeeklySummaryData(), fetchAllNotes()]);
    } catch (error) {
      toast({
        title: 'Gagal menghapus catatan',
        description: error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-br, gray.900, gray.800)" py={{ base: 10, md: 16 }}>
      <Container maxW="6xl">
        <Stack spacing={10} color="whiteAlpha.900">
          <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ md: 'center' }}>
            <Stack spacing={2}>
              <Heading size="2xl">Dashboard Jurnal</Heading>
              <Text color="whiteAlpha.700">
                Lihat ringkasan mingguan dan kelola seluruh catatan yang pernah kamu tulis.
              </Text>
            </Stack>
            <Button
              leftIcon={<RepeatIcon />}
              colorScheme="cyan"
              variant="outline"
              onClick={() => {
                fetchWeeklySummaryData(dateRange.start, dateRange.end);
                fetchAllNotes();
              }}
              isDisabled={weeklyLoading || notesLoading}
            >
              Muat ulang data
            </Button>
          </Stack>
          
          {/* Calendar Section */}
          <Box
            bg="rgba(15, 23, 42, 0.75)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="3xl"
            p={6}
          >
            <JournalCalendar 
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              notes={allNotes}
            />
            
            {/* Week Navigation */}
            <Flex justify="space-between" mt={4} align="center">
              <Button 
                leftIcon={<ChevronLeftIcon />} 
                onClick={goToPreviousWeek}
                size="sm"
                variant="ghost"
              >
                Minggu Sebelumnya
              </Button>
              <Text fontSize="lg" fontWeight="bold">
                {format(dateRange.start, 'd MMM yyyy', { locale: id })} - {format(dateRange.end, 'd MMM yyyy', { locale: id })}
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

          <Box
            bg="rgba(15, 23, 42, 0.75)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="3xl"
            px={{ base: 6, md: 10 }}
            py={{ base: 8, md: 10 }}
          >
            <Stack spacing={6}>
              <Heading size="lg">
                Ringkasan Minggu {format(dateRange.start, 'd MMM', { locale: id })} - {format(dateRange.end, 'd MMM yyyy', { locale: id })}
              </Heading>

              {weeklyLoading ? (
                <HStack spacing={3} color="whiteAlpha.800">
                  <Spinner color="cyan.300" />
                  <Text>Memuat ringkasan mingguan...</Text>
                </HStack>
              ) : weeklyError ? (
                <Alert status="error" variant="left-accent" borderRadius="lg">
                  <AlertIcon />
                  {weeklyError}
                </Alert>
              ) : (
                <Stack spacing={5}>
                  {weeklyData.week ? (
                    <Badge colorScheme="purple" fontSize="md" px={3} py={1} borderRadius="full" alignSelf="flex-start">
                      Minggu {weeklyData.week.start} - {weeklyData.week.end}
                    </Badge>
                  ) : null}

                  {weeklyData.status === 'pending' && weeklyData.message ? (
                    <Alert status="info" variant="left-accent" borderRadius="lg">
                      <AlertIcon />
                      {weeklyData.message}
                    </Alert>
                  ) : null}

                  {weeklyData.analysis ? (
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <InfoCard label="Mood Dominan" value={weeklyData.analysis.dominantMood ?? 'Tidak diketahui'} />
                      <InfoCard label="Skor Mood" value={weeklyData.analysis.moodScore ?? '—'} />
                      <InfoCard label="Afirmasi" value={weeklyData.analysis.affirmation ?? 'Tidak ada'} />
                    </SimpleGrid>
                  ) : (
                    <Text color="whiteAlpha.600">Belum ada analisis untuk minggu ini.</Text>
                  )}

                  <Stack spacing={4}>
                    {weeklyData.analysis?.summary ? (
                      <Box borderRadius="2xl" bg="whiteAlpha.100" px={5} py={4}>
                        <Heading size="sm" mb={2}>
                          Ringkasan AI
                        </Heading>
                        <Text color="whiteAlpha.800">{weeklyData.analysis.summary}</Text>
                      </Box>
                    ) : null}

                    <Stack spacing={3}>
                      <Heading size="sm">Sorotan</Heading>
                      <Stack spacing={2}>
                        {(weeklyData.analysis?.highlights ?? []).map((item, index) => (
                          <Box
                            key={`highlight-${index}`}
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            borderRadius="lg"
                            px={4}
                            py={3}
                            bg="whiteAlpha.100"
                          >
                            <Text color="whiteAlpha.800">{item}</Text>
                          </Box>
                        ))}
                      </Stack>
                    </Stack>

                    <Stack spacing={3}>
                      <Heading size="sm">Saran</Heading>
                      <Stack spacing={2}>
                        {(weeklyData.analysis?.advice ?? []).map((item, index) => (
                          <Box
                            key={`advice-${index}`}
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            borderRadius="lg"
                            px={4}
                            py={3}
                            bg="whiteAlpha.100"
                          >
                            <Text color="whiteAlpha.800">{item}</Text>
                          </Box>
                        ))}
                      </Stack>
                    </Stack>

                    <Stack spacing={3}>
                      <Heading size="sm">Rangkuman Harian</Heading>
                      {weeklyData.dailySummaries.length ? (
                        <Stack spacing={3}>
                          {weeklyData.dailySummaries.map((day) => (
                            <DailySummaryCard key={day.id ?? day.date} summary={day} />
                          ))}
                        </Stack>
                      ) : (
                        <Text color="whiteAlpha.600">Belum ada rangkuman harian untuk minggu ini.</Text>
                      )}
                    </Stack>
                  </Stack>
                </Stack>
              )}
            </Stack>
          </Box>

          <Box
            bg="rgba(15, 23, 42, 0.75)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="3xl"
            px={{ base: 6, md: 10 }}
            py={{ base: 8, md: 10 }}
          >
            <Stack spacing={6}>
              <HStack justify="space-between" align="center">
                <Heading size="lg">Semua Catatan</Heading>
                <InputGroup maxW="sm">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="whiteAlpha.500" />
                  </InputLeftElement>
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari judul atau isi catatan"
                    bg="whiteAlpha.100"
                    borderColor="whiteAlpha.200"
                    _focus={{ borderColor: 'cyan.300', boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.6)' }}
                  />
                </InputGroup>
              </HStack>

              {notesLoading ? (
                <HStack spacing={3} color="whiteAlpha.800">
                  <Spinner color="cyan.300" />
                  <Text>Memuat semua catatan...</Text>
                </HStack>
              ) : notesError ? (
                <Alert status="error" variant="left-accent" borderRadius="lg">
                  <AlertIcon />
                  {notesError}
                </Alert>
              ) : filteredNotes.length ? (
                <TableContainer borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.200">
                  <Table variant="simple" colorScheme="whiteAlpha">
                    <Thead bg="whiteAlpha.200">
                      <Tr>
                        <Th color="whiteAlpha.800">Judul</Th>
                        <Th color="whiteAlpha.800">Ditulis Pada</Th>
                        <Th color="whiteAlpha.800">Preview</Th>
                        <Th color="whiteAlpha.800">Aksi</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredNotes.map((note) => (
                        <Tr key={note.id} _hover={{ bg: 'whiteAlpha.100' }}>
                          <Td>{note.title || 'Tanpa judul'}</Td>
                          <Td>{formatDate(note.createdAt)}</Td>
                          <Td maxW="xs">
                            <Text noOfLines={2}>{note.body || 'Tidak ada isi catatan.'}</Text>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Edit catatan"
                                icon={<EditIcon />}
                                variant="ghost"
                                colorScheme="cyan"
                                onClick={() => openEditModal(note)}
                              />
                              <IconButton
                                aria-label="Hapus catatan"
                                icon={<DeleteIcon />}
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => openDeleteModal(note)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              ) : (
                <Text color="whiteAlpha.600">Belum ada catatan yang tersimpan.</Text>
              )}
            </Stack>
          </Box>
        </Stack>
      </Container>

      <EditNoteModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        title={editTitle}
        body={editBody}
        onTitleChange={(event) => setEditTitle(event.target.value)}
        onBodyChange={(event) => setEditBody(event.target.value)}
        onSubmit={handleUpdateNote}
        isSubmitting={isSavingEdit}
      />

      <DeleteNoteModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          deleteModal.onClose();
          setSelectedNote(null);
        }}
        onConfirm={handleDeleteNote}
        isDeleting={isDeleting}
      />
    </Box>
  );
}

function InfoCard({ label, value }) {
  return (
    <Box
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="2xl"
      bg="whiteAlpha.100"
      px={5}
      py={4}
    >
      <Text fontSize="sm" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="0.08em">
        {label}
      </Text>
      <Heading size="md" color="whiteAlpha.900" mt={2}>
        {value}
      </Heading>
    </Box>
  );
}

function EditNoteModal({ isOpen, onClose, title, body, onTitleChange, onBodyChange, onSubmit, isSubmitting }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent bg="gray.900" color="whiteAlpha.900">
        <ModalHeader>Edit Catatan</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Judul</FormLabel>
              <Input
                value={title}
                onChange={onTitleChange}
                placeholder="Judul catatan"
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.200"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Isi catatan</FormLabel>
              <Textarea
                value={body}
                onChange={onBodyChange}
                rows={6}
                placeholder="Perbarui catatanmu"
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.200"
              />
            </FormControl>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Batal
          </Button>
          <Button colorScheme="cyan" onClick={onSubmit} isLoading={isSubmitting}>
            Simpan perubahan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function DeleteNoteModal({ isOpen, onClose, onConfirm, isDeleting }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent bg="gray.900" color="whiteAlpha.900">
        <ModalHeader>Hapus Catatan</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>Catatan ini akan dihapus secara permanen. Lanjutkan?</Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Batal
          </Button>
          <Button colorScheme="red" onClick={onConfirm} isLoading={isDeleting}>
            Hapus
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
