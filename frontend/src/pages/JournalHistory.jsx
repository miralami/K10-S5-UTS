import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Image,
  Spinner,
  useToast,
  Grid,
  Badge,
  Flex,
  IconButton,
  AspectRatio,
  Divider,
  Stack,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@chakra-ui/icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import { listNotes } from '../services/journalService';

const MotionBox = motion(Box);

const THEME = {
  colors: {
    bg: '#FDFCF8',
    cardBg: '#FFFFFF',
    textPrimary: '#2D3748',
    textSecondary: '#718096',
    textMuted: '#A0AEC0',
    accent: '#D6BCFA',
    accentHover: '#B794F4',
    border: '#E2E8F0',
  },
};

export default function JournalHistory() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [notes, setNotes] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadNotes();
  }, [currentMonth]);

  useEffect(() => {
    filterNotesByDate();
  }, [selectedDate, allNotes]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const fetchedNotes = await listNotes({
        startDate: start,
        endDate: end,
      });
      
      console.log('📥 Loaded notes from API:', fetchedNotes);
      console.log('📸 Notes with images:', fetchedNotes.filter(n => n.imageUrl || n.imagePath));
      
      setAllNotes(fetchedNotes || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load journal entries',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterNotesByDate = () => {
    if (!selectedDate) {
      setNotes([]);
      return;
    }

    const filtered = allNotes.filter(note => {
      const noteDate = new Date(note.noteDate || note.createdAt);
      return isSameDay(noteDate, selectedDate);
    });

    console.log('Filtered notes for date:', selectedDate, filtered);
    console.log('Notes with images:', filtered.filter(n => n.imageUrl));
    setNotes(filtered);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const hasNotesOnDate = (date) => {
    return allNotes.some(note => {
      const noteDate = new Date(note.noteDate || note.createdAt);
      return isSameDay(noteDate, date);
    });
  };

  const getNotesCountOnDate = (date) => {
    return allNotes.filter(note => {
      const noteDate = new Date(note.noteDate || note.createdAt);
      return isSameDay(noteDate, date);
    }).length;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Box minH="100vh" bg={THEME.colors.bg} py={8}>
      <Container maxW="7xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HStack spacing={3} mb={2}>
              <CalendarIcon boxSize={8} color="purple.500" />
              <Heading 
                size="xl" 
                bgGradient="linear(to-r, purple.600, pink.500)"
                bgClip="text"
              >
                Journal History
              </Heading>
            </HStack>
            <Text color={THEME.colors.textSecondary}>
              Browse your journal entries by date
            </Text>
          </MotionBox>

          <Grid templateColumns={{ base: '1fr', lg: '400px 1fr' }} gap={8}>
            {/* Calendar Section */}
            <MotionBox
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Box
                bg="white"
                p={6}
                borderRadius="2xl"
                boxShadow="lg"
                border="2px solid"
                borderColor="purple.100"
              >
                {/* Month Navigation */}
                <Flex justify="space-between" align="center" mb={6}>
                  <IconButton
                    icon={<ChevronLeftIcon />}
                    onClick={handlePrevMonth}
                    variant="ghost"
                    colorScheme="purple"
                    aria-label="Previous month"
                  />
                  <Heading size="md" color="purple.700">
                    {format(currentMonth, 'MMMM yyyy')}
                  </Heading>
                  <IconButton
                    icon={<ChevronRightIcon />}
                    onClick={handleNextMonth}
                    variant="ghost"
                    colorScheme="purple"
                    aria-label="Next month"
                  />
                </Flex>

                {/* Week Days */}
                <Grid templateColumns="repeat(7, 1fr)" gap={2} mb={2}>
                  {weekDays.map(day => (
                    <Text
                      key={day}
                      fontSize="xs"
                      fontWeight="bold"
                      color="purple.600"
                      textAlign="center"
                    >
                      {day}
                    </Text>
                  ))}
                </Grid>

                {/* Calendar Days */}
                <Grid templateColumns="repeat(7, 1fr)" gap={2}>
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: days[0].getDay() }).map((_, i) => (
                    <Box key={`empty-${i}`} />
                  ))}
                  
                  {/* Actual days */}
                  {days.map(day => {
                    const isSelected = isSameDay(day, selectedDate);
                    const hasNotes = hasNotesOnDate(day);
                    const notesCount = getNotesCountOnDate(day);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <Box
                        key={day.toISOString()}
                        as="button"
                        onClick={() => setSelectedDate(day)}
                        p={2}
                        borderRadius="lg"
                        position="relative"
                        bg={isSelected ? 'purple.500' : isToday ? 'purple.50' : 'transparent'}
                        color={isSelected ? 'white' : 'gray.700'}
                        fontWeight={isSelected || isToday ? 'bold' : 'normal'}
                        _hover={{
                          bg: isSelected ? 'purple.600' : 'purple.100',
                          transform: 'scale(1.05)',
                        }}
                        transition="all 0.2s"
                        border="2px solid"
                        borderColor={isToday ? 'purple.300' : 'transparent'}
                      >
                        <Text fontSize="sm">{format(day, 'd')}</Text>
                        {hasNotes && (
                          <Badge
                            position="absolute"
                            top="-1"
                            right="-1"
                            colorScheme={isSelected ? 'pink' : 'purple'}
                            borderRadius="full"
                            fontSize="xs"
                          >
                            {notesCount}
                          </Badge>
                        )}
                      </Box>
                    );
                  })}
                </Grid>

                {/* Legend */}
                <VStack spacing={2} mt={6} align="stretch">
                  <HStack fontSize="xs" color="gray.600">
                    <Box w={3} h={3} borderRadius="full" bg="purple.500" />
                    <Text>Selected date</Text>
                  </HStack>
                  <HStack fontSize="xs" color="gray.600">
                    <Box w={3} h={3} borderRadius="full" border="2px solid" borderColor="purple.300" />
                    <Text>Today</Text>
                  </HStack>
                  <HStack fontSize="xs" color="gray.600">
                    <Badge colorScheme="purple" fontSize="xs">1</Badge>
                    <Text>Has entries</Text>
                  </HStack>
                </VStack>
              </Box>
            </MotionBox>

            {/* Notes Display Section */}
            <MotionBox
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Box
                bg="white"
                p={6}
                borderRadius="2xl"
                boxShadow="lg"
                border="2px solid"
                borderColor="purple.100"
                minH="600px"
              >
                <Flex justify="space-between" align="center" mb={6}>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color="purple.700">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </Heading>
                    <Text fontSize="sm" color="gray.600">
                      {notes.length} {notes.length === 1 ? 'entry' : 'entries'}
                    </Text>
                  </VStack>
                </Flex>

                <Divider mb={6} borderColor="purple.200" />

                {loading ? (
                  <Flex justify="center" align="center" minH="400px">
                    <Spinner size="xl" color="purple.500" thickness="4px" />
                  </Flex>
                ) : notes.length === 0 ? (
                  <Flex
                    direction="column"
                    justify="center"
                    align="center"
                    minH="400px"
                    color="gray.400"
                  >
                    <Text fontSize="6xl" mb={4}>📝</Text>
                    <Text fontSize="lg" fontWeight="medium">No entries for this date</Text>
                    <Text fontSize="sm" color="gray.500">
                      Select a date with entries or create a new one
                    </Text>
                  </Flex>
                ) : (
                  <VStack spacing={6} align="stretch">
                    {notes.map((note, index) => (
                      <MotionBox
                        key={note.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Box
                          p={6}
                          borderRadius="xl"
                          border="2px solid"
                          borderColor="purple.200"
                          bg="purple.50"
                          _hover={{
                            borderColor: 'purple.400',
                            boxShadow: 'lg',
                          }}
                          transition="all 0.3s"
                        >
                          <VStack spacing={4} align="stretch">
                            {/* Image */}
                            {note.imageUrl && (
                              <AspectRatio ratio={16/9} maxH="400px">
                                <Image
                                  src={note.imageUrl}
                                  alt={note.title || 'Journal image'}
                                  borderRadius="lg"
                                  objectFit="cover"
                                  boxShadow="md"
                                  onLoad={() => console.log('✅ Image loaded:', note.imageUrl)}
                                  onError={(e) => console.error('❌ Image failed to load:', note.imageUrl, e)}
                                />
                              </AspectRatio>
                            )}
                            {!note.imageUrl && note.imagePath && (
                              <Text fontSize="xs" color="red.500">
                                ⚠️ Image path exists but no URL: {note.imagePath}
                              </Text>
                            )}

                            {/* Title & Time */}
                            <Flex justify="space-between" align="start">
                              <Heading size="md" color="purple.700">
                                {note.title || 'Untitled'}
                              </Heading>
                              <Text fontSize="sm" color="gray.500">
                                {format(new Date(note.createdAt), 'HH:mm')}
                              </Text>
                            </Flex>

                            {/* Body */}
                            {note.body && (
                              <Text color="gray.700" lineHeight="tall" whiteSpace="pre-wrap">
                                {note.body}
                              </Text>
                            )}

                            {/* Gratitudes */}
                            {(note.gratitude1 || note.gratitude2 || note.gratitude3) && (
                              <Box
                                mt={4}
                                p={4}
                                bg="white"
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="purple.200"
                              >
                                <HStack mb={3}>
                                  <Text fontSize="lg">✨</Text>
                                  <Text fontWeight="bold" color="purple.600">
                                    Gratitudes
                                  </Text>
                                </HStack>
                                <Stack spacing={2}>
                                  {note.gratitude1 && (
                                    <HStack align="start">
                                      <Text color="purple.500">🌟</Text>
                                      <Text fontSize="sm" color="gray.700">
                                        {note.gratitude1}
                                      </Text>
                                    </HStack>
                                  )}
                                  {note.gratitude2 && (
                                    <HStack align="start">
                                      <Text color="purple.500">💖</Text>
                                      <Text fontSize="sm" color="gray.700">
                                        {note.gratitude2}
                                      </Text>
                                    </HStack>
                                  )}
                                  {note.gratitude3 && (
                                    <HStack align="start">
                                      <Text color="purple.500">🎉</Text>
                                      <Text fontSize="sm" color="gray.700">
                                        {note.gratitude3}
                                      </Text>
                                    </HStack>
                                  )}
                                </Stack>
                              </Box>
                            )}

                            {/* Categories */}
                            {(note.gratitudeCategory1 || note.gratitudeCategory2 || note.gratitudeCategory3) && (
                              <HStack spacing={2} flexWrap="wrap">
                                {note.gratitudeCategory1 && (
                                  <Badge colorScheme="purple" borderRadius="full">
                                    {note.gratitudeCategory1}
                                  </Badge>
                                )}
                                {note.gratitudeCategory2 && (
                                  <Badge colorScheme="pink" borderRadius="full">
                                    {note.gratitudeCategory2}
                                  </Badge>
                                )}
                                {note.gratitudeCategory3 && (
                                  <Badge colorScheme="purple" borderRadius="full">
                                    {note.gratitudeCategory3}
                                  </Badge>
                                )}
                              </HStack>
                            )}
                          </VStack>
                        </Box>
                      </MotionBox>
                    ))}
                  </VStack>
                )}
              </Box>
            </MotionBox>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
}
