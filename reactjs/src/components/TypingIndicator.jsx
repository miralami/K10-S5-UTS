import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, HStack, Text, Flex } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { typingService } from '../services/typingService';

const bounce = keyframes`
  0% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-6px); opacity: 1; }
  100% { transform: translateY(0); opacity: 0.5; }
`;

const TypingIndicator = ({ channelId, currentUserId }) => {
  const [typingUsers, setTypingUsers] = useState(new Map());

  useEffect(() => {
    const handleTypingEvent = (event) => {
      const data = event.detail || event;

      // Ignore own events
      if (data.userId === currentUserId) return;

      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        if (data.isTyping) {
          newMap.set(data.userId, { name: data.userName || 'Unknown', timestamp: Date.now() });
        } else {
          newMap.delete(data.userId);
        }
        return newMap;
      });
    };

    window.addEventListener('typingEvent', handleTypingEvent);
    typingService.startStream(channelId, currentUserId, handleTypingEvent);

    // Remove stale typing users after TTL
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        let changed = false;
        const next = new Map(prev);
        for (const [id, info] of next.entries()) {
          if (now - info.timestamp > 5000) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => {
      window.removeEventListener('typingEvent', handleTypingEvent);
      typingService.endStream();
      clearInterval(interval);
    };
  }, [channelId, currentUserId]);

  const users = Array.from(typingUsers.values()).map((u) => u.name);
  if (users.length === 0) return null;

  const namesText = (() => {
    if (users.length === 1) return `${users[0]} sedang mengetik...`;
    if (users.length === 2) return `${users[0]} dan ${users[1]} sedang mengetik...`;
    return `${users.slice(0, 2).join(', ')} dan lainnya sedang mengetik...`;
  })();

  return (
    <Flex align="center" gap={3} px={2}>
      <HStack spacing={2} align="center">
        <Box display="flex" alignItems="flex-end" gap={1} aria-hidden>
          <Box
            w="6px"
            h="6px"
            bg="gray.300"
            borderRadius="full"
            animation={`${bounce} 1s infinite ease-in-out`}
            style={{ animationDelay: '0s' }}
          />
          <Box
            w="6px"
            h="6px"
            bg="gray.300"
            borderRadius="full"
            animation={`${bounce} 1s infinite ease-in-out`}
            style={{ animationDelay: '0.12s' }}
          />
          <Box
            w="6px"
            h="6px"
            bg="gray.300"
            borderRadius="full"
            animation={`${bounce} 1s infinite ease-in-out`}
            style={{ animationDelay: '0.24s' }}
          />
        </Box>
      </HStack>

      <Box>
        <Text fontSize="sm" color="gray.300">
          {namesText}
        </Text>
      </Box>
    </Flex>
  );
};

TypingIndicator.propTypes = {
  channelId: PropTypes.string.isRequired,
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default TypingIndicator;
