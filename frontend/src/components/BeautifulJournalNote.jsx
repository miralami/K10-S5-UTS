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

const THEME = {
  colors: {
    bg: '#FDFCF8',
    cardBg: '#FFFFFF',
    textPrimary: '#2D3748',
    textSecondary: '#718096',
    textMuted: '#A0AEC0',
    accent: '#D6BCFA',
    accentHover: '#B794F4',
    warmHighlight: '#F6E05E',
    success: '#68D391',
    border: '#E2E8F0',
  },
  fonts: {
    sans: '"Inter", sans-serif',
    serif: '"Merriweather", serif',
  },
};


const BeautifulJournalNote = ({ selectedDate, onSave }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);

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
    mood: '',
  });

  const moods = [
    { name: 'Calm', emoji: '🍃', color: 'green' },
    { name: 'Happy', emoji: '😊', color: 'yellow' },
    { name: 'Anxious', emoji: '😰', color: 'gray' },
    { name: 'Tired', emoji: '😴', color: 'blue' },
    { name: 'Inspired', emoji: '✨', color: 'purple' },
  ];

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
      if (formData.mood) {
        formDataToSend.append('mood', formData.mood);
      }
      
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
        mood: '',
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


  return (
    <Box 
      as="form" 
      onSubmit={handleSubmit}
      bg="white"
      p={{ base: 6, md: 8 }}
      borderRadius="2xl"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.100"
      maxW="100%"
    >
      <VStack spacing={5} align="stretch">
            {/* Combined Title and Body Box */}
        <Box
          border="1px solid"
          borderColor={THEME.colors.border}
          borderRadius="lg"
          bg="transparent"
          _hover={{ borderColor: THEME.colors.accent }}
          _focusWithin={{ borderColor: THEME.colors.accentHover }}
          transition="all 0.2s"
        >
          <VStack spacing={0} align="stretch">
            {/* Title Section */}
            <Box p={4}>
              {!formData.title && (
                <Text fontSize="xs" color={THEME.colors.textMuted} fontFamily={THEME.fonts.sans} mb={1} fontWeight="500">
                  Title
                </Text>
              )}
              <Input
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Title your day..."
                size="lg"
                bg="transparent"
                color={THEME.colors.textPrimary}
                border="none"
                fontSize="lg"
                fontWeight="600"
                fontFamily={THEME.fonts.sans}
                _focus={{ boxShadow: 'none' }}
                _placeholder={{ color: THEME.colors.textMuted }}
                px={0}
                py={0}
              />
            </Box>

            {/* Divider */}
            <Divider borderColor={THEME.colors.border} />

            {/* Body Section */}
            <Box p={4}>
              {!formData.body && (
                <Text fontSize="xs" color={THEME.colors.textMuted} fontFamily={THEME.fonts.sans} mb={1} fontWeight="500">
                  Content
                </Text>
              )}
              <Textarea
                ref={bodyTextareaRef}
                value={formData.body}
                onChange={(e) => handleChange('body', e.target.value)}
                placeholder="Start writing here..."
                rows={16}
                size="lg"
                bg="transparent"
                color={THEME.colors.textPrimary}
                border="none"
                fontFamily={THEME.fonts.sans}
                _focus={{ boxShadow: 'none' }}
                _placeholder={{ color: THEME.colors.textMuted }}
                resize="none"
                fontSize="md"
                lineHeight="tall"
                px={0}
                py={0}
              />
            </Box>
          </VStack>
        </Box>

        {/* Image Upload Section */}
        <Box>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleImageChange}
            display="none"
          />
          
          {imagePreview ? (
            <Box>
              <AspectRatio ratio={16/9} w="100%" maxH="300px">
                <Image 
                  src={imagePreview} 
                  alt="Journal image" 
                  borderRadius="lg"
                  objectFit="cover"
                  border="1px solid"
                  borderColor={THEME.colors.border}
                />
              </AspectRatio>
              <Button
                mt={3}
                size="sm"
                variant="outline"
                colorScheme="red"
                onClick={handleRemoveImage}
                borderRadius="md"
              >
                Remove Image
              </Button>
            </Box>
          ) : (
            <Box
              border="2px dashed"
              borderColor={THEME.colors.border}
              p={8}
              textAlign="center"
              cursor="pointer"
              onClick={() => fileInputRef.current?.click()}
              _hover={{ borderColor: THEME.colors.accent, bg: THEME.colors.bg }}
              transition="all 0.2s"
            >
              <VStack spacing={2}>
                <AttachmentIcon boxSize={6} color={THEME.colors.accent} />
                <Text fontSize="sm" color={THEME.colors.textSecondary} fontWeight="medium" fontFamily={THEME.fonts.sans}>
                  Click to upload image
                </Text>
                <Text fontSize="xs" color={THEME.colors.textMuted} fontFamily={THEME.fonts.sans}>
                  JPG, PNG, GIF, WEBP (max 5MB)
                </Text>
              </VStack>
            </Box>
          )}
        </Box>

        {/* Bottom Actions */}
        <Flex justify="space-between" align="center" pt={2} borderTop="1px solid" borderColor={THEME.colors.border} mt={4}>
          <Text fontSize="xs" color={THEME.colors.textMuted} fontFamily={THEME.fonts.sans}>
            {formData.body.split(/\s+/).filter(w => w).length} words
          </Text>
          <Button
            type="submit"
            bg={THEME.colors.textPrimary}
            color="white"
            size="sm"
            isLoading={loading}
            loadingText="Saving..."
            borderRadius="md"
            px={6}
            _hover={{ bg: THEME.colors.textSecondary }}
            fontWeight="normal"
            fontFamily={THEME.fonts.sans}
          >
            Save
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

BeautifulJournalNote.propTypes = {
  selectedDate: PropTypes.instanceOf(Date),
  onSave: PropTypes.func,
};

export default BeautifulJournalNote;
