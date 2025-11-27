import PropTypes from 'prop-types';
import { Box, Text, VStack } from '@chakra-ui/react';

export const ChatBubble = ({ message, isOwn, currentUserName, isPrivateChat = false }) => {
  const isSystem = message.type === 'system';
  const sender = message.sender;
  const senderName = typeof sender === 'object' ? sender?.name : sender;
  const body = message.text;
  const showSenderName = !isOwn && senderName && !isPrivateChat;

  if (isSystem) {
    return (
      <Box
        textAlign="center"
        w="full"
      >
        <Box
          display="inline-block"
          bg="gray.200"
          color="gray.600"
          px={4}
          py={2}
          borderRadius="full"
          fontSize="xs"
          border="1px solid"
          borderColor="gray.300"
        >
          {body}
        </Box>
      </Box>
    );
  }

  return (
    <Box
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
            bg={isOwn ? 'teal.500' : 'gray.100'}
            color={isOwn ? 'white' : 'gray.800'}
            px={4}
            py={3}
            borderRadius={isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px'}
            fontSize="sm"
            boxShadow="sm"
            style={{ opacity: 1, visibility: 'visible' }}
          >
            {showSenderName && (
              <Text 
                fontSize="xs" 
                fontWeight="bold" 
                color="teal.600" 
                mb={1}
                style={{ opacity: 1, visibility: 'visible' }}
              >
                {senderName}
              </Text>
            )}
            <Text 
              style={{ color: isOwn ? '#ffffff' : '#1a202c' }}
            >
              {body}
            </Text>
          </Box>
        </Box>
        <Text
          fontSize="xs"
          color="gray.500"
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
    </Box>
  );
};

ChatBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['sent', 'received', 'system']).isRequired,
    sender: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
      }),
    ]),
    timestamp: PropTypes.instanceOf(Date),
  }).isRequired,
  isOwn: PropTypes.bool.isRequired,
  currentUserName: PropTypes.string.isRequired,
  isPrivateChat: PropTypes.bool,
};
