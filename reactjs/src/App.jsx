import { useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
  Link,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { getRecommendations } from './services/recommendationService';
import { searchMovies } from './services/movieSearchService';

const DEFAULT_MOOD = 'Saya ingin film yang hangat dan membangkitkan semangat.';
const TOOL_RECOMMENDATIONS = 'recommendations';
const TOOL_SEARCH = 'search';

function App() {
  const [mood, setMood] = useState(DEFAULT_MOOD);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasFetched, setHasFetched] = useState(false);
  const [activeTool, setActiveTool] = useState(TOOL_RECOMMENDATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchTotalResults, setSearchTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchHasFetched, setSearchHasFetched] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!mood.trim()) {
      setError('Deskripsi mood tidak boleh kosong.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const movies = await getRecommendations(mood);
      setRecommendations(movies);
      setHasFetched(true);
    } catch (fetchError) {
      setError(fetchError.message || 'Terjadi kesalahan saat mengambil rekomendasi.');
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();

    if (!searchQuery.trim()) {
      setSearchError('Judul film tidak boleh kosong.');
      return;
    }

    if (searchYear && !/^\d{4}$/.test(searchYear)) {
      setSearchError('Tahun rilis harus terdiri dari 4 digit.');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchHasFetched(false);
    setSearchResults([]);
    setSearchTotalResults(0);

    try {
      const { results, totalResults } = await searchMovies({
        query: searchQuery,
        type: searchType || undefined,
        year: searchYear || undefined,
        page: 1,
      });

      setSearchResults(results);
      setSearchTotalResults(totalResults);
      setSearchHasFetched(true);
    } catch (fetchError) {
      setSearchError(fetchError.message || 'Terjadi kesalahan saat mencari film.');
      setSearchResults([]);
      setSearchTotalResults(0);
      setSearchHasFetched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchYearChange = (event) => {
    const nextValue = event.target.value;
    if (nextValue === '' || /^\d{0,4}$/.test(nextValue)) {
      setSearchYear(nextValue);
    }
  };

  const getPrimaryWatchProvider = (providers = []) => {
    if (!providers.length) {
      return null;
    }

    const preferredOrder = ['Netflix', 'Disney+', 'Prime Video'];
    const preferredProvider = providers.find((item) => preferredOrder.includes(item.provider));
    return preferredProvider || providers[0];
  };

  const activeResults = activeTool === TOOL_RECOMMENDATIONS ? recommendations : searchResults;
  const activeLoading = activeTool === TOOL_RECOMMENDATIONS ? isLoading : isSearching;
  const activeHasFetched = activeTool === TOOL_RECOMMENDATIONS ? hasFetched : searchHasFetched;
  const activeErrorMessage = activeTool === TOOL_RECOMMENDATIONS ? error : searchError;

  const loadingMessage =
    activeTool === TOOL_RECOMMENDATIONS
      ? 'Mengumpulkan rekomendasi untukmu...'
      : 'Mengambil data dari OMDB...';

  const emptyMessage =
    activeTool === TOOL_RECOMMENDATIONS
      ? 'Belum ada rekomendasi untuk mood tersebut.'
      : 'Tidak menemukan judul yang cocok.';

  const summaryMessage = useMemo(() => {
    if (!activeResults.length) {
      return null;
    }

    if (activeTool === TOOL_RECOMMENDATIONS) {
      return `Menampilkan ${activeResults.length} rekomendasi pilihan.`;
    }

    return `Menampilkan ${activeResults.length} dari ${searchTotalResults} hasil.`;
  }, [activeResults.length, activeTool, searchTotalResults]);

  const renderMovieCard = (movie) => (
    <MovieCard
      key={movie.id || movie.imdbId || movie.title}
      movie={movie}
      variant={activeTool}
      getPrimaryWatchProvider={getPrimaryWatchProvider}
    />
  );

  return (
    <Box minH="100vh" bgGradient="linear(to-br, #0f172a, #1e293b)" py={{ base: 10, md: 16 }}>
      <Container maxW="6xl">
        <VStack spacing={12} align="stretch">
          <Box
            bg="rgba(15, 23, 42, 0.75)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="3xl"
            shadow="xl"
            px={{ base: 6, md: 10 }}
            py={{ base: 8, md: 10 }}
          >
            <VStack align="start" spacing={8} color="whiteAlpha.900">
              <Heading size="xl">Temukan Film untuk Segala Situasi</Heading>
              <ButtonGroup
                isAttached
                variant="outline"
                colorScheme="blue"
                borderRadius="full"
                bg="whiteAlpha.100"
                p="0.5"
              >
                <Button
                  onClick={() => setActiveTool(TOOL_RECOMMENDATIONS)}
                  variant={activeTool === TOOL_RECOMMENDATIONS ? 'solid' : 'ghost'}
                  colorScheme="cyan"
                  borderRadius="full"
                >
                  Rekomendasi Mood
                </Button>
                <Button
                  onClick={() => setActiveTool(TOOL_SEARCH)}
                  variant={activeTool === TOOL_SEARCH ? 'solid' : 'ghost'}
                  colorScheme="cyan"
                  borderRadius="full"
                >
                  Cari Judul
                </Button>
              </ButtonGroup>

              {activeTool === TOOL_RECOMMENDATIONS ? (
                <Stack spacing={6} w="full">
                  <Text color="whiteAlpha.800">
                    Masukkan mood atau suasana hati kamu. Kami akan meminta model bahasa lalu menyusun 3-5
                    rekomendasi yang relevan lengkap dengan ringkasan dan tautan tontonan.
                  </Text>
                  <VStack as="form" spacing={4} align="stretch" onSubmit={handleSubmit}>
                    <Box>
                      <Text mb={2} fontWeight="semibold" color="whiteAlpha.800">
                        Mood kamu hari ini
                      </Text>
                      <Textarea
                        value={mood}
                        onChange={(event) => setMood(event.target.value)}
                        placeholder="Contoh: Butuh film yang bikin semangat lagi tapi tetap ringan."
                        rows={4}
                        bg="whiteAlpha.100"
                        borderColor="whiteAlpha.300"
                        _hover={{ borderColor: 'cyan.300' }}
                        _focus={{ borderColor: 'cyan.300', boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.6)' }}
                        isDisabled={isLoading}
                      />
                    </Box>
                    <Button
                      alignSelf="flex-start"
                      type="submit"
                      colorScheme="cyan"
                      isLoading={isLoading}
                      loadingText="Mencari..."
                    >
                      Dapatkan rekomendasi
                    </Button>
                  </VStack>
                  {error ? (
                    <Alert status="error" variant="left-accent" borderRadius="lg">
                      <AlertIcon />
                      {error}
                    </Alert>
                  ) : null}
                </Stack>
              ) : (
                <Stack spacing={6} w="full">
                  <Text color="whiteAlpha.800">
                    Gunakan katalog OMDB untuk menemukan film, serial, atau episode berdasarkan judul. Tambahkan
                    filter tipe dan tahun rilis jika diperlukan.
                  </Text>
                  <VStack as="form" spacing={4} align="stretch" onSubmit={handleSearchSubmit}>
                    <Box>
                      <Text mb={2} fontWeight="semibold" color="whiteAlpha.800">
                        Judul film
                      </Text>
                      <HStack spacing={3} align="stretch" flexDir={{ base: 'column', md: 'row' }}>
                        <Input
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder="Contoh: The Matrix"
                          bg="whiteAlpha.100"
                          borderColor="whiteAlpha.300"
                          _hover={{ borderColor: 'cyan.300' }}
                          _focus={{ borderColor: 'cyan.300', boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.6)' }}
                          isDisabled={isSearching}
                        />
                        <Button
                          type="submit"
                          colorScheme="cyan"
                          minW={{ base: '100%', md: 'auto' }}
                          isLoading={isSearching}
                          loadingText="Mencari..."
                        >
                          Cari film
                        </Button>
                      </HStack>
                    </Box>
                    <HStack spacing={3} flexDir={{ base: 'column', md: 'row' }} align="stretch">
                      <Box flex="1">
                        <Text mb={2} fontWeight="semibold" color="whiteAlpha.800">
                          Jenis
                        </Text>
                        <Select
                          value={searchType}
                          onChange={(event) => setSearchType(event.target.value)}
                          bg="whiteAlpha.100"
                          borderColor="whiteAlpha.300"
                          isDisabled={isSearching}
                        >
                          <option value="">Semua</option>
                          <option value="movie">Film</option>
                          <option value="series">Serial</option>
                          <option value="episode">Episode</option>
                        </Select>
                      </Box>
                      <Box flex="1">
                        <Text mb={2} fontWeight="semibold" color="whiteAlpha.800">
                          Tahun rilis
                        </Text>
                        <Input
                          value={searchYear}
                          onChange={handleSearchYearChange}
                          placeholder="Contoh: 1999"
                          inputMode="numeric"
                          pattern="\d{4}"
                          maxLength={4}
                          bg="whiteAlpha.100"
                          borderColor="whiteAlpha.300"
                          _hover={{ borderColor: 'cyan.300' }}
                          _focus={{ borderColor: 'cyan.300', boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.6)' }}
                          isDisabled={isSearching}
                        />
                      </Box>
                    </HStack>
                    {searchError ? (
                      <Alert status="error" variant="left-accent" borderRadius="lg">
                        <AlertIcon />
                        {searchError}
                      </Alert>
                    ) : null}
                  </VStack>
                </Stack>
              )}
            </VStack>
          </Box>

          <Box
            bg="rgba(15, 23, 42, 0.65)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="3xl"
            px={{ base: 6, md: 10 }}
            py={{ base: 8, md: 10 }}
            color="whiteAlpha.900"
          >
            <Stack spacing={6}>
              {activeLoading ? (
                <HStack spacing={3} color="whiteAlpha.800">
                  <Spinner color="cyan.300" />
                  <Text>{loadingMessage}</Text>
                </HStack>
              ) : null}

              {!activeLoading && activeErrorMessage ? (
                <Alert status="error" variant="left-accent" borderRadius="lg">
                  <AlertIcon />
                  {activeErrorMessage}
                </Alert>
              ) : null}

              {!activeLoading && activeHasFetched && !activeResults.length && !activeErrorMessage ? (
                <Text color="whiteAlpha.700">{emptyMessage}</Text>
              ) : null}

              {summaryMessage ? (
                <Box
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  borderRadius="2xl"
                  bg="whiteAlpha.100"
                  px={5}
                  py={3}
                >
                  <Text color="whiteAlpha.800">{summaryMessage}</Text>
                </Box>
              ) : null}

              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
                {activeResults.map((movie) => renderMovieCard(movie))}
              </SimpleGrid>
            </Stack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

function MovieCard({ movie, variant, getPrimaryWatchProvider }) {
  const isRecommendation = variant === TOOL_RECOMMENDATIONS;
  const primaryProvider = isRecommendation ? getPrimaryWatchProvider(movie.watchProviders) : null;

  return (
    <Box
      bg="rgba(15, 23, 42, 0.75)"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="2xl"
      overflow="hidden"
      shadow="lg"
    >
      {movie.posterUrl ? (
        <Image src={movie.posterUrl} alt={movie.title} objectFit="cover" w="100%" h="360px" />
      ) : (
        <Flex
          align="center"
          justify="center"
          w="100%"
          h="360px"
          bg="whiteAlpha.100"
          fontSize="3xl"
        >
          <Text>🎬</Text>
        </Flex>
      )}

      <VStack align="stretch" spacing={4} px={5} py={6} color="whiteAlpha.900">
        <Stack spacing={2}>
          <Heading size="md">{movie.title}</Heading>
          {isRecommendation && movie.letterboxdUrl ? (
            <Link href={movie.letterboxdUrl} isExternal color="cyan.200" fontWeight="semibold">
              Lihat di Letterboxd ↗
            </Link>
          ) : null}
        </Stack>

        {isRecommendation ? (
          <Stack spacing={4}>
            {movie.overview ? (
              <Text color="whiteAlpha.800" fontSize="sm">
                {movie.overview}
              </Text>
            ) : null}

            {primaryProvider ? (
              <Button as={Link} href={primaryProvider.url} isExternal colorScheme="cyan">
                Tonton sekarang di {primaryProvider.provider}
              </Button>
            ) : null}

            {!primaryProvider && movie.watchProviders?.length ? (
              <Wrap spacing={2}>
                {movie.watchProviders.map((provider) => (
                  <WrapItem key={provider.provider}>
                    <Button as={Link} href={provider.url} isExternal size="sm" variant="outline" colorScheme="cyan">
                      {provider.provider}
                    </Button>
                  </WrapItem>
                ))}
              </Wrap>
            ) : null}
          </Stack>
        ) : (
          <Stack spacing={4}>
            <HStack spacing={2}>
              <Badge colorScheme="cyan">{movie.year || 'TBA'}</Badge>
              {movie.type ? <Badge colorScheme="purple">{capitalize(movie.type)}</Badge> : null}
            </HStack>
            {movie.imdbUrl ? (
              <Button as={Link} href={movie.imdbUrl} isExternal colorScheme="cyan" variant="outline">
                Lihat di IMDb
              </Button>
            ) : null}
          </Stack>
        )}
      </VStack>
    </Box>
  );
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default App;
