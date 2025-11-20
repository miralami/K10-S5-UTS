import { Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

export const GlassCard = ({ children, hover = true, ...props }) => (
  <MotionBox
    bg="rgba(15, 23, 42, 0.75)"
    borderRadius="2xl"
    p={6}
    border="1px solid"
    borderColor="whiteAlpha.200"
    backdropFilter="blur(12px)"
    transition="all 0.2s"
    {...(hover && {
      _hover: {
        bg: 'rgba(15, 23, 42, 0.85)',
        borderColor: 'whiteAlpha.300',
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
      },
    })}
    {...props}
  >
    {children}
  </MotionBox>
);
