import { NavLink, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Box, Button, Flex, Heading, Icon, IconButton, Stack, Text, Tooltip, useColorModeValue } from '@chakra-ui/react';
import { AtSignIcon, CalendarIcon, ChatIcon, HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { logout } from '../services/authService';

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
          variant="ghost"
          colorScheme="red"
          size="lg"
          borderRadius="xl"
          _hover={{
            bg: 'red.900',
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
      variant="ghost"
      colorScheme="red"
      size="lg"
      borderRadius="xl"
      _hover={{
        bg: 'red.900',
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
  
  const sidebarBg = useColorModeValue('white', 'gray.900');
  const sidebarBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const activeBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const activeColor = useColorModeValue('blue.600', 'cyan.200');

  // Lebar sidebar: collapsed = 20 (80px), expanded = 72 (288px)
  // Sidebar width: collapsed = 20 (80px), expanded = 72 (288px)
  const sidebarWidth = isCollapsed ? 20 : 72;

  return (
    <Flex minH="100vh" bgGradient="linear(to-br, gray.900, gray.800)">
      <Box
        as="nav"
        w={{ base: 'full', md: sidebarWidth }}
        borderRight="1px"
        borderColor={sidebarBorder}
        bg={sidebarBg}
        color={useColorModeValue('gray.800', 'whiteAlpha.900')}
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
      >
        <Stack spacing={isCollapsed ? 4 : 8}>
          {/* Header dengan toggle button */}
          {/* Header with toggle button */}
          <Flex align="center" justify={isCollapsed ? 'center' : 'space-between'}>
            {!isCollapsed && (
              <Box>
                <Heading size="md">Mood Journal</Heading>
                <Text fontSize="sm" color={useColorModeValue('gray.500', 'whiteAlpha.700')} mt={1}>
                  Rekam perjalanan emosimu setiap hari
                </Text>
              </Box>
            )}
            <Tooltip label={isCollapsed ? 'Buka sidebar' : 'Tutup sidebar'} placement="right" hasArrow>
              <IconButton
                icon={isCollapsed ? <HamburgerIcon /> : <CloseIcon />}
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                _hover={{ bg: 'whiteAlpha.200' }}
              />
            </Tooltip>
          </Flex>

          <Stack spacing={2}>
            {navItems.map((item) => (
              <NavItem 
                key={item.to} 
                item={item} 
                activeBg={activeBg} 
                activeColor={activeColor} 
                isCollapsed={isCollapsed}
              />
            ))}
          </Stack>
        </Stack>
        <Box mb={2}>
          <LogoutButton isCollapsed={isCollapsed} />
        </Box>
      </Box>

      <Box flex="1" overflow="auto" ml={{ base: 0, md: sidebarWidth }} transition="margin-left 0.3s ease">
        {children}
      </Box>
    </Flex>
  );
}

function NavItem({ item, activeBg, activeColor, isCollapsed }) {
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
              bg={isActive ? activeBg : 'transparent'}
              color={isActive ? activeColor : undefined}
              _hover={{ bg: isActive ? activeBg : 'whiteAlpha.100' }}
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
  activeBg: PropTypes.string.isRequired,
  activeColor: PropTypes.string.isRequired,
  isCollapsed: PropTypes.bool,
};
