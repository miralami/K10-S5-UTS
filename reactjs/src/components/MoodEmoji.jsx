import { Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const moodEmojis = {
  'Sangat Senang': '😊',
  Senang: '🙂',
  Netral: '😐',
  Sedih: '😔',
  'Sangat Sedih': '😢',
  Marah: '😠',
  Bersemangat: '💪',
  Lelah: '😫',
  Stress: '😰',
  Tenang: '😌',
  default: '😶',
};

export default function MoodEmoji({ mood, size = '64px' }) {
  const emoji = moodEmojis[mood] || moodEmojis.default;

  return (
    <MotionBox
      fontSize={size}
      animate={{
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
      display="inline-block"
      transformOrigin="center"
    >
      {emoji}
    </MotionBox>
  );
}
