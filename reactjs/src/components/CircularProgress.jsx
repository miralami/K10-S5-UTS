import { Box, Text, VStack, useToken } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionCircle = motion.circle;

const CircularProgress = ({ value, size = 120, strokeWidth = 8, color = 'cyan.400' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Assume value is already 0-100
  const progressValue = Math.min(100, Math.max(0, value || 0));
  const strokeDashoffset = circumference - (progressValue / 100) * circumference;

  // Resolve Chakra color token (e.g. 'cyan.400') to actual color value for SVG stroke
  const [resolvedColor] = useToken('colors', [color]);
  const strokeColor = resolvedColor || '#00bcd4';

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
        <MotionCircle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={circumference}
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
          {Math.round(value || 0)}
        </Text>
        <Text fontSize="xs" color="whiteAlpha.700">
          dari 100
        </Text>
      </VStack>
    </Box>
  );
};

export default CircularProgress;
