import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Grid, Text, Flex, IconButton } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { id } from 'date-fns/locale';

export default function JournalCalendar({ selectedDate, onSelectDate, notes = [] }) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  // Generate semua tanggal untuk ditampilkan (Memoized)
  const dates = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { locale: id, weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { locale: id, weekStartsOn: 1 });

    const d = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      d.push(day);
      day = addDays(day, 1);
    }
    return d;
  }, [currentMonth]);

  // Optimize note lookup using a Set (Memoized)
  const notesSet = useMemo(() => {
    const set = new Set();
    notes.forEach((note) => {
      const dateStr = note.note_date || note.createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        set.add(format(d, 'yyyy-MM-dd'));
      }
    });
    return set;
  }, [notes]);

  // Cek apakah tanggal punya catatan (O(1) lookup)
  const hasNotes = (date) => {
    return notesSet.has(format(date, 'yyyy-MM-dd'));
  };

  const weekDays = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

  return (
    <Box>
      {/* Header bulan */}
      <Flex justify="space-between" align="center" mb={4}>
        <IconButton
          icon={<ChevronLeftIcon />}
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          size="sm"
          variant="ghost"
          aria-label="Bulan sebelumnya"
          color="gray.600"
          _hover={{ bg: 'gray.100' }}
        />
        <Text fontWeight="bold" fontSize="lg" color="gray.800">
          {format(currentMonth, 'MMMM yyyy', { locale: id })}
        </Text>
        <IconButton
          icon={<ChevronRightIcon />}
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          size="sm"
          variant="ghost"
          aria-label="Bulan berikutnya"
          color="gray.600"
          _hover={{ bg: 'gray.100' }}
        />
      </Flex>

      {/* Header hari dalam minggu */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2}>
        {weekDays.map((day, idx) => (
          <Flex key={`weekday-${idx}`} justify="center" align="center" h="32px">
            <Text fontSize="sm" fontWeight="medium" color="gray.400">
              {day}
            </Text>
          </Flex>
        ))}
      </Grid>

      {/* Grid tanggal - INI YANG PENTING! */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1}>
        {dates.map((date, idx) => {
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isToday = isSameDay(date, new Date());
          const noteExists = hasNotes(date);

          return (
            <Box
              key={`date-${idx}`}
              position="relative"
              cursor="pointer"
              onClick={() => onSelectDate(date)}
              bg={isSelected ? 'purple.500' : isToday ? 'purple.100' : 'transparent'}
              color={isSelected ? 'white' : !isCurrentMonth ? 'gray.300' : 'gray.700'}
              borderRadius="md"
              _hover={{ bg: isSelected ? 'purple.600' : 'gray.100' }}
              transition="all 0.2s"
              h="40px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="sm" fontWeight={isToday || isSelected ? 'bold' : 'normal'}>
                {format(date, 'd')}
              </Text>
              {noteExists && (
                <Box
                  position="absolute"
                  bottom="2px"
                  left="50%"
                  transform="translateX(-50%)"
                  w="4px"
                  h="4px"
                  borderRadius="full"
                  bg={isSelected ? 'white' : 'green.500'}
                />
              )}
            </Box>
          );
        })}
      </Grid>
    </Box>
  );
}

JournalCalendar.propTypes = {
  selectedDate: PropTypes.instanceOf(Date),
  onSelectDate: PropTypes.func.isRequired,
  notes: PropTypes.arrayOf(
    PropTypes.shape({
      note_date: PropTypes.string,
      createdAt: PropTypes.string,
    })
  ),
};
