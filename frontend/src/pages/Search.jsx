import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast,
  Divider,
  Icon,
  Flex,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Grid,
} from '@chakra-ui/react';
import { SearchIcon, CalendarIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { format, parse, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { searchNotes } from '../services/journalService';

const MotionBox = motion(Box);

// Theme matching the warm organic design
const THEME = {
  colors: {
    bg: '#FDFCF8',
    cardBg: '#FFFFFF',
    textPrimary: '#2D3748',
    textSecondary: '#718096',
    textMuted: '#A0AEC0',
    accent: '#D6BCFA',
    accentHover: '#B794F4',
    warmHighlight: '#F6E05E',
    success: '#68D391',
    border: '#E2E8F0',
    borderLight: '#EDF2F7',
  },
  fonts: {
    serif: '"Merriweather", "Georgia", serif',
    sans: '"Inter", sans-serif',
  },
};

// Simple Date Picker Component
function SimpleDatePicker({ value, onChange }) {
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const [isOpen, setIsOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: idLocale, weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { locale: idLocale, weekStartsOn: 1 });

  const dates = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    dates.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

  const handleSelectDate = (date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  return (
    <Popover isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <PopoverTrigger>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={CalendarIcon} color={THEME.colors.accent} />
          </InputLeftElement>
          <Input
            type="text"
            value={value ? format(new Date(value), 'dd MMM yyyy', { locale: idLocale }) : ''}
            placeholder="dd-mm-yyyy"
            borderRadius="xl"
            border={`1px solid ${THEME.colors.borderLight}`}
            _focus={{
              borderColor: THEME.colors.accent,
              boxShadow: `0 0 0 3px rgba(214, 188, 250, 0.2)`,
            }}
            readOnly
            cursor="pointer"
            onClick={() => setIsOpen(true)}
          />
        </InputGroup>
      </PopoverTrigger>
      <PopoverContent width="380px" p={6} borderRadius="2xl" boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)" border={`1px solid ${THEME.colors.borderLight}`} bg={THEME.colors.cardBg}>
        <PopoverBody p={0}>
          <Box>
            {/* Header bulan */}
            <Flex justify="space-between" align="center" mb={8}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                p={0}
                minW="24px"
                color={THEME.colors.textSecondary}
                _hover={{ color: THEME.colors.textPrimary, bg: 'transparent' }}
                fontSize="lg"
              >
                &lt;
              </Button>
              <Text fontWeight="600" fontSize="lg" color={THEME.colors.textPrimary}>
                {format(currentMonth, 'MMMM yyyy', { locale: idLocale })}
              </Text>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                p={0}
                minW="24px"
                color={THEME.colors.textSecondary}
                _hover={{ color: THEME.colors.textPrimary, bg: 'transparent' }}
                fontSize="lg"
              >
                &gt;
              </Button>
            </Flex>

            {/* Week days header */}
            <Grid templateColumns="repeat(7, 1fr)" gap={2} mb={4}>
              {weekDays.map((day, idx) => (
                <Flex key={`weekday-${idx}`} justify="center" align="center" h="32px">
                  <Text fontSize="sm" fontWeight="500" color={THEME.colors.textMuted}>
                    {day}
                  </Text>
                </Flex>
              ))}
            </Grid>

            {/* Calendar dates */}
            <Grid templateColumns="repeat(7, 1fr)" gap={2}>
              {dates.map((date, idx) => {
                const isSelected = value && isSameDay(date, new Date(value));
                const isCurrentMonth = isSameMonth(date, currentMonth);

                return (
                  <Button
                    key={`date-${idx}`}
                    size="md"
                    bg={isSelected ? THEME.colors.accent : isCurrentMonth ? 'transparent' : THEME.colors.borderLight}
                    color={isSelected ? 'white' : isCurrentMonth ? THEME.colors.textPrimary : THEME.colors.textMuted}
                    borderRadius="lg"
                    h="40px"
                    w="40px"
                    p={0}
                    onClick={() => handleSelectDate(date)}
                    _hover={{
                      bg: isSelected ? THEME.colors.accentHover : isCurrentMonth ? THEME.colors.borderLight : 'transparent',
                    }}
                    fontSize="sm"
                    fontWeight="500"
                    variant="ghost"
                  >
                    {format(date, 'd')}
                  </Button>
                );
              })}
            </Grid>
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const toast = useToast();

  // Debounced search function
  const performSearch = useCallback(async (q, from, to) => {
    if (!q.trim() && !from && !to) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await searchNotes({
        query: q,
        dateFrom: from,
        dateTo: to,
        limit: 100,
      });
      setResults(data);
      setHasSearched(true);
    } catch (error) {
      toast({
        title: 'Pencarian Gagal',
        description: error.message || 'Terjadi kesalahan saat mencari catatan.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Auto-search when query or dates change
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, dateFrom, dateTo);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, dateFrom, dateTo, performSearch]);

  const handleClearSearch = () => {
    setQuery('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <Box minH="100vh" bg={THEME.colors.bg} color={THEME.colors.textPrimary} fontFamily={THEME.fonts.sans}>
      {/* Floating Background Elements */}
      <Box
        position="absolute"
        top="-10%"
        right="-5%"
        w="500px"
        h="500px"
        bg="radial-gradient(circle, rgba(214, 188, 250, 0.15) 0%, rgba(255,255,255,0) 70%)"
        borderRadius="full"
        filter="blur(60px)"
        pointerEvents="none"
        zIndex={0}
      />
      <Box
        position="absolute"
        bottom="-20%"
        left="-10%"
        w="600px"
        h="600px"
        bg="radial-gradient(circle, rgba(246, 224, 94, 0.1) 0%, rgba(255,255,255,0) 70%)"
        borderRadius="full"
        filter="blur(60px)"
        pointerEvents="none"
        zIndex={0}
      />

      <Container maxW="1200px" py={8} position="relative" zIndex={1}>
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          mb={8}
        >
          <Heading
            fontSize={{ base: '3xl', md: '4xl' }}
            fontWeight="300"
            fontFamily={THEME.fonts.serif}
            letterSpacing="-0.02em"
            color={THEME.colors.textPrimary}
            mb={2}
          >
            Cari Catatan
          </Heading>
          <Text color={THEME.colors.textSecondary} fontSize="lg">
            Temukan catatan harianmu dengan mudah
          </Text>
        </MotionBox>

        {/* Search Filters */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          bg={THEME.colors.cardBg}
          p={6}
          borderRadius="2xl"
          border={`1px solid ${THEME.colors.borderLight}`}
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.05)"
          mb={8}
        >
          <Stack spacing={4}>
            {/* Search Query */}
            <FormControl>
              <FormLabel fontWeight="600" color={THEME.colors.textSecondary} fontFamily={THEME.fonts.sans}>
                Kata Kunci
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={SearchIcon} color={THEME.colors.accent} />
                </InputLeftElement>
                <Input
                  placeholder="Cari berdasarkan judul atau isi catatan..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  borderRadius="xl"
                  border={`1px solid ${THEME.colors.borderLight}`}
                  _focus={{
                    borderColor: THEME.colors.accent,
                    boxShadow: `0 0 0 3px rgba(214, 188, 250, 0.2)`,
                  }}
                  fontSize="md"
                />
              </InputGroup>
            </FormControl>

            {/* Date Range */}
            <Flex gap={4} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
              <FormControl flex={1}>
                <FormLabel fontWeight="600" color={THEME.colors.textSecondary} fontFamily={THEME.fonts.sans}>
                  Dari Tanggal
                </FormLabel>
                <SimpleDatePicker value={dateFrom} onChange={setDateFrom} />
              </FormControl>

              <FormControl flex={1}>
                <FormLabel fontWeight="600" color={THEME.colors.textSecondary} fontFamily={THEME.fonts.sans}>
                  Hingga Tanggal
                </FormLabel>
                <SimpleDatePicker value={dateTo} onChange={setDateTo} />
              </FormControl>
            </Flex>

            {/* Clear button */}
            {(query || dateFrom || dateTo) && (
              <Button
                size="sm"
                variant="ghost"
                colorScheme="purple"
                onClick={handleClearSearch}
              >
                Hapus Filter
              </Button>
            )}
          </Stack>
        </MotionBox>

        {/* Loading State */}
        {isLoading && (
          <Flex justify="center" align="center" minH="200px">
            <Stack align="center" spacing={4}>
              <Spinner size="xl" color={THEME.colors.accent} thickness="4px" />
              <Text color={THEME.colors.textSecondary}>Sedang mencari...</Text>
            </Stack>
          </Flex>
        )}

        {/* Results */}
        {!isLoading && hasSearched && (
          <Box>
            <Heading size="md" mb={4} color={THEME.colors.textPrimary}>
              Hasil Pencarian ({results.length})
            </Heading>

            {results.length === 0 ? (
              <MotionBox
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                bg={THEME.colors.cardBg}
                p={8}
                borderRadius="2xl"
                border={`1px solid ${THEME.colors.borderLight}`}
                textAlign="center"
              >
                <Text color={THEME.colors.textSecondary} fontSize="lg">
                  Tidak ada catatan yang cocok dengan pencarian Anda.
                </Text>
                <Text color={THEME.colors.textMuted} mt={2}>
                  Coba gunakan kata kunci yang berbeda atau ubah rentang tanggal.
                </Text>
              </MotionBox>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {results.map((note, idx) => (
                  <MotionBox
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Box
                      bg={THEME.colors.cardBg}
                      p={6}
                      borderRadius="2xl"
                      border={`1px solid ${THEME.colors.borderLight}`}
                      boxShadow="0 4px 20px rgba(0, 0, 0, 0.05)"
                      _hover={{
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.3s ease',
                      }}
                      minH="400px"
                      display="flex"
                      flexDirection="column"
                    >
                      {/* Note Header */}
                      <Flex justify="space-between" align="flex-start" mb={3}>
                        <Box flex={1}>
                          <Heading size="sm" mb={1} color={THEME.colors.textPrimary} noOfLines={2}>
                            {note.title}
                          </Heading>
                          <Text fontSize="xs" color={THEME.colors.textMuted}>
                            {note.noteDate
                              ? format(new Date(note.noteDate), 'dd MMMM yyyy', { locale: idLocale })
                              : format(new Date(note.createdAt), 'dd MMMM yyyy', { locale: idLocale })}
                          </Text>
                        </Box>
                      </Flex>

                      <Divider my={3} borderColor={THEME.colors.borderLight} />

                      {/* Note Body - Read Only */}
                      <Text
                        fontSize="sm"
                        color={THEME.colors.textSecondary}
                        mb={4}
                        flex={1}
                        noOfLines={6}
                        whiteSpace="pre-wrap"
                        wordBreak="break-word"
                      >
                        {note.body}
                      </Text>

                      {/* No Action Buttons - Read Only View */}
                    </Box>
                  </MotionBox>
                ))}
              </SimpleGrid>
            )}
          </Box>
        )}

        {/* Empty State (before any search) */}
        {!hasSearched && !isLoading && (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            bg={THEME.colors.cardBg}
            p={12}
            borderRadius="2xl"
            border={`2px dashed ${THEME.colors.borderLight}`}
            textAlign="center"
          >
            <Icon as={SearchIcon} w={12} h={12} color={THEME.colors.accent} mb={4} opacity={0.5} />
            <Heading size="md" mb={2} color={THEME.colors.textSecondary}>
              Mulai Pencarian
            </Heading>
            <Text color={THEME.colors.textMuted}>
              Gunakan kolom pencarian di atas untuk mencari catatan harianmu berdasarkan kata kunci atau tanggal.
            </Text>
          </MotionBox>
        )}
      </Container>
    </Box>
  );
}
