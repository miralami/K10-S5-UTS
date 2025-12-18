import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  Flex,
  Spinner,
  VStack,
  HStack,
  Badge,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { getGratitudeStats, getGratitudeDistribution, getGratitudeInsights } from '../services/journalService';

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

export default function GratitudeStats() {
  const [stats, setStats] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, distData, insightsData] = await Promise.all([
        getGratitudeStats(),
        getGratitudeDistribution(),
        getGratitudeInsights(),
      ]);
      setStats(statsData);
      setDistribution(distData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error loading gratitude data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" color={THEME.colors.accent} thickness="4px" />
      </Flex>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          p={6}
          borderRadius="2xl"
          color="white"
          boxShadow="0 4px 20px rgba(102, 126, 234, 0.3)"
        >
          <Text fontSize="sm" opacity={0.9} mb={1}>
            Current Streak
          </Text>
          <Flex align="baseline" gap={2}>
            <Heading size="2xl">{stats?.current_streak || 0}</Heading>
            <Text fontSize="lg">🔥</Text>
          </Flex>
          <Text fontSize="xs" opacity={0.8} mt={2}>
            days in a row
          </Text>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          bg="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          p={6}
          borderRadius="2xl"
          color="white"
          boxShadow="0 4px 20px rgba(240, 147, 251, 0.3)"
        >
          <Text fontSize="sm" opacity={0.9} mb={1}>
            This Week
          </Text>
          <Flex align="baseline" gap={2}>
            <Heading size="2xl">{stats?.week_count || 0}</Heading>
            <Text fontSize="lg">📝</Text>
          </Flex>
          <Text fontSize="xs" opacity={0.8} mt={2}>
            gratitude entries
          </Text>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          bg="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          p={6}
          borderRadius="2xl"
          color="white"
          boxShadow="0 4px 20px rgba(79, 172, 254, 0.3)"
        >
          <Text fontSize="sm" opacity={0.9} mb={1}>
            Total Gratitudes
          </Text>
          <Flex align="baseline" gap={2}>
            <Heading size="2xl">{stats?.total_gratitudes || 0}</Heading>
            <Text fontSize="lg">✨</Text>
          </Flex>
          <Text fontSize="xs" opacity={0.8} mt={2}>
            all time
          </Text>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          bg="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          p={6}
          borderRadius="2xl"
          color="white"
          boxShadow="0 4px 20px rgba(67, 233, 123, 0.3)"
        >
          <Text fontSize="sm" opacity={0.9} mb={1}>
            Today
          </Text>
          <Flex align="baseline" gap={2}>
            <Heading size="2xl">{stats?.today_gratitude?.gratitude_count || 0}</Heading>
            <Text fontSize="lg">🌟</Text>
          </Flex>
          <Text fontSize="xs" opacity={0.8} mt={2}>
            items recorded
          </Text>
        </MotionBox>
      </SimpleGrid>

      {/* Category Distribution */}
      {distribution && distribution.length > 0 && (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          bg={THEME.colors.cardBg}
          p={6}
          borderRadius="2xl"
          border={`1px solid ${THEME.colors.border}`}
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.05)"
        >
          <Heading size="md" mb={4} color={THEME.colors.textPrimary}>
            Gratitude Categories
          </Heading>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
            {distribution.slice(0, 6).map((cat, idx) => (
              <MotionBox
                key={cat.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + idx * 0.05 }}
                bg={THEME.colors.bg}
                p={4}
                borderRadius="xl"
                border={`1px solid ${THEME.colors.border}`}
              >
                <Flex justify="space-between" align="center">
                  <HStack spacing={3}>
                    <Text fontSize="2xl">{categoryEmojis[cat.category] || '✨'}</Text>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="600" color={THEME.colors.textPrimary}>
                        {cat.category}
                      </Text>
                      <Text fontSize="sm" color={THEME.colors.textSecondary}>
                        {cat.count} items
                      </Text>
                    </VStack>
                  </HStack>
                  <Badge colorScheme="purple" fontSize="sm" borderRadius="full" px={3}>
                    {cat.percentage?.toFixed(0)}%
                  </Badge>
                </Flex>
              </MotionBox>
            ))}
          </Grid>
        </MotionBox>
      )}

      {/* Insights */}
      {insights && (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          bg="linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
          p={6}
          borderRadius="2xl"
          boxShadow="0 4px 20px rgba(252, 182, 159, 0.3)"
        >
          <Heading size="md" mb={4} color={THEME.colors.textPrimary}>
            💡 Insights
          </Heading>
          <VStack align="stretch" spacing={3}>
            {insights.top_category && (
              <Flex align="center" gap={3}>
                <Text fontSize="2xl">{categoryEmojis[insights.top_category] || '✨'}</Text>
                <Text color={THEME.colors.textPrimary}>
                  You're most grateful for <strong>{insights.top_category}</strong>
                </Text>
              </Flex>
            )}
            {insights.most_active_day && (
              <Flex align="center" gap={3}>
                <Text fontSize="2xl">📅</Text>
                <Text color={THEME.colors.textPrimary}>
                  Most active on <strong>{insights.most_active_day}</strong>
                </Text>
              </Flex>
            )}
            {insights.insights && insights.insights.length > 0 && (
              <VStack align="stretch" spacing={2} mt={2}>
                {insights.insights.map((insight, idx) => (
                  <Text key={idx} fontSize="sm" color={THEME.colors.textSecondary}>
                    • {insight}
                  </Text>
                ))}
              </VStack>
            )}
          </VStack>
        </MotionBox>
      )}
    </VStack>
  );
}
