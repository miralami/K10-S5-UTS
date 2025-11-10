import { Box, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

export default function StyledInfoCard({ label, value, icon, color = 'whiteAlpha.800' }) {
  return (
    <MotionBox
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      bg="rgba(255,255,255,0.1)"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="whiteAlpha.200"
      transition="all 0.2s"
      _hover={{
        bg: "rgba(255,255,255,0.15)",
        borderColor: "whiteAlpha.300",
        boxShadow: "xl"
      }}
    >
      <VStack spacing={3} align="start">
        <Text fontSize="sm" color="whiteAlpha.600">
          {icon} {label}
        </Text>
        <Text color={color} fontWeight="semibold" fontSize="lg">
          {value}
        </Text>
      </VStack>
    </MotionBox>
  );
}