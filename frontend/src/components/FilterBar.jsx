import React from 'react';
import PropTypes from 'prop-types';
import {
    HStack,
    InputGroup,
    InputLeftElement,
    Input,
    Box,
    Menu,
    MenuButton,
    Button,
    Portal,
    MenuList,
    MenuOptionGroup,
    MenuItemOption,
    MenuDivider,
} from '@chakra-ui/react';
import { SearchIcon, TriangleDownIcon } from '@chakra-ui/icons';

export const FilterBar = ({
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    filterPeriod,
    setFilterPeriod,
}) => {
    return (
        <HStack
            bg="whiteAlpha.100"
            p={1}
            borderRadius="full"
            border="1px solid"
            borderColor="whiteAlpha.200"
            spacing={0}
        >
            <InputGroup size="sm" w={{ base: '120px', md: '250px' }}>
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="whiteAlpha.400" />
                </InputLeftElement>
                <Input
                    placeholder="Cari..."
                    variant="unstyled"
                    bg="transparent"
                    _placeholder={{ color: 'whiteAlpha.400' }}
                    color="white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </InputGroup>

            <Box w="1px" h="20px" bg="whiteAlpha.200" mx={2} />

            <Menu closeOnSelect={false}>
                <MenuButton
                    as={Button}
                    rightIcon={<TriangleDownIcon boxSize={2} />}
                    variant="ghost"
                    size="xs"
                    colorScheme="purple"
                    color="whiteAlpha.800"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    _active={{ bg: 'whiteAlpha.300' }}
                    fontWeight="normal"
                    px={2}
                >
                    Filter
                </MenuButton>
                <Portal>
                    <MenuList
                        bg="gray.800"
                        borderColor="whiteAlpha.200"
                        zIndex={1400}
                        boxShadow="xl"
                        p={2}
                    >
                        <MenuOptionGroup
                            title="Urutkan"
                            type="radio"
                            value={sortOption}
                            onChange={setSortOption}
                        >
                            <MenuItemOption value="newest" _hover={{ bg: 'whiteAlpha.100' }} rounded="md">
                                📅 Terbaru
                            </MenuItemOption>
                            <MenuItemOption value="oldest" _hover={{ bg: 'whiteAlpha.100' }} rounded="md">
                                📅 Terlama
                            </MenuItemOption>
                        </MenuOptionGroup>
                        <MenuDivider />
                        <MenuOptionGroup
                            title="Periode"
                            type="radio"
                            value={filterPeriod}
                            onChange={setFilterPeriod}
                        >
                            <MenuItemOption value="all" _hover={{ bg: 'whiteAlpha.100' }} rounded="md">
                                ♾️ Semua Waktu
                            </MenuItemOption>
                            <MenuItemOption value="week" _hover={{ bg: 'whiteAlpha.100' }} rounded="md">
                                📅 7 Hari Terakhir
                            </MenuItemOption>
                            <MenuItemOption value="month" _hover={{ bg: 'whiteAlpha.100' }} rounded="md">
                                🗓️ Bulan Ini
                            </MenuItemOption>
                            <MenuItemOption value="year" _hover={{ bg: 'whiteAlpha.100' }} rounded="md">
                                📅 Tahun Ini
                            </MenuItemOption>
                        </MenuOptionGroup>
                    </MenuList>
                </Portal>
            </Menu>
        </HStack>
    );
};

FilterBar.propTypes = {
    searchQuery: PropTypes.string,
    setSearchQuery: PropTypes.func,
    sortOption: PropTypes.string,
    setSortOption: PropTypes.func,
    filterPeriod: PropTypes.string,
    setFilterPeriod: PropTypes.func,
};
