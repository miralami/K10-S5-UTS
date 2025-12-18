import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  Button,
  VStack,
  Flex,
  Spinner,
  Icon,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { RepeatIcon } from '@chakra-ui/icons';
import { getGratitudePrompts, getRandomGratitude } from '../services/journalService';

const MotionBox = motion(Box);

const THEME = {
  colors: {
    cardBg: '#FFFFFF',
    textPrimary: '#2D3748',
    textSecondary: '#718096',
    accent: '#D6BCFA',
    border: '#E2E8F0',
  },
};

export default function GratitudePromptCard() {
  const [prompt, setPrompt] = useState('');
  const [randomGratitude, setRandomGratitude] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromptAndRandom();
  }, []);

  const loadPromptAndRandom = async () => {
    try {
      setLoading(true);
      const [promptsData, randomData] = await Promise.all([
        getGratitudePrompts(),
        getRandomGratitude(),
      ]);
      
      // Get random prompt from all categories
      const allPrompts = Object.values(promptsData).flat();
      const randomPrompt = allPrompts[Math.floor(Math.random() * allPrompts.length)];
      setPrompt(randomPrompt);
      setRandomGratitude(randomData);
    } catch (error) {
      console.error('Error loading prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="150px">
        <Spinner size="lg" color={THEME.colors.accent} />
      </Flex>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Writing Prompt */}
      <MotionBox
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        bg="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
        p={6}
        borderRadius="2xl"
        boxShadow="0 4px 20px rgba(168, 237, 234, 0.3)"
      >
        <Flex justify="space-between" align="start" mb={3}>
          <Text fontSize="sm" fontWeight="600" color={THEME.colors.textPrimary} opacity={0.8}>
            💭 Writing Prompt
          </Text>
          <Button
            size="xs"
            variant="ghost"
            onClick={loadPromptAndRandom}
            leftIcon={<RepeatIcon />}
            _hover={{ bg: 'whiteAlpha.300' }}
          >
            New
          </Button>
        </Flex>
        <Text fontSize="lg" fontWeight="500" color={THEME.colors.textPrimary} fontStyle="italic">
          "{prompt}"
        </Text>
      </MotionBox>

      {/* Random Past Gratitude */}
      {randomGratitude && (
        <MotionBox
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          bg={THEME.colors.cardBg}
          p={6}
          borderRadius="2xl"
          border={`1px solid ${THEME.colors.border}`}
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.05)"
        >
          <Flex justify="space-between" align="start" mb={3}>
            <Text fontSize="sm" fontWeight="600" color={THEME.colors.textSecondary}>
              🌟 Memory Lane
            </Text>
            <Button
              size="xs"
              variant="ghost"
              onClick={loadPromptAndRandom}
              leftIcon={<RepeatIcon />}
              colorScheme="purple"
            >
              Another
            </Button>
          </Flex>
          <VStack align="stretch" spacing={2}>
            <Text fontSize="md" color={THEME.colors.textPrimary}>
              {randomGratitude.item}
            </Text>
            <Flex gap={2} flexWrap="wrap">
              {randomGratitude.category && (
                <Text fontSize="xs" color={THEME.colors.textSecondary} bg="purple.50" px={2} py={1} borderRadius="md">
                  {randomGratitude.category}
                </Text>
              )}
              {randomGratitude.date && (
                <Text fontSize="xs" color={THEME.colors.textSecondary}>
                  {new Date(randomGratitude.date).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </Text>
              )}
            </Flex>
          </VStack>
        </MotionBox>
      )}
    </VStack>
  );
}
