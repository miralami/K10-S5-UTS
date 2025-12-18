import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Stack,
  Text,
  Textarea,
  useToast,
  Input,
  Grid,
  SimpleGrid,
  Flex,
  VStack,
  Badge,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { StarIcon, RepeatIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  createNote, 
  getGratitudeStats, 
  getGratitudeDistribution,
  getGratitudePrompts,
  getRandomGratitude 
} from '../services/journalService';

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
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [gratitude1, setGratitude1] = useState('');
  const [gratitude2, setGratitude2] = useState('');
  const [gratitude3, setGratitude3] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Gratitude stats
  const [stats, setStats] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [randomGratitude, setRandomGratitude] = useState(null);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  useEffect(() => {
    loadGratitudeData();
  }, []);

  const loadGratitudeData = async () => {
    try {
      setLoading(true);
      const [statsData, distData, promptsData, randomData] = await Promise.all([
        getGratitudeStats(),
        getGratitudeDistribution(),
        getGratitudePrompts(),
        getRandomGratitude(),
      ]);
      
      setStats(statsData);
      setDistribution(distData);
      
      const allPrompts = Object.values(promptsData).flat();
      const randomPrompt = allPrompts[Math.floor(Math.random() * allPrompts.length)];
      setPrompt(randomPrompt);
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

  const handleSubmit = async () => {
    if (!body.trim() && !gratitude1.trim()) {
      toast({
        title: 'Error',
        description: 'Please write something in your journal or add at least one gratitude.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createNote({
        title: title.trim() || getGreeting(),
        body: body.trim() || null,
        noteDate: format(new Date(), 'yyyy-MM-dd'),
        gratitude1: gratitude1.trim() || null,
        gratitude2: gratitude2.trim() || null,
        gratitude3: gratitude3.trim() || null,
      });

      toast({
        title: 'Saved! ✨',
        description: 'Your journal entry has been saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setTitle('');
      setBody('');
      setGratitude1('');
      setGratitude2('');
      setGratitude3('');
      
      // Reload stats
      loadGratitudeData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save entry.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const gratitudeCount = [gratitude1, gratitude2, gratitude3].filter(g => g).length;

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
          {/* Left Column - Journal Entry */}
          <Stack spacing={6}>
            {/* Header */}
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

            {/* Editor Card */}
            <MotionBox
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Box bg="white" borderRadius="2xl" p={6} boxShadow="0 4px 20px rgba(0, 0, 0, 0.05)" border="1px solid" borderColor={THEME.colors.border}>
                <Tabs colorScheme="purple" variant="soft-rounded">
                  <TabList mb={4}>
                    <Tab>📝 Journal</Tab>
                    <Tab>
                      ✨ Gratitude
                      {gratitudeCount > 0 && (
                        <Badge ml={2} colorScheme="purple" borderRadius="full">
                          {gratitudeCount}
                        </Badge>
                      )}
                    </Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel px={0}>
                      <VStack spacing={4} align="stretch">
                        <Input
                          variant="unstyled"
                          placeholder="Title your day..."
                          fontSize="xl"
                          fontWeight="600"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          _placeholder={{ color: 'gray.300' }}
                        />
                        <Textarea
                          variant="unstyled"
                          placeholder="Write your thoughts here..."
                          fontSize="md"
                          lineHeight="1.8"
                          minH="300px"
                          resize="none"
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          _placeholder={{ color: 'gray.300' }}
                        />
                      </VStack>
                    </TabPanel>

                    <TabPanel px={0}>
                      <VStack spacing={4} align="stretch">
                        {prompt && (
                          <Box bg="purple.50" p={4} borderRadius="lg" mb={2}>
                            <Flex justify="space-between" align="center">
                              <Text fontSize="sm" color="purple.700" fontStyle="italic">
                                💡 {prompt}
                              </Text>
                              <Button size="xs" variant="ghost" colorScheme="purple" onClick={loadGratitudeData}>
                                🎲
                              </Button>
                            </Flex>
                          </Box>
                        )}

                        <Box>
                          <Text fontWeight="semibold" color={THEME.colors.textPrimary} mb={2}>
                            1. I'm grateful for...
                          </Text>
                          <Textarea
                            value={gratitude1}
                            onChange={(e) => setGratitude1(e.target.value)}
                            placeholder="e.g., Morning coffee with my best friend..."
                            rows={2}
                            maxLength={500}
                            borderColor="purple.200"
                            _focus={{ borderColor: 'purple.500' }}
                          />
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {gratitude1.length}/500
                          </Text>
                        </Box>

                        <Box>
                          <Text fontWeight="semibold" color={THEME.colors.textPrimary} mb={2}>
                            2. I'm grateful for... <Text as="span" color="gray.400" fontSize="sm">(optional)</Text>
                          </Text>
                          <Textarea
                            value={gratitude2}
                            onChange={(e) => setGratitude2(e.target.value)}
                            placeholder="e.g., A good night's sleep..."
                            rows={2}
                            maxLength={500}
                            borderColor="purple.200"
                            _focus={{ borderColor: 'purple.500' }}
                          />
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {gratitude2.length}/500
                          </Text>
                        </Box>

                        <Box>
                          <Text fontWeight="semibold" color={THEME.colors.textPrimary} mb={2}>
                            3. I'm grateful for... <Text as="span" color="gray.400" fontSize="sm">(optional)</Text>
                          </Text>
                          <Textarea
                            value={gratitude3}
                            onChange={(e) => setGratitude3(e.target.value)}
                            placeholder="e.g., Sunny weather today..."
                            rows={2}
                            maxLength={500}
                            borderColor="purple.200"
                            _focus={{ borderColor: 'purple.500' }}
                          />
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {gratitude3.length}/500
                          </Text>
                        </Box>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>

                <Divider my={6} />

                <Flex justify="flex-end">
                  <Button
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    size="lg"
                    bg="purple.500"
                    color="white"
                    borderRadius="full"
                    px={8}
                    _hover={{ bg: 'purple.600', transform: 'translateY(-2px)' }}
                    _active={{ transform: 'scale(0.98)' }}
                    boxShadow="lg"
                  >
                    Save Entry
                  </Button>
                </Flex>
              </Box>
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
