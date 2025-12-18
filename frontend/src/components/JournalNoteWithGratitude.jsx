import React, { useState, useEffect } from 'react';
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { createNote, updateNote, getGratitudePrompts } from '../services/journalService';

const JournalNoteWithGratitude = ({ selectedDate, existingNote, onSave, onCancel }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    gratitude1: '',
    gratitude2: '',
    gratitude3: '',
  });

  useEffect(() => {
    if (existingNote) {
      setFormData({
        title: existingNote.title || '',
        body: existingNote.body || '',
        gratitude1: existingNote.gratitude1 || '',
        gratitude2: existingNote.gratitude2 || '',
        gratitude3: existingNote.gratitude3 || '',
      });
    }
  }, [existingNote]);

  useEffect(() => {
    loadPrompt();
  }, []);

  const loadPrompt = async () => {
    try {
      const prompts = await getGratitudePrompts();
      const allPrompts = Object.values(prompts).flat();
      const randomPrompt = allPrompts[Math.floor(Math.random() * allPrompts.length)];
      setPrompt(randomPrompt);
    } catch (error) {
      console.error('Error loading prompt:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const noteDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      
      const payload = {
        title: formData.title,
        body: formData.body,
        noteDate,
        gratitude1: formData.gratitude1,
        gratitude2: formData.gratitude2,
        gratitude3: formData.gratitude3,
      };

      let result;
      if (existingNote?.id) {
        result = await updateNote(existingNote.id, payload);
      } else {
        result = await createNote(payload);
      }

      toast({
        title: 'Success!',
        description: existingNote ? 'Note updated successfully!' : 'Note created successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

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
    <Box as="form" onSubmit={handleSubmit}>
      <Tabs colorScheme="purple" variant="soft-rounded">
        <TabList mb={4}>
          <Tab>📝 Journal Note</Tab>
          <Tab>
            ✨ Gratitude
            {gratitudeCount > 0 && (
              <Badge ml={2} colorScheme="purple" borderRadius="full">
                {gratitudeCount}
              </Badge>
            )}
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="semibold" color="gray.700" mb={2}>
                  Title (optional)
                </Text>
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Give your entry a title..."
                  borderColor="purple.200"
                  _focus={{ borderColor: 'purple.500' }}
                />
              </Box>

              <Box>
                <Text fontWeight="semibold" color="gray.700" mb={2}>
                  Your thoughts
                </Text>
                <Textarea
                  value={formData.body}
                  onChange={(e) => handleChange('body', e.target.value)}
                  placeholder="Write your journal entry here..."
                  rows={10}
                  borderColor="purple.200"
                  _focus={{ borderColor: 'purple.500' }}
                />
              </Box>
            </VStack>
          </TabPanel>

          <TabPanel px={0}>
            <VStack spacing={4} align="stretch">
              <Box bg="purple.50" p={4} borderRadius="lg" mb={2}>
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="purple.700" fontStyle="italic">
                    💡 {prompt}
                  </Text>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="purple"
                    onClick={loadPrompt}
                  >
                    🎲
                  </Button>
                </Flex>
              </Box>

              <Box>
                <Text fontWeight="semibold" color="gray.700" mb={2}>
                  1. I'm grateful for... <Text as="span" color="gray.400" fontSize="sm">(at least one)</Text>
                </Text>
                <Textarea
                  value={formData.gratitude1}
                  onChange={(e) => handleChange('gratitude1', e.target.value)}
                  placeholder="e.g., Morning coffee with my best friend..."
                  rows={2}
                  maxLength={500}
                  borderColor="purple.200"
                  _focus={{ borderColor: 'purple.500' }}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {formData.gratitude1.length}/500
                </Text>
              </Box>

              <Box>
                <Text fontWeight="semibold" color="gray.700" mb={2}>
                  2. I'm grateful for... <Text as="span" color="gray.400" fontSize="sm">(optional)</Text>
                </Text>
                <Textarea
                  value={formData.gratitude2}
                  onChange={(e) => handleChange('gratitude2', e.target.value)}
                  placeholder="e.g., A good night's sleep..."
                  rows={2}
                  maxLength={500}
                  borderColor="purple.200"
                  _focus={{ borderColor: 'purple.500' }}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {formData.gratitude2.length}/500
                </Text>
              </Box>

              <Box>
                <Text fontWeight="semibold" color="gray.700" mb={2}>
                  3. I'm grateful for... <Text as="span" color="gray.400" fontSize="sm">(optional)</Text>
                </Text>
                <Textarea
                  value={formData.gratitude3}
                  onChange={(e) => handleChange('gratitude3', e.target.value)}
                  placeholder="e.g., Sunny weather today..."
                  rows={2}
                  maxLength={500}
                  borderColor="purple.200"
                  _focus={{ borderColor: 'purple.500' }}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {formData.gratitude3.length}/500
                </Text>
              </Box>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Divider my={6} />

      <HStack spacing={3} justify="flex-end">
        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            isDisabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          bg="purple.500"
          color="white"
          size="lg"
          isLoading={loading}
          _hover={{ bg: 'purple.600' }}
        >
          {existingNote ? 'Update' : 'Save'} Entry
        </Button>
      </HStack>
    </Box>
  );
};

JournalNoteWithGratitude.propTypes = {
  selectedDate: PropTypes.instanceOf(Date),
  existingNote: PropTypes.object,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
};

export default JournalNoteWithGratitude;
