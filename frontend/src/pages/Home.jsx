import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Stack,
  Text,
  useToast,
  Grid,
  SimpleGrid,
  Flex,
  VStack,
  Badge,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { StarIcon, RepeatIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { listNotes } from '../services/journalService';
import BeautifulJournalNote from '../components/BeautifulJournalNote';

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
    warmHighlight: '#F6E05E',
    success: '#68D391',
    border: '#E2E8F0',
  },
  fonts: {
    sans: '"Inter", sans-serif',
    serif: '"Merriweather", serif',
  },
};

const categoryEmojis = {
  Friends: '👥',
  Family: '👨‍👩‍👧‍👦',
  Health: '💪',
  Work: '💼',
  Nature: '🌿',
  Food: '🍽️',
  Love: '❤️',
  Learning: '📚',
  Peace: '🧘',
  Success: '🏆',
  General: '✨',
};

export default function Home() {
  const toast = useToast();
  const [streak, setStreak] = useState(0);

  // Calculate streak on mount
  useEffect(() => {
    const calculateStreak = async () => {
      try {
        const notes = await listNotes();
        console.log('📊 Total notes fetched:', notes.length);
        
        // Get unique dates (YYYY-MM-DD format)
        const uniqueDates = [...new Set(notes.map(note => {
          const date = new Date(note.noteDate || note.createdAt || note.created_at);
          return date.toISOString().split('T')[0];
        }))].sort().reverse();
        
        console.log('📅 Unique dates:', uniqueDates);
        
        // Calculate consecutive days from today
        let currentStreak = 0;
        const today = new Date().toISOString().split('T')[0];
        console.log('📆 Today:', today);
        
        for (let i = 0; i < uniqueDates.length; i++) {
          const expectedDate = new Date();
          expectedDate.setDate(expectedDate.getDate() - i);
          const expectedDateStr = expectedDate.toISOString().split('T')[0];
          
          console.log(`Checking day ${i}: expected ${expectedDateStr}, found: ${uniqueDates.includes(expectedDateStr)}`);
          
          if (uniqueDates.includes(expectedDateStr)) {
            currentStreak++;
          } else {
            break;
          }
        }
        
        console.log('🔥 Final streak:', currentStreak);
        setStreak(currentStreak);
      } catch (error) {
        console.error('Error calculating streak:', error);
      }
    };
    
    calculateStreak();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSave = (result) => {
    if (result?.data) {
      console.log('📝 Note saved:', result.data);
      if (result.data.imageUrl) {
        console.log('📸 Image URL:', result.data.imageUrl);
      }
      // Recalculate streak after saving
      window.location.reload();
    }
  };

  return (
    <Box minH="100vh" bg={THEME.colors.bg} color={THEME.colors.textPrimary} fontFamily={THEME.fonts.sans} overflowX="hidden">
      {/* Background Elements */}
      <Box
        position="absolute"
        top="-10%"
        right="-5%"
        w="500px"
        h="500px"
        bg="radial-gradient(circle, rgba(214, 188, 250, 0.2) 0%, rgba(255,255,255,0) 70%)"
        borderRadius="full"
        filter="blur(60px)"
        zIndex={0}
        pointerEvents="none"
      />

      <Container maxW="100%" pt={{ base: 6, md: 8 }} pb={12} position="relative" zIndex={1} px={{ base: 4, md: 8, lg: 12 }}>
        <Stack spacing={4}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Flex justify="space-between" align="start" flexWrap="wrap" gap={4}>
                <Stack spacing={1} flex="1">
                  <Text fontSize="sm" color={THEME.colors.textSecondary} letterSpacing="wide" textTransform="uppercase">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                  </Text>
                  <Heading fontSize={{ base: '3xl', md: '4xl' }} fontWeight="300" fontFamily={THEME.fonts.serif} letterSpacing="-0.02em">
                    {getGreeting()}
                  </Heading>
                  <Text fontSize="md" color={THEME.colors.textSecondary} maxW="xl" mt={1}>
                    How is your heart feeling today? Take a moment to breathe and reflect.
                  </Text>
                </Stack>
                
                {/* Streak Counter */}
                {streak > 0 && (
                  <Box
                    bg="white"
                    p={4}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={THEME.colors.border}
                    boxShadow="sm"
                    minW="150px"
                  >
                    <VStack spacing={1}>
                      <HStack spacing={2}>
                        <Icon as={CheckCircleIcon} color={THEME.colors.accent} boxSize={5} />
                        <Text fontSize="2xl" fontWeight="700" color={THEME.colors.textPrimary} fontFamily={THEME.fonts.sans}>
                          {streak}
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color={THEME.colors.textSecondary} fontFamily={THEME.fonts.sans} textAlign="center">
                        Day Streak 🔥
                      </Text>
                      <Text fontSize="xs" color={THEME.colors.textMuted} fontFamily={THEME.fonts.sans} textAlign="center">
                        Keep it going!
                      </Text>
                    </VStack>
                  </Box>
                )}
              </Flex>
            </MotionBox>

            {/* Writing Suggestions - Clickable */}
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Box 
                bg="white" 
                p={4} 
                borderRadius="xl" 
                border="1px solid"
                borderColor={THEME.colors.border}
                boxShadow="sm"
              >
                <HStack mb={2}>
                  <Text fontSize="xl">✍️</Text>
                  <Text fontSize="sm" fontWeight="600" color={THEME.colors.textPrimary} fontFamily={THEME.fonts.sans}>
                    Quick Start - Click to insert
                  </Text>
                </HStack>
                <Text fontSize="xs" color={THEME.colors.textMuted} mb={3} fontFamily={THEME.fonts.sans}>
                  Click any suggestion below to insert it into your journal
                </Text>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={2}>
                  <Box 
                    as="button"
                    p={2.5} 
                    bg={THEME.colors.bg} 
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={THEME.colors.border}
                    _hover={{ bg: THEME.colors.accent, borderColor: THEME.colors.accent, transform: 'translateY(-1px)' }}
                    transition="all 0.2s"
                    textAlign="left"
                    onClick={() => {
                      const event = new CustomEvent('insertJournalText', { 
                        detail: 'Today I felt grateful for... \n\n' 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <Text fontSize="sm" color={THEME.colors.textPrimary} fontWeight="500" fontFamily={THEME.fonts.sans}>
                      🙏 Today I felt grateful for...
                    </Text>
                  </Box>
                  <Box 
                    as="button"
                    p={2.5} 
                    bg={THEME.colors.bg} 
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={THEME.colors.border}
                    _hover={{ bg: THEME.colors.accent, borderColor: THEME.colors.accent, transform: 'translateY(-1px)' }}
                    transition="all 0.2s"
                    textAlign="left"
                    onClick={() => {
                      const event = new CustomEvent('insertJournalText', { 
                        detail: 'Something interesting that happened today... \n\n' 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <Text fontSize="sm" color={THEME.colors.textPrimary} fontWeight="500" fontFamily={THEME.fonts.sans}>
                      ✨ Something interesting that happened...
                    </Text>
                  </Box>
                  <Box 
                    as="button"
                    p={2.5} 
                    bg={THEME.colors.bg} 
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={THEME.colors.border}
                    _hover={{ bg: THEME.colors.accent, borderColor: THEME.colors.accent, transform: 'translateY(-1px)' }}
                    transition="all 0.2s"
                    textAlign="left"
                    onClick={() => {
                      const event = new CustomEvent('insertJournalText', { 
                        detail: 'Today I learned that... \n\n' 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <Text fontSize="sm" color={THEME.colors.textPrimary} fontWeight="500" fontFamily={THEME.fonts.sans}>
                      📚 Today I learned that...
                    </Text>
                  </Box>
                  <Box 
                    as="button"
                    p={2.5} 
                    bg={THEME.colors.bg} 
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={THEME.colors.border}
                    _hover={{ bg: THEME.colors.accent, borderColor: THEME.colors.accent, transform: 'translateY(-1px)' }}
                    transition="all 0.2s"
                    textAlign="left"
                    onClick={() => {
                      const event = new CustomEvent('insertJournalText', { 
                        detail: 'Tomorrow I want to... \n\n' 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <Text fontSize="sm" color={THEME.colors.textPrimary} fontWeight="500" fontFamily={THEME.fonts.sans}>
                      🌟 Tomorrow I want to...
                    </Text>
                  </Box>
                </Grid>
              </Box>
            </MotionBox>

            {/* Beautiful Journal Note Component */}
            <MotionBox
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <BeautifulJournalNote 
                selectedDate={new Date()} 
                onSave={handleSave}
              />
            </MotionBox>
        </Stack>
      </Container>
    </Box>
  );
}
