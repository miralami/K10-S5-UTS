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
  Icon,
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { listNotes } from '../services/journalService';
import BeautifulJournalNote from '../components/BeautifulJournalNote';

// Framer Motion wrapper
const MotionBox = motion(Box);

// --- THEME CONFIGURATION (Warm Organic & Minimal Sans) ---
const THEME = {
  colors: {
    bg: '#FDFCF8', // Warm off-white
    textPrimary: '#2D3748',
    textSecondary: '#718096',
    accent: '#D6BCFA', // Soft Purple
    accentHover: '#B794F4',
    warmHighlight: '#F6E05E', // Soft Yellow
  },
  fonts: {
    sans: '"Inter", sans-serif',
    serif: '"Merriweather", serif', // Or any warm serif available
  },
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

  // Dynamic Greeting
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
    <Box minH="100vh" bg={THEME.colors.bg} color={THEME.colors.textPrimary} fontFamily={THEME.fonts.sans} position="relative" overflowX="hidden">
      {/* Floating Background Elements - Subtle & Organic */}
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
      />
      <Box
        position="absolute"
        bottom="10%"
        left="-10%"
        w="400px"
        h="400px"
        bg="radial-gradient(circle, rgba(246, 224, 94, 0.15) 0%, rgba(255,255,255,0) 70%)"
        borderRadius="full"
        filter="blur(50px)"
        zIndex={0}
      />

      <Container maxW="7xl" pt={{ base: 12, md: 20 }} pb={20} position="relative" zIndex={1}>
        <Stack spacing={12}>
          {/* Header Section - Minimal & Welcoming */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
          >
            <Stack spacing={1}>
              <Text
                fontSize="sm"
                color={THEME.colors.textSecondary}
                letterSpacing="wide"
                textTransform="uppercase"
              >
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Heading
                fontSize={{ base: '4xl', md: '5xl' }}
                fontWeight="300" // Light font weight for elegance
                fontFamily={THEME.fonts.serif}
                letterSpacing="-0.02em"
              >
                {getGreeting()}.
              </Heading>
              <Text
                fontSize="lg"
                color={THEME.colors.textSecondary}
                maxW="2xl"
                mt={2}
                lineHeight="tall"
              >
                How is your heart feeling today? Take a moment to breathe and reflect.
              </Text>
              
              {/* Streak Counter and Quick Add - Side by side */}
              <HStack spacing={3} mt={3} flexWrap="wrap">
                {streak > 0 && (
                  <Box
                    display="inline-flex"
                    alignItems="center"
                    gap={2}
                    bg="white"
                    px={4}
                    py={2}
                    borderRadius="full"
                    border="1px solid"
                    borderColor="gray.100"
                    boxShadow="sm"
                  >
                    <Icon as={CheckCircleIcon} color={THEME.colors.accent} boxSize={4} />
                    <Text fontSize="sm" fontWeight="600" color={THEME.colors.textPrimary}>
                      {streak} Day Streak 🔥
                    </Text>
                  </Box>
                )}
                
                {/* Quick add buttons */}
                <HStack spacing={2}>
                  <Text fontSize="xs" color={THEME.colors.textSecondary}>Quick add:</Text>
                  <Button size="sm" bgGradient="linear(to-r, purple.50, white)" color={THEME.colors.textPrimary} onClick={() => { window.dispatchEvent(new CustomEvent('insertJournalText', { detail: 'Today I felt grateful for...\n\n' })); toast({ title: 'Inserted', description: 'Gratitude', status: 'info', duration: 1200 }); }} _hover={{ transform: 'translateY(-3px)', boxShadow: 'md' }} borderRadius="full">Gratitude</Button>
                  <Button size="sm" bgGradient="linear(to-r, purple.50, white)" color={THEME.colors.textPrimary} onClick={() => { window.dispatchEvent(new CustomEvent('insertJournalText', { detail: 'One memorable moment today was...\n\n' })); toast({ title: 'Inserted', description: 'Moment', status: 'info', duration: 1200 }); }} _hover={{ transform: 'translateY(-3px)', boxShadow: 'md' }} borderRadius="full">Moment</Button>
                  <Button size="sm" bgGradient="linear(to-r, purple.50, white)" color={THEME.colors.textPrimary} onClick={() => { window.dispatchEvent(new CustomEvent('insertJournalText', { detail: 'Today I learned that...\n\n' })); toast({ title: 'Inserted', description: 'Learned', status: 'info', duration: 1200 }); }} _hover={{ transform: 'translateY(-3px)', boxShadow: 'md' }} borderRadius="full">Learned</Button>
                </HStack>
              </HStack>
            </Stack>
          </MotionBox>

          {/* Main Editor Canvas - Edge-free & Breathable */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Stack spacing={6}>
              {/* BeautifulJournalNote Component */}
              <BeautifulJournalNote 
                selectedDate={new Date()} 
                onSave={handleSave}
              />

              {/* Quick add moved into the note component for a tighter UX */}
            </Stack>
          </MotionBox>
        </Stack>
      </Container>
    </Box>
  );
}
