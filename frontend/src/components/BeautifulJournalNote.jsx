import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  VStack,
  HStack,
  Textarea,
  Input,
  Text,
  Heading,
  Flex,
  useToast,
  Image,
  IconButton,
  AspectRatio,
  useColorModeValue,
  Divider,
  Badge,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react';
import { DeleteIcon, AttachmentIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { format } from 'date-fns';
import { createNote } from '../services/journalService';

const BeautifulJournalNote = ({ selectedDate, onSave }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);
  const { isOpen: isGratitudeOpen, onToggle: onGratitudeToggle } = useDisclosure({ defaultIsOpen: false });

  useEffect(() => {
    const handleInsertText = (event) => {
      const textToInsert = event.detail;
      setFormData(prev => ({
        ...prev,
        body: prev.body + textToInsert
      }));
      // Focus on textarea after insert
      if (bodyTextareaRef.current) {
        bodyTextareaRef.current.focus();
      }
    };

    window.addEventListener('insertJournalText', handleInsertText);
    return () => {
      window.removeEventListener('insertJournalText', handleInsertText);
    };
  }, []);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('purple.200', 'purple.600');
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    gratitude1: '',
    gratitude2: '',
    gratitude3: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Image too large',
          description: 'Please select an image smaller than 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.body && !formData.title && !imageFile) {
      toast({
        title: 'Empty entry',
        description: 'Please write something or add an image',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const noteDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('body', formData.body);
      formDataToSend.append('note_date', noteDate);
      formDataToSend.append('gratitude_1', formData.gratitude1);
      formDataToSend.append('gratitude_2', formData.gratitude2);
      formDataToSend.append('gratitude_3', formData.gratitude3);
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const result = await createNote(formDataToSend);

      toast({
        title: '✨ Saved!',
        description: 'Your journal entry has been saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });

      // Show saved note with image preview if available
      if (result?.data?.imageUrl) {
        console.log('✅ Note saved with image:', result.data.imageUrl);
      }

      // Reset form
      setFormData({
        title: '',
        body: '',
        gratitude1: '',
        gratitude2: '',
        gratitude3: '',
      });
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onSave) {
        onSave(result);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save note',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const gratitudeCount = [formData.gratitude1, formData.gratitude2, formData.gratitude3].filter(g => g).length;

  return (
    <Box 
      as="form" 
      onSubmit={handleSubmit}
      bg="white"
      p={{ base: 6, md: 8 }}
      borderRadius="2xl"
      boxShadow="lg"
      border="1px solid"
      borderColor="purple.100"
      maxW="4xl"
      mx="auto"
    >
      <VStack spacing={6} align="stretch">
        {/* Header with Word Count */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <HStack spacing={3}>
            <Text fontSize="3xl">📝</Text>
            <Box>
              <Heading 
                size="lg" 
                color="purple.700"
                fontWeight="bold"
              >
                Journal Entry
              </Heading>
              <Text fontSize="xs" color="gray.500">
                {formData.body.split(/\s+/).filter(w => w).length} words written
              </Text>
            </Box>
          </HStack>
          <VStack spacing={1} align="end">
            <Badge 
              colorScheme="purple" 
              fontSize="md" 
              px={4} 
              py={2} 
              borderRadius="full"
            >
              {format(selectedDate || new Date(), 'MMM dd, yyyy')}
            </Badge>
            {gratitudeCount > 0 && (
              <HStack spacing={1}>
                <Text fontSize="xs" color="purple.500">✨</Text>
                <Text fontSize="xs" color="purple.600" fontWeight="medium">
                  {gratitudeCount} gratitude{gratitudeCount > 1 ? 's' : ''} added
                </Text>
              </HStack>
            )}
          </VStack>
        </Flex>

        <Divider borderColor="purple.100" />

        {/* Title Input */}
        <Box>
          <Text fontWeight="semibold" color="purple.700" mb={2} fontSize="sm">
            Title (optional)
          </Text>
          <Input
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Give your entry a title..."
            size="lg"
            bg="white"
            color="gray.800"
            borderColor="purple.300"
            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px purple.500', bg: 'white' }}
            _hover={{ borderColor: 'purple.400' }}
            _placeholder={{ color: 'gray.400' }}
            borderRadius="xl"
          />
        </Box>

        {/* Body Textarea */}
        <Box>
          <Text fontWeight="semibold" color="purple.600" mb={2} fontSize="sm">
            What's on your mind?
          </Text>
          <Textarea
            ref={bodyTextareaRef}
            value={formData.body}
            onChange={(e) => handleChange('body', e.target.value)}
            placeholder="Click a suggestion above or start writing your thoughts..."
            rows={12}
            size="lg"
            bg="white"
            color="gray.800"
            borderColor="purple.300"
            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px purple.500', bg: 'white' }}
            _hover={{ borderColor: 'purple.400' }}
            _placeholder={{ color: 'gray.400' }}
            borderRadius="xl"
            resize="vertical"
          />
          <Flex justify="space-between" mt={2}>
            <Text fontSize="xs" color="gray.500">
              💡 Tip: Aim for at least 50 words for a meaningful reflection
            </Text>
            <Text fontSize="xs" color={formData.body.split(/\s+/).filter(w => w).length >= 50 ? 'green.600' : 'gray.500'} fontWeight="medium">
              {formData.body.split(/\s+/).filter(w => w).length >= 50 ? '✓ Great!' : `${formData.body.split(/\s+/).filter(w => w).length}/50`}
            </Text>
          </Flex>
        </Box>

        {/* Gratitude Section */}
        <Box
          border="2px solid"
          borderColor="purple.200"
          borderRadius="xl"
          overflow="hidden"
          bg={gratitudeCount > 0 ? 'purple.50' : 'white'}
          transition="all 0.3s"
        >
          <Flex
            p={4}
            bg={gratitudeCount > 0 ? 'purple.100' : 'purple.50'}
            cursor="pointer"
            onClick={onGratitudeToggle}
            justify="space-between"
            align="center"
            _hover={{ bg: 'purple.100' }}
            transition="all 0.2s"
          >
            <HStack>
              <Text fontSize="xl">✨</Text>
              <Box>
                <Text fontWeight="bold" color="purple.700">
                  Gratitude Journal
                </Text>
                <Text fontSize="xs" color="purple.600">
                  {gratitudeCount === 0 ? 'Add what you\'re grateful for (optional)' : `${gratitudeCount} gratitude${gratitudeCount > 1 ? 's' : ''} added`}
                </Text>
              </Box>
              {gratitudeCount > 0 && (
                <Badge colorScheme="purple" borderRadius="full">
                  {gratitudeCount}
                </Badge>
              )}
            </HStack>
            <IconButton
              icon={isGratitudeOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              variant="ghost"
              colorScheme="purple"
              size="sm"
              aria-label="Toggle gratitude"
            />
          </Flex>

          <Collapse in={isGratitudeOpen} animateOpacity>
            <VStack spacing={4} p={4} bg="purple.50">
              {[1, 2, 3].map((num) => (
                <Box key={num} w="full">
                  <HStack mb={2} justify="space-between">
                    <Text fontSize="sm" fontWeight="semibold" color="purple.700">
                      Gratitude #{num}
                    </Text>
                    {num === 1 && (
                      <Badge colorScheme="purple" fontSize="xs">Optional</Badge>
                    )}
                  </HStack>
                  <Textarea
                    value={formData[`gratitude${num}`]}
                    onChange={(e) => handleChange(`gratitude${num}`, e.target.value)}
                    placeholder={`I'm grateful for...`}
                    rows={2}
                    maxLength={500}
                    bg="white"
                    color="gray.800"
                    borderColor="purple.200"
                    _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px purple.400', bg: 'white' }}
                    _placeholder={{ color: 'gray.400' }}
                    borderRadius="lg"
                    size="sm"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
                    {formData[`gratitude${num}`].length}/500
                  </Text>
                </Box>
              ))}
            </VStack>
          </Collapse>
        </Box>

        {/* Image Upload Section */}
        <Box>
          <Text fontWeight="semibold" color="purple.700" mb={3} fontSize="sm">
            📸 Add a photo (optional)
          </Text>
          
          {imagePreview ? (
            <VStack spacing={3}>
              <AspectRatio ratio={16/9} w="100%" maxH="300px">
                <Image 
                  src={imagePreview} 
                  alt="Journal image" 
                  borderRadius="xl"
                  objectFit="cover"
                  boxShadow="lg"
                />
              </AspectRatio>
              <Button
                leftIcon={<DeleteIcon />}
                colorScheme="red"
                variant="outline"
                onClick={handleRemoveImage}
                borderRadius="full"
                size="sm"
              >
                Remove Image
              </Button>
            </VStack>
          ) : (
            <Box
              border="2px dashed"
              borderColor="purple.300"
              borderRadius="xl"
              p={8}
              textAlign="center"
              cursor="pointer"
              onClick={() => fileInputRef.current?.click()}
              _hover={{
                borderColor: 'purple.500',
                bg: 'purple.50',
              }}
              transition="all 0.3s"
            >
              <VStack spacing={2}>
                <AttachmentIcon boxSize={8} color="purple.400" />
                <Text fontSize="sm" fontWeight="medium" color="purple.700">
                  Click to upload an image
                </Text>
                <Text fontSize="xs" color="gray.500">
                  JPG, PNG, GIF, WEBP (max 5MB)
                </Text>
              </VStack>
            </Box>
          )}
          
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleImageChange}
            display="none"
          />
        </Box>

        <Divider borderColor="purple.100" />

        {/* Submit Button */}
        <Button
          type="submit"
          bg="purple.500"
          color="white"
          size="lg"
          isLoading={loading}
          loadingText="Saving..."
          _hover={{ 
            bg: 'purple.600',
            transform: 'translateY(-2px)',
            boxShadow: 'xl',
          }}
          _active={{ transform: 'scale(0.98)' }}
          borderRadius="full"
          boxShadow="lg"
          leftIcon={<Text fontSize="xl">✨</Text>}
          w="100%"
        >
          Save Journal Entry
        </Button>
      </VStack>
    </Box>
  );
};

BeautifulJournalNote.propTypes = {
  selectedDate: PropTypes.instanceOf(Date),
  onSave: PropTypes.func,
};

export default BeautifulJournalNote;
