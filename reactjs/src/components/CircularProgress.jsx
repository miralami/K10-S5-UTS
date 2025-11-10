import { Box, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const CircularProgress = ({ value, size = 120, strokeWidth = 8, color = "cyan.400" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressValue = Math.min(100, Math.max(0, value * 10)); // Convert 0-10 scale to percentage
  const strokeDashoffset = circumference - (progressValue / 100) * circumference;

  return (
    <Box position="relative" width={`${size}px`} height={`${size}px`}>
      {/* Background circle */}
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <MotionBox
          as="circle"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`var(--chakra-colors-${color})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={circumference}
          style={{
            transformOrigin: "center",
          }}
        />
      </svg>
      {/* Center text */}
      <VStack
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        spacing={0}
      >
        <Text fontSize="2xl" fontWeight="bold" color={color}>
          {value}
        </Text>
        <Text fontSize="xs" color="whiteAlpha.700">
          dari 10
        </Text>
      </VStack>
    </Box>
  );
};

export default CircularProgress;