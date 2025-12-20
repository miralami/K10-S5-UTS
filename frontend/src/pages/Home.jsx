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
} from '@chakra-ui/react';
import { StarIcon, RepeatIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  getGratitudeStats, 
  getGratitudeDistribution,
  getRandomGratitude 
} from '../services/journalService';
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
  // Gratitude stats
  const [stats, setStats] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [randomGratitude, setRandomGratitude] = useState(null);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  useEffect(() => {
    loadGratitudeData();
  }, []);

  const loadGratitudeData = async () => {
    try {
      setLoading(true);
      const [statsData, distData, randomData] = await Promise.all([
        getGratitudeStats(),
        getGratitudeDistribution(),
        getRandomGratitude(),
      ]);
      
      setStats(statsData);
      setDistribution(distData);
      setRandomGratitude(randomData);
    } catch (error) {
      console.error('Error loading gratitude data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSave = (result) => {
    // Reload stats after saving
    loadGratitudeData();
    
    // Log saved note for debugging
    if (result?.data) {
      console.log('📝 Note saved:', result.data);
      if (result.data.imageUrl) {
        console.log('📸 Image URL:', result.data.imageUrl);
      }
    }
  };

  return (
    <Box minH="100vh" bg={THEME.colors.bg} color={THEME.colors.textPrimary} fontFamily={THEME.fonts.sans}>
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

      <Container maxW="7xl" pt={{ base: 8, md: 12 }} pb={20} position="relative" zIndex={1}>
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
          {/* Left Column - Journal Editor */}
          <Stack spacing={6}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Stack spacing={1}>
                <Text fontSize="sm" color={THEME.colors.textSecondary} letterSpacing="wide" textTransform="uppercase">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </Text>
                <Heading fontSize={{ base: '3xl', md: '4xl' }} fontWeight="300" fontFamily={THEME.fonts.serif} letterSpacing="-0.02em">
                  {getGreeting()}
                </Heading>
                <Text fontSize="md" color={THEME.colors.textSecondary} maxW="xl" mt={1}>
                  Capture your thoughts and gratitude for today
                </Text>
              </Stack>
            </MotionBox>

            {/* Writing Suggestions - Clickable */}
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Box 
                bg="white" 
                p={5} 
                borderRadius="xl" 
                border="1px solid"
                borderColor="purple.100"
                boxShadow="sm"
              >
                <HStack mb={3}>
                  <Text fontSize="xl">✍️</Text>
                  <Text fontSize="sm" fontWeight="bold" color="purple.700">
                    Quick Start - Click to insert
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  Click any suggestion below to insert it into your journal
                </Text>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={2}>
                  <Box 
                    as="button"
                    p={3} 
                    bg="purple.50" 
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="purple.200"
                    _hover={{ bg: 'purple.100', borderColor: 'purple.300' }}
                    transition="all 0.2s"
                    textAlign="left"
                    onClick={() => {
                      const event = new CustomEvent('insertJournalText', { 
                        detail: 'Today I felt grateful for... \n\n' 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <Text fontSize="sm" color="purple.700" fontWeight="medium">
                      🙏 Today I felt grateful for...
                    </Text>
                  </Box>
                  <Box 
                    as="button"
                    p={3} 
                    bg="purple.50" 
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="purple.200"
                    _hover={{ bg: 'purple.100', borderColor: 'purple.300' }}
                    transition="all 0.2s"
                    textAlign="left"
                    onClick={() => {
                      const event = new CustomEvent('insertJournalText', { 
                        detail: 'Something interesting that happened today... \n\n' 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <Text fontSize="sm" color="purple.700" fontWeight="medium">
                      ✨ Something interesting that happened...
                    </Text>
                  </Box>
                  <Box 
                    as="button"
                    p={3} 
                    bg="purple.50" 
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="purple.200"
                    _hover={{ bg: 'purple.100', borderColor: 'purple.300' }}
                    transition="all 0.2s"
                    textAlign="left"
                    onClick={() => {
                      const event = new CustomEvent('insertJournalText', { 
                        detail: 'Today I learned that... \n\n' 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <Text fontSize="sm" color="purple.700" fontWeight="medium">
                      📚 Today I learned that...
                    </Text>
                  </Box>
                  <Box 
                    as="button"
                    p={3} 
                    bg="purple.50" 
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="purple.200"
                    _hover={{ bg: 'purple.100', borderColor: 'purple.300' }}
                    transition="all 0.2s"
                    textAlign="left"
                    onClick={() => {
                      const event = new CustomEvent('insertJournalText', { 
                        detail: 'Tomorrow I want to... \n\n' 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <Text fontSize="sm" color="purple.700" fontWeight="medium">
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

          {/* Right Column - Gratitude Stats & Insights */}
          <Stack spacing={6}>
            {/* Stats Cards */}
            <MotionBox
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <VStack spacing={4} align="stretch">
                <Heading size="md" fontFamily={THEME.fonts.serif} fontWeight="400">
                  Your Gratitude Journey ✨
                </Heading>

                <SimpleGrid columns={2} spacing={3}>
                  <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" p={4} borderRadius="xl" color="white">
                    <Text fontSize="xs" opacity={0.9} mb={1}>
                      Streak
                    </Text>
                    <Flex align="baseline" gap={1}>
                      <Heading size="xl">{stats?.current_streak || 0}</Heading>
                      <Text fontSize="lg">🔥</Text>
                    </Flex>
                  </Box>

                  <Box bg="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" p={4} borderRadius="xl" color="white">
                    <Text fontSize="xs" opacity={0.9} mb={1}>
                      This Week
                    </Text>
                    <Flex align="baseline" gap={1}>
                      <Heading size="xl">{stats?.week_count || 0}</Heading>
                      <Text fontSize="lg">📝</Text>
                    </Flex>
                  </Box>

                  <Box bg="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" p={4} borderRadius="xl" color="white">
                    <Text fontSize="xs" opacity={0.9} mb={1}>
                      Total
                    </Text>
                    <Flex align="baseline" gap={1}>
                      <Heading size="xl">{stats?.total_gratitudes || 0}</Heading>
                      <Text fontSize="lg">✨</Text>
                    </Flex>
                  </Box>

                  <Box bg="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" p={4} borderRadius="xl" color="white">
                    <Text fontSize="xs" opacity={0.9} mb={1}>
                      Today
                    </Text>
                    <Flex align="baseline" gap={1}>
                      <Heading size="xl">{stats?.today_gratitude?.gratitude_count || 0}</Heading>
                      <Text fontSize="lg">🌟</Text>
                    </Flex>
                  </Box>
                </SimpleGrid>
              </VStack>
            </MotionBox>

            {/* Category Distribution */}
            {distribution && distribution.length > 0 && (
              <MotionBox
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Box bg="white" p={5} borderRadius="xl" border="1px solid" borderColor={THEME.colors.border}>
                  <Heading size="sm" mb={4}>
                    Top Categories
                  </Heading>
                  <VStack spacing={3} align="stretch">
                    {distribution.slice(0, 5).map((cat) => (
                      <Flex key={cat.category} justify="space-between" align="center">
                        <HStack spacing={2}>
                          <Text fontSize="xl">{categoryEmojis[cat.category] || '✨'}</Text>
                          <Text fontSize="sm" fontWeight="500">
                            {cat.category}
                          </Text>
                        </HStack>
                        <Badge colorScheme="purple" borderRadius="full" px={2}>
                          {cat.percentage?.toFixed(0)}%
                        </Badge>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              </MotionBox>
            )}

            {/* Random Past Gratitude */}
            {randomGratitude && (
              <MotionBox
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Box bg="linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" p={5} borderRadius="xl">
                  <Flex justify="space-between" align="start" mb={3}>
                    <Text fontSize="sm" fontWeight="600" color={THEME.colors.textPrimary}>
                      🌟 Memory Lane
                    </Text>
                    <Button size="xs" variant="ghost" onClick={loadGratitudeData} leftIcon={<RepeatIcon />}>
                      New
                    </Button>
                  </Flex>
                  <Text fontSize="sm" color={THEME.colors.textPrimary} mb={2}>
                    {randomGratitude.item}
                  </Text>
                  {randomGratitude.date && (
                    <Text fontSize="xs" color={THEME.colors.textSecondary}>
                      {format(new Date(randomGratitude.date), 'MMMM d, yyyy')}
                    </Text>
                  )}
                </Box>
              </MotionBox>
            )}
          </Stack>
        </Grid>
      </Container>
    </Box>
  );
}
