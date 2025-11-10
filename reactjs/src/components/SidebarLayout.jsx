import { NavLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { CalendarIcon, ChatIcon } from '@chakra-ui/icons';

const navItems = [
  {
    label: 'Catatan Hari Ini',
    description: 'Tulis jurnal harianmu',
    to: '/',
    icon: ChatIcon,
  },
  {
    label: 'Dashboard Jurnal',
    description: 'Ringkasan mingguan & semua catatan',
    to: '/dashboard',
    icon: CalendarIcon,
  },
];

export default function SidebarLayout({ children }) {
  const sidebarBg = useColorModeValue('white', 'gray.900');
  const sidebarBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const activeBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const activeColor = useColorModeValue('blue.600', 'cyan.200');

  return (
    <Flex minH="100vh" bgGradient="linear(to-br, gray.900, gray.800)">
      <Box
        as="nav"
        w={{ base: 'full', md: 72 }}
        borderRight="1px"
        borderColor={sidebarBorder}
        bg={sidebarBg}
        color={useColorModeValue('gray.800', 'whiteAlpha.900')}
        p={6}
      >
        <Stack spacing={8}>
          <Box>
            <Heading size="md">Mood Journal</Heading>
            <Text fontSize="sm" color={useColorModeValue('gray.500', 'whiteAlpha.700')} mt={1}>
              Rekam perjalanan emosimu setiap hari
            </Text>
          </Box>

          <Stack spacing={2}>
            {navItems.map((item) => (
              <NavItem key={item.to} item={item} activeBg={activeBg} activeColor={activeColor} />
            ))}
          </Stack>
        </Stack>
      </Box>

      <Box flex="1" overflow="auto">
        {children}
      </Box>
    </Flex>
  );
}

function NavItem({ item, activeBg, activeColor }) {
  return (
    <NavLink to={item.to} end>
      {({ isActive }) => (
        <Flex
          align="flex-start"
          gap={3}
          p={4}
          borderRadius="xl"
          transition="all 0.2s"
          bg={isActive ? activeBg : 'transparent'}
          color={isActive ? activeColor : undefined}
          _hover={{ bg: isActive ? activeBg : 'whiteAlpha.100' }}
        >
          <Icon as={item.icon} boxSize={5} mt={1} />
          <Box>
            <Text fontWeight="semibold">{item.label}</Text>
            <Text fontSize="sm" color={isActive ? activeColor : 'whiteAlpha.700'}>
              {item.description}
            </Text>
          </Box>
        </Flex>
      )}
    </NavLink>
  );
}
