import { useState } from 'react';
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

  // Hitung tanggal awal dan akhir kalender
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: id, weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { locale: id, weekStartsOn: 1 });

  // Generate semua tanggal untuk ditampilkan
  const dates = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    dates.push(day);
    day = addDays(day, 1);
  }

  // Cek apakah tanggal punya catatan
  const hasNotes = (date) => {
    return notes.some((note) => {
      const noteDate = new Date(note.note_date || note.createdAt);
      return isSameDay(noteDate, date);
    });
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
        />
        <Text fontWeight="bold" fontSize="lg">
          {format(currentMonth, 'MMMM yyyy', { locale: id })}
        </Text>
        <IconButton
          icon={<ChevronRightIcon />}
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          size="sm"
          variant="ghost"
          aria-label="Bulan berikutnya"
        />
      </Flex>

      {/* Header hari dalam minggu */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2}>
        {weekDays.map((day, idx) => (
          <Flex key={`weekday-${idx}`} justify="center" align="center" h="32px">
            <Text fontSize="sm" fontWeight="medium" color="whiteAlpha.600">
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
              bg={isSelected ? 'blue.500' : isToday ? 'blue.700' : 'transparent'}
              color={!isCurrentMonth ? 'whiteAlpha.400' : 'white'}
              borderRadius="md"
              _hover={{ bg: isSelected ? 'blue.600' : 'whiteAlpha.100' }}
              transition="all 0.2s"
              h="40px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="sm" fontWeight={isToday ? 'bold' : 'normal'}>
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
                  bg="green.400"
                />
              )}
            </Box>
          );
        })}
      </Grid>
    </Box>
  );
}
