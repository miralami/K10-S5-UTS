import {
  Box,
  Image,
  VStack,
  Heading,
  Text,
  Button,
  Link,
  Badge,
  HStack,
  Wrap,
  WrapItem,
  Flex
} from '@chakra-ui/react';

// lightweight SVG fallback used when poster fails to load or is aborted
const POSTER_FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 900'>" +
    "<rect width='100%' height='100%' fill='%23101720'/>" +
    "<text x='50%' y='50%' fill='%23a3a3a3' font-size='28' text-anchor='middle' dominant-baseline='middle'>No Image</text>" +
  "</svg>"
);

const MovieCard = ({ movie, variant, getPrimaryWatchProvider }) => {
  const isRecommendation = variant === 'recommendations';
  const primaryProvider = isRecommendation ? getPrimaryWatchProvider(movie.watchProviders) : null;

  return (
    <Box
      className="movie-card"
      role="group"
    >
      {movie.posterUrl ? (
        <Box overflow="hidden">
          <Image 
            src={movie.posterUrl} 
            alt={movie.title} 
            objectFit="cover" 
            w="100%" 
            h="360px"
            transition="transform 0.3s ease"
            _groupHover={{ transform: 'scale(1.05)' }}
            loading="lazy"
            decoding="async"
            fallbackSrc={POSTER_FALLBACK}
          />
        </Box>
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

      <VStack 
        align="stretch" 
        spacing={4} 
        p={6} 
        bg="rgba(15, 23, 42, 0.95)"
      >
        <VStack align="stretch" spacing={2}>
          <Heading size="md" noOfLines={2}>
            {movie.title}
          </Heading>
          {isRecommendation && movie.letterboxdUrl && (
            <Link 
              href={movie.letterboxdUrl} 
              isExternal 
              color="cyan.200" 
              fontSize="sm"
              fontWeight="semibold"
              _hover={{ textDecoration: 'none', color: 'cyan.100' }}
            >
              Lihat di Letterboxd ↗
            </Link>
          )}
        </VStack>

        {isRecommendation ? (
          <VStack align="stretch" spacing={4}>
            {movie.overview && (
              <Text 
                color="whiteAlpha.800" 
                fontSize="sm" 
                noOfLines={3}
                lineHeight="1.6"
              >
                {movie.overview}
              </Text>
            )}

            {primaryProvider && (
              <Button
                as={Link}
                href={primaryProvider.url}
                isExternal
                colorScheme="cyan"
                size="md"
                width="full"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg'
                }}
              >
                Tonton di {primaryProvider.provider}
              </Button>
            )}

            {!primaryProvider && movie.watchProviders?.length > 0 && (
              <Wrap spacing={2}>
                {movie.watchProviders.map((provider) => (
                  <WrapItem key={provider.provider}>
                    <Button
                      as={Link}
                      href={provider.url}
                      isExternal
                      size="sm"
                      variant="outline"
                      colorScheme="cyan"
                      _hover={{
                        bg: 'whiteAlpha.200'
                      }}
                    >
                      {provider.provider}
                    </Button>
                  </WrapItem>
                ))}
              </Wrap>
            )}
          </VStack>
        ) : (
          <VStack align="stretch" spacing={4}>
            <HStack spacing={2}>
              <Badge colorScheme="cyan">
                {movie.year || 'TBA'}
              </Badge>
              {movie.type && (
                <Badge colorScheme="purple">
                  {movie.type.charAt(0).toUpperCase() + movie.type.slice(1)}
                </Badge>
              )}
            </HStack>
            {movie.imdbUrl && (
              <Button
                as={Link}
                href={movie.imdbUrl}
                isExternal
                colorScheme="cyan"
                variant="outline"
                size="sm"
                _hover={{
                  bg: 'whiteAlpha.200'
                }}
              >
                Lihat di IMDb
              </Button>
            )}
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default MovieCard;