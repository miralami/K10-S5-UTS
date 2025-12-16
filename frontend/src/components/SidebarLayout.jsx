import { NavLink, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  IconButton,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { AtSignIcon, CalendarIcon, ChatIcon, HamburgerIcon, CloseIcon, SearchIcon } from '@chakra-ui/icons';
import { logout } from '../services/authService';

// Theme configuration
const THEME = {
  bg: '#FDFCF8',
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  accent: '#805AD5',
  accentLight: '#E9D8FD',
  accentDark: '#6B46C1',
  card: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.06)',
};

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
  {
    label: 'Cari Catatan',
    description: 'Pencarian catatan harianmu',
    to: '/search',
    icon: SearchIcon,
  },
  {
    label: 'Chat Langsung',
    description: 'Ngobrol real-time bersama teman',
    to: '/chat',
    icon: AtSignIcon,
  },
];

function LogoutButton({ isCollapsed }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Jika sidebar collapsed, tampilkan tombol icon saja
  // If sidebar is collapsed, show icon-only button
  if (isCollapsed) {
    return (
      <Tooltip label="Keluar" placement="right" hasArrow>
        <IconButton
          onClick={handleLogout}
          icon={<CloseIcon />}
          variant="solid"
          bg="red.50"
          color="red.500"
          size="lg"
          borderRadius="xl"
          _hover={{
            bg: 'red.100',
            color: 'red.600',
          }}
          aria-label="Keluar"
        />
      </Tooltip>
    );
  }

  return (
    <Button
      onClick={handleLogout}
      width="full"
      variant="solid"
      bg="red.50"
      color="red.500"
      size="lg"
      borderRadius="xl"
      fontWeight="600"
      _hover={{
        bg: 'red.100',
        color: 'red.600',
      }}
    >
      Keluar
    </Button>
  );
}

LogoutButton.propTypes = {
  isCollapsed: PropTypes.bool,
};

export default function SidebarLayout({ children }) {
  // State untuk mengontrol sidebar collapsed/expanded
  // State to control sidebar collapsed/expanded
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Lebar sidebar: collapsed = 20 (80px), expanded = 72 (288px)
  // Sidebar width: collapsed = 20 (80px), expanded = 72 (288px)
  const sidebarWidth = isCollapsed ? 20 : 72;

  return (
    <Flex minH="100vh" bg={THEME.bg}>
      <Box
        as="nav"
        w={{ base: 'full', md: sidebarWidth }}
        borderRight="1px"
        borderColor="gray.200"
        bg={THEME.card}
        color={THEME.textPrimary}
        p={isCollapsed ? 3 : 6}
        minH="100vh"
        position="fixed"
        left={0}
        top={0}
        bottom={0}
        zIndex={100}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        overflow="hidden"
        transition="all 0.3s ease"
        boxShadow={`4px 0 20px ${THEME.shadow}`}
      >
        <Stack spacing={isCollapsed ? 4 : 8}>
          {/* Header dengan toggle button */}
          {/* Header with toggle button */}
          <Flex align="center" justify={isCollapsed ? 'center' : 'space-between'}>
            {!isCollapsed && (
              <Box>
                <Heading size="md" color={THEME.accent}>
                  Mood Journal
                </Heading>
                <Text fontSize="sm" color={THEME.textSecondary} mt={1}>
                  Rekam perjalanan emosimu setiap hari
                </Text>
              </Box>
            )}
            <Tooltip
              label={isCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
              placement="right"
              hasArrow
            >
              <IconButton
                icon={isCollapsed ? <HamburgerIcon /> : <CloseIcon />}
                variant="solid"
                bg="gray.100"
                color="gray.600"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                _hover={{ bg: 'gray.200' }}
              />
            </Tooltip>
          </Flex>

          <Stack spacing={2}>
            {navItems.map((item) => (
              <NavItem key={item.to} item={item} isCollapsed={isCollapsed} />
            ))}
          </Stack>
        </Stack>
        <Box mb={2}>
          <LogoutButton isCollapsed={isCollapsed} />
        </Box>
      </Box>

      <Box
        flex="1"
        overflow="auto"
        ml={{ base: 0, md: sidebarWidth }}
        transition="margin-left 0.3s ease"
      >
        {children}
      </Box>
    </Flex>
  );
}

function NavItem({ item, isCollapsed }) {
  // Jika collapsed, tampilkan icon saja dengan tooltip
  // If collapsed, show icon only with tooltip
  if (isCollapsed) {
    return (
      <NavLink to={item.to} end>
        {({ isActive }) => (
          <Tooltip label={item.label} placement="right" hasArrow>
            <Flex
              align="center"
              justify="center"
              p={3}
              borderRadius="xl"
              transition="all 0.2s"
              bg={isActive ? 'purple.50' : 'transparent'}
              color={isActive ? THEME.accent : THEME.textSecondary}
              _hover={{ bg: isActive ? 'purple.50' : 'gray.100' }}
            >
              <Icon as={item.icon} boxSize={5} />
            </Flex>
          </Tooltip>
        )}
      </NavLink>
    );
  }

  return (
    <NavLink to={item.to} end>
      {({ isActive }) => (
        <Flex
          align="flex-start"
          gap={3}
          p={4}
          borderRadius="xl"
          transition="all 0.2s"
          bg={isActive ? 'purple.50' : 'transparent'}
          color={isActive ? THEME.accent : THEME.textPrimary}
          _hover={{ bg: isActive ? 'purple.50' : 'gray.100' }}
        >
          <Icon
            as={item.icon}
            boxSize={5}
            mt={1}
            color={isActive ? THEME.accent : THEME.textSecondary}
          />
          <Box>
            <Text fontWeight="semibold">{item.label}</Text>
            <Text fontSize="sm" color={isActive ? THEME.accentDark : THEME.textSecondary}>
              {item.description}
            </Text>
          </Box>
        </Flex>
      )}
    </NavLink>
  );
}

SidebarLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

NavItem.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
    description: PropTypes.string,
  }).isRequired,
  isCollapsed: PropTypes.bool,
};
