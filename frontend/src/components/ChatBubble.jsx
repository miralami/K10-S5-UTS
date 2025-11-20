import PropTypes from 'prop-types';
import { Box, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

export const ChatBubble = ({ message, isOwn, currentUserName }) => {
  const isSystem = message.type === 'system';
  const sender = message.sender;
  const body = message.text;

  if (isSystem) {
    return (
      <MotionBox
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        textAlign="center"
        w="full"
      >
        <Box
          display="inline-block"
          bg="whiteAlpha.100"
          color="whiteAlpha.700"
          px={4}
          py={2}
          borderRadius="full"
          fontSize="xs"
          border="1px solid"
          borderColor="whiteAlpha.100"
        >
          {body}
        </Box>
      </MotionBox>
    );
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      w="full"
      display="flex"
      justifyContent={isOwn ? 'flex-end' : 'flex-start'}
    >
      <VStack
        align={isOwn ? 'flex-end' : 'flex-start'}
        spacing={1}
        maxW="70%"
      >
        <Box position="relative">
          <Box
            bg={
              isOwn
                ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
                : 'whiteAlpha.200'
            }
            color="white"
            px={4}
            py={3}
            borderRadius={isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px'}
            fontSize="sm"
            boxShadow={isOwn ? '0 4px 15px rgba(6, 182, 212, 0.3)' : 'md'}
          >
            {!isOwn && sender && (
              <Text fontSize="xs" fontWeight="bold" color="cyan.300" mb={1}>
                {sender}
              </Text>
            )}
            <Text>{body}</Text>
          </Box>
          {/* Tail/Arrow */}
          <Box
            position="absolute"
            bottom="0"
            {...(isOwn
              ? {
                  right: '-6px',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '10px solid #3b82f6',
                  transform: 'rotate(45deg)',
                }
              : {
                  left: '-6px',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '10px solid rgba(255, 255, 255, 0.2)',
                  transform: 'rotate(-45deg)',
                })}
          />
        </Box>
        <Text
          fontSize="2xs"
          color="whiteAlpha.400"
          px={1}
        >
          {message.timestamp
            ? message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </Text>
      </VStack>
    </MotionBox>
  );
};

ChatBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['sent', 'received', 'system']).isRequired,
    sender: PropTypes.string,
    timestamp: PropTypes.instanceOf(Date),
  }).isRequired,
  isOwn: PropTypes.bool.isRequired,
  currentUserName: PropTypes.string.isRequired,
};
