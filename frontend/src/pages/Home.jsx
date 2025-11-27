import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  Textarea,
  useToast,
  Wrap,
  WrapItem,
  Input,
  Tag,
  TagLabel,
  TagCloseButton,
  Tooltip,
} from '@chakra-ui/react';
import { LockIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { createNote } from '../services/journalService';

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

// Moods - Soft & Empathic
const MOOD_OPTIONS = [
  { id: 'calm', label: 'Calm', emoji: '🌿', color: 'green.100', textColor: 'green.800' },
  { id: 'happy', label: 'Happy', emoji: '☀️', color: 'yellow.100', textColor: 'yellow.800' },
  { id: 'anxious', label: 'Anxious', emoji: '☁️', color: 'gray.100', textColor: 'gray.800' },
  { id: 'tired', label: 'Tired', emoji: '🌙', color: 'purple.100', textColor: 'purple.800' },
  { id: 'inspired', label: 'Inspired', emoji: '✨', color: 'orange.100', textColor: 'orange.800' },
];

// Quick Prompts - Contextual
const QUICK_PROMPTS = [
  { id: 'gratitude', label: 'Gratitude', text: 'I am grateful for...' },
  { id: 'intention', label: 'Intention', text: 'Today, I intend to...' },
  { id: 'reflection', label: 'Reflection', text: 'One thing I learned...' },
];

export default function DailyEntry() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [activeMood, setActiveMood] = useState(null);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const toast = useToast();

  // Dynamic Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!body.trim()) {
      setSubmitError('Journal content cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    try {
      // Combine tags into body or handle separately if backend supports it
      // For now, appending tags to body as hashtags for simplicity
      const finalBody = tags.length > 0 ? `${body}\n\n${tags.map(t => `#${t}`).join(' ')}` : body;

      await createNote({
        title: title.trim() || getGreeting(),
        body: finalBody,
        // mood: activeMood?.id // If backend supports mood field
      });

      toast({
        title: 'Saved',
        description: 'Your thought has been captured safely.',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'bottom-right',
      });

      setTitle('');
      setBody('');
      setActiveMood(null);
      setTags([]);
    } catch (error) {
      setSubmitError(error.message || 'Failed to save.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bg={THEME.colors.bg}
      color={THEME.colors.textPrimary}
      fontFamily={THEME.fonts.sans}
      position="relative"
      overflowX="hidden"
    >
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

      <Container maxW="4xl" pt={{ base: 12, md: 20 }} pb={20} position="relative" zIndex={1}>
        <Stack spacing={12}>
          {/* Header Section - Minimal & Welcoming */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
          >
            <Stack spacing={1}>
              <Text fontSize="sm" color={THEME.colors.textSecondary} letterSpacing="wide" textTransform="uppercase">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Heading
                fontSize={{ base: '4xl', md: '5xl' }}
                fontWeight="300" // Light font weight for elegance
                fontFamily={THEME.fonts.serif}
                letterSpacing="-0.02em"
              >
                {getGreeting()}, Afif.
              </Heading>
              <Text fontSize="lg" color={THEME.colors.textSecondary} maxW="2xl" mt={2} lineHeight="tall">
                How is your heart feeling today? Take a moment to breathe and reflect.
              </Text>
            </Stack>
          </MotionBox>

          {/* Main Editor Canvas - Edge-free & Breathable */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Stack spacing={6}>
              {/* Mood Selector - Chips */}
              <Wrap spacing={3} justify="center">
                {MOOD_OPTIONS.map((mood) => {
                  const isActive = activeMood?.id === mood.id;
                  return (
                    <WrapItem key={mood.id}>
                      <Button
                        size="md"
                        borderRadius="full"
                        variant="unstyled"
                        bg={isActive ? mood.color : 'white'}
                        color={isActive ? mood.textColor : 'gray.500'}
                        border="1px solid"
                        borderColor={isActive ? 'transparent' : 'gray.200'}
                        px={5}
                        h="40px"
                        display="flex"
                        alignItems="center"
                        gap={2}
                        onClick={() => setActiveMood(isActive ? null : mood)}
                        boxShadow={isActive ? 'md' : 'sm'}
                        _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
                        _active={{ transform: 'scale(0.98)' }}
                        transition="all 0.2s"
                      >
                        <Text as="span" fontSize="lg">{mood.emoji}</Text>
                        <Text as="span" fontSize="sm" fontWeight="500">{mood.label}</Text>
                      </Button>
                    </WrapItem>
                  );
                })}
              </Wrap>

              {/* The Editor - Card Container */}
              <Box
                bg="white"
                borderRadius="2xl"
                p={{ base: 6, md: 8 }}
                boxShadow="0 4px 20px rgba(0, 0, 0, 0.04)"
                border="1px solid"
                borderColor="gray.100"
              >
                <Input
                  variant="unstyled"
                  placeholder="Title your day..."
                  fontSize="xl"
                  fontWeight="600"
                  color={THEME.colors.textPrimary}
                  mb={6}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  _placeholder={{ color: 'gray.300' }}
                  autoComplete="off"
                  spellCheck="false"
                />
                
                <Textarea
                  variant="unstyled"
                  placeholder="Start writing here..."
                  fontSize="md"
                  lineHeight="1.9"
                  minH="200px"
                  resize="none"
                  color={THEME.colors.textPrimary}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  _placeholder={{ color: 'gray.300' }}
                  autoComplete="off"
                  spellCheck="false"
                />

                {/* Tagging System - Inside the card */}
                {(tags.length > 0 || true) && (
                  <>
                    <Box borderTop="1px solid" borderColor="gray.100" mt={6} mb={4} />
                    <Wrap spacing={2} align="center">
                      {tags.map((tag) => (
                        <WrapItem key={tag}>
                          <Tag
                            size="md"
                            borderRadius="full"
                            variant="subtle"
                            colorScheme="purple"
                            bg="purple.50"
                          >
                            <TagLabel color="purple.600">#{tag}</TagLabel>
                            <TagCloseButton onClick={() => removeTag(tag)} />
                          </Tag>
                        </WrapItem>
                      ))}
                      <WrapItem>
                        <Input
                          placeholder="+ Add tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={handleAddTag}
                          variant="unstyled"
                          w="80px"
                          fontSize="sm"
                          color="gray.500"
                          _placeholder={{ color: 'gray.400' }}
                          autoComplete="off"
                        />
                      </WrapItem>
                    </Wrap>
                  </>
                )}
              </Box>

              {/* Quick Prompts - Inline below card */}
              <HStack
                spacing={3}
                justify="center"
                flexWrap="wrap"
              >
                <Text fontSize="xs" color="gray.500">Quick add:</Text>
                {QUICK_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt.id}
                    size="sm"
                    variant="solid"
                    bg="gray.100"
                    color="gray.600"
                    borderRadius="full"
                    fontWeight="medium"
                    onClick={() => setBody(prev => prev + (prev ? '\n\n' : '') + prompt.text)}
                    _hover={{ bg: 'purple.100', color: 'purple.700' }}
                  >
                    + {prompt.label}
                  </Button>
                ))}
              </HStack>

              {/* Action Area */}
              <HStack justify="space-between" pt={2}>
                <HStack spacing={4} color="gray.400">
                  <Tooltip label="Private & Encrypted" hasArrow placement="top">
                    <Box as="span" display="flex" alignItems="center">
                      <Icon as={LockIcon} boxSize={4} />
                    </Box>
                  </Tooltip>
                  <Text fontSize="xs">Auto-saved</Text>
                </HStack>

                <Button
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  size="lg"
                  bg="gray.900"
                  color="white"
                  borderRadius="full"
                  px={8}
                  fontWeight="500"
                  _hover={{ bg: 'gray.700', transform: 'translateY(-2px)' }}
                  _active={{ transform: 'scale(0.98)' }}
                  transition="all 0.2s"
                  boxShadow="lg"
                >
                  Save Entry
                </Button>
              </HStack>

              {submitError && (
                <Alert status="error" variant="subtle" borderRadius="md">
                  <AlertIcon />
                  {submitError}
                </Alert>
              )}
            </Stack>
          </MotionBox>
        </Stack>
      </Container>
    </Box>
  );
}
