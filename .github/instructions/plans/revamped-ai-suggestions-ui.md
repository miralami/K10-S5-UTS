# MoodMate UI Design System

> **Version:** 2.0.0  
> **Theme:** Warm Organic Light  
> **Last Updated:** January 2025

## Overview

MoodMate uses a warm, organic, light-themed design language that prioritizes readability, emotional warmth, and visual comfort. This guide provides comprehensive standards for maintaining consistency across all pages and components.

---

## 1. Theme Configuration

All pages should import and use the centralized `THEME` object:

```javascript
const THEME = {
  bg: '#FDFCF8',           // Main page background - warm off-white
  textPrimary: '#2D3748',   // Primary text - dark gray (headings, important text)
  textSecondary: '#718096', // Secondary text - medium gray (descriptions, labels)
  accent: '#805AD5',        // Primary accent - purple (CTAs, active states)
  accentLight: '#E9D8FD',   // Light accent - pale purple (hover states, backgrounds)
  accentDark: '#6B46C1',    // Dark accent - deep purple (pressed states)
  card: '#FFFFFF',          // Card backgrounds - pure white
  cardBorder: '#E2E8F0',    // Card borders - light gray
  shadow: 'rgba(0, 0, 0, 0.06)', // Standard shadow color
  success: '#48BB78',       // Success states - green
  warning: '#ECC94B',       // Warning states - yellow
  error: '#F56565',         // Error states - red
  muted: '#A0AEC0',         // Muted/disabled text
};
```

### When to Use Each Color

| Token | Use Case |
|-------|----------|
| `bg` | Page backgrounds, modal overlays |
| `textPrimary` | Headings, important body text, active navigation |
| `textSecondary` | Descriptions, labels, timestamps, placeholders |
| `accent` | Primary buttons, links, active states, focus rings |
| `accentLight` | Hover backgrounds, selected states, badges |
| `card` | Card backgrounds, dropdown menus, tooltips |
| `cardBorder` | Card borders, dividers, input borders |
| `muted` | Disabled text, inactive icons |

---

## 2. Typography

### Font Family
```javascript
fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
```

### Type Scale

| Element | Size | Weight | Color | Letter Spacing |
|---------|------|--------|-------|----------------|
| Page Title | `2xl-3xl` | `700` (bold) | `textPrimary` | `-0.02em` |
| Section Title | `lg-xl` | `600` (semibold) | `textPrimary` | `0` |
| Card Title | `md-lg` | `600` | `textPrimary` | `0` |
| Body Text | `sm-md` | `400` (normal) | `textPrimary` | `0` |
| Secondary Text | `sm` | `400` | `textSecondary` | `0` |
| Caption/Label | `xs` | `500` (medium) | `textSecondary` | `0.05em` |
| Button Text | `sm` | `600` | varies | `0.02em` |

### Usage Examples

```jsx
// Page Title
<Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="700" color={THEME.textPrimary}>
  Dashboard
</Heading>

// Section Title
<Text fontSize="lg" fontWeight="600" color={THEME.textPrimary}>
  Recent Notes
</Text>

// Body Text
<Text fontSize="md" color={THEME.textPrimary}>
  Your journal entry content goes here.
</Text>

// Secondary/Muted Text
<Text fontSize="sm" color={THEME.textSecondary}>
  Last updated 2 hours ago
</Text>

// Label/Caption
<Text fontSize="xs" fontWeight="500" color={THEME.textSecondary} textTransform="uppercase" letterSpacing="0.05em">
  Mood Category
</Text>
```

---

## 3. Component Standards

### 3.1 WarmCard Component

The standard container for content sections:

```jsx
const WarmCard = ({ children, ...props }) => (
  <Box
    bg={THEME.card}
    borderRadius="2xl"
    border="1px solid"
    borderColor="gray.200"
    boxShadow={`0 4px 20px ${THEME.shadow}`}
    p={{ base: 5, md: 6 }}
    transition="all 0.2s ease"
    _hover={{
      boxShadow: `0 8px 30px rgba(0, 0, 0, 0.08)`,
      transform: 'translateY(-2px)',
    }}
    {...props}
  >
    {children}
  </Box>
);
```

**Key Properties:**
- Border radius: `2xl` (16px)
- Border: `1px solid gray.200`
- Shadow: `0 4px 20px rgba(0, 0, 0, 0.06)`
- Padding: `5` (20px) on mobile, `6` (24px) on desktop
- Hover: Elevated shadow and slight upward transform

### 3.2 Semantic Color Blocks

For content that needs visual categorization:

```jsx
// Reflection/Journal content - Purple
<Box bg="purple.50" borderRadius="xl" p={4}>
  <Text color="gray.700">...</Text>
</Box>

// Mood/Emotion content - Yellow
<Box bg="yellow.50" borderRadius="xl" p={4}>
  <Text color="gray.700">...</Text>
</Box>

// Movie/Suggestion content - Blue
<Box bg="blue.50" borderRadius="xl" p={4}>
  <Text color="gray.700">...</Text>
</Box>

// Success content - Green
<Box bg="green.50" borderRadius="xl" p={4}>
  <Text color="gray.700">...</Text>
</Box>

// Warning content - Orange
<Box bg="orange.50" borderRadius="xl" p={4}>
  <Text color="gray.700">...</Text>
</Box>
```

### 3.3 Buttons

#### Primary Button
```jsx
<Button
  bg={THEME.accent}
  color="white"
  px={6}
  py={3}
  borderRadius="xl"
  fontWeight="600"
  _hover={{
    bg: THEME.accentDark,
    transform: 'translateY(-1px)',
    boxShadow: 'lg',
  }}
  _active={{
    transform: 'translateY(0)',
  }}
  transition="all 0.2s ease"
>
  Save Changes
</Button>
```

#### Secondary/Outline Button
```jsx
<Button
  variant="outline"
  borderColor={THEME.accent}
  color={THEME.accent}
  borderRadius="xl"
  fontWeight="600"
  _hover={{
    bg: THEME.accentLight,
    borderColor: THEME.accentDark,
  }}
>
  Cancel
</Button>
```

#### Icon Button (Always Visible)
```jsx
<IconButton
  icon={<EditIcon />}
  variant="solid"
  bg="gray.100"
  color="gray.500"
  size="sm"
  borderRadius="lg"
  _hover={{
    bg: "gray.200",
    color: "gray.700",
  }}
  aria-label="Edit"
/>
```

**Important:** Always use `variant="solid"` with a visible background for icon buttons. Never use `variant="ghost"` for action buttons as they become invisible.

### 3.4 Form Inputs

```jsx
<Input
  bg={THEME.card}
  border="1px solid"
  borderColor="gray.200"
  borderRadius="xl"
  px={4}
  py={3}
  fontSize="md"
  color={THEME.textPrimary}
  _placeholder={{ color: THEME.textSecondary }}
  _hover={{
    borderColor: 'gray.300',
  }}
  _focus={{
    borderColor: THEME.accent,
    boxShadow: `0 0 0 3px ${THEME.accentLight}`,
    outline: 'none',
  }}
  transition="all 0.2s ease"
/>
```

### 3.5 Tags/Badges

```jsx
// Mood Tag
<Tag
  bg="purple.100"
  color="purple.700"
  borderRadius="full"
  px={3}
  py={1}
  fontSize="sm"
  fontWeight="500"
>
  😊 Happy
</Tag>

// Status Badge
<Badge
  bg="green.100"
  color="green.700"
  borderRadius="full"
  px={2}
  py={0.5}
  fontSize="xs"
  fontWeight="600"
  textTransform="uppercase"
>
  Active
</Badge>
```

### 3.6 Mood Chips (Selectable)

```jsx
<Box
  px={4}
  py={2}
  bg={isSelected ? 'purple.100' : 'gray.50'}
  color={isSelected ? 'purple.700' : 'gray.600'}
  borderRadius="full"
  border="2px solid"
  borderColor={isSelected ? 'purple.400' : 'transparent'}
  cursor="pointer"
  transition="all 0.2s ease"
  _hover={{
    bg: isSelected ? 'purple.100' : 'gray.100',
    transform: 'scale(1.02)',
  }}
>
  <HStack spacing={2}>
    <Text fontSize="lg">{emoji}</Text>
    <Text fontSize="sm" fontWeight="500">{label}</Text>
  </HStack>
</Box>
```

---

## 4. Layout Standards

### 4.1 Page Container

```jsx
<Box minH="100vh" bg={THEME.bg}>
  <Container maxW="container.xl" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
    {/* Page content */}
  </Container>
</Box>
```

### 4.2 Responsive Grid

```jsx
<SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6 }}>
  {/* Grid items */}
</SimpleGrid>
```

### 4.3 Content Sections

```jsx
<VStack spacing={{ base: 6, md: 8 }} align="stretch">
  <SectionOne />
  <SectionTwo />
  <SectionThree />
</VStack>
```

### 4.4 Spacing Scale

| Token | Value | Use Case |
|-------|-------|----------|
| `1` | 4px | Tight inline spacing |
| `2` | 8px | Icon-text gaps, compact lists |
| `3` | 12px | List item spacing |
| `4` | 16px | Card internal padding (tight) |
| `5` | 20px | Card internal padding (standard mobile) |
| `6` | 24px | Card internal padding (standard desktop) |
| `8` | 32px | Section gaps |
| `10` | 40px | Large section gaps |
| `12` | 48px | Page section separators |

---

## 5. Animation Guidelines

### 5.1 Framer Motion Basics

```javascript
import { motion } from 'framer-motion';
const MotionBox = motion(Box);
```

### 5.2 Entry Animations

```jsx
// Fade Up
<MotionBox
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
  {content}
</MotionBox>

// Staggered Children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

<MotionBox variants={containerVariants} initial="hidden" animate="visible">
  {items.map((item, i) => (
    <MotionBox key={i} variants={itemVariants}>
      {item}
    </MotionBox>
  ))}
</MotionBox>
```

### 5.3 Hover Animations

```jsx
<MotionBox
  whileHover={{ 
    scale: 1.02,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)'
  }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 300 }}
>
  {content}
</MotionBox>
```

### 5.4 Floating Orbs (Decorative Background)

```jsx
// Floating decorative orbs
<Box
  position="absolute"
  top="10%"
  right="5%"
  w="200px"
  h="200px"
  bg="purple.100"
  borderRadius="full"
  opacity={0.3}
  filter="blur(40px)"
  pointerEvents="none"
  zIndex={0}
/>
```

### 5.5 Transition Standards

| Property | Duration | Easing | Use Case |
|----------|----------|--------|----------|
| Color/BG | `0.2s` | `ease` | Hover states |
| Transform | `0.2s` | `ease-out` | Scale, translate |
| Box shadow | `0.3s` | `ease` | Elevation changes |
| Page elements | `0.5s` | `easeOut` | Entry animations |
| Stagger delay | `0.1s` | - | List items |

---

## 6. Calendar Component (JournalCalendar)

### Color Configuration

```jsx
// Header navigation buttons
<IconButton
  bg="gray.100"
  color="gray.600"
  _hover={{ bg: 'gray.200' }}
/>

// Month/Year text
<Text color="gray.700" fontWeight="600">
  January 2025
</Text>

// Day headers (Sun, Mon, etc.)
<Text color="gray.500" fontSize="xs" fontWeight="500">
  SUN
</Text>

// Day cells
<Button
  // Normal state
  bg="transparent"
  color="gray.700"
  
  // Hover state
  _hover={{
    bg: 'gray.100',
  }}
  
  // Selected state
  bg={isSelected ? 'purple.500' : 'transparent'}
  color={isSelected ? 'white' : 'gray.700'}
  
  // Has entry indicator
  _after={{
    content: '""',
    position: 'absolute',
    bottom: '4px',
    width: '4px',
    height: '4px',
    borderRadius: 'full',
    bg: 'purple.400',
  }}
  
  // Today indicator
  border={isToday ? '2px solid' : 'none'}
  borderColor="purple.300"
/>
```

---

## 7. Icon Usage

### Icon Library
Use `react-icons` with preference for:
- `FiXxx` - Feather icons (primary)
- `HiXxx` - Heroicons (alternative)

### Icon Sizes

| Context | Size | Example |
|---------|------|---------|
| Inline with text | `sm` (14px) | Labels, badges |
| Button icons | `md` (16px) | Action buttons |
| Feature icons | `lg` (20px) | Card headers |
| Decorative | `xl+` (24px+) | Empty states |

### Icon Colors

```jsx
// Active/Primary
<Icon as={FiEdit} color={THEME.accent} />

// Secondary/Muted
<Icon as={FiClock} color={THEME.textSecondary} />

// In solid button
<Icon as={FiTrash} color="gray.500" _groupHover={{ color: 'red.500' }} />
```

---

## 8. Responsive Breakpoints

```javascript
const breakpoints = {
  base: '0px',      // Mobile first
  sm: '480px',      // Large phones
  md: '768px',      // Tablets
  lg: '992px',      // Small desktops
  xl: '1280px',     // Large desktops
  '2xl': '1536px',  // Extra large
};
```

### Common Responsive Patterns

```jsx
// Font sizes
fontSize={{ base: 'lg', md: 'xl', lg: '2xl' }}

// Spacing
p={{ base: 4, md: 6 }}
gap={{ base: 4, md: 6, lg: 8 }}

// Grid columns
columns={{ base: 1, md: 2, lg: 3 }}

// Show/Hide
display={{ base: 'none', md: 'block' }}

// Container width
maxW={{ base: 'full', md: 'container.md', lg: 'container.xl' }}
```

---

## 9. Do's and Don'ts

### ✅ DO

1. **Use the THEME object** for all colors - ensures consistency
2. **Use WarmCard** for content containers - provides standard styling
3. **Add hover states** to interactive elements - improves UX
4. **Use semantic color blocks** for content categorization
5. **Implement entry animations** for page load polish
6. **Use solid variant** for icon buttons - ensures visibility
7. **Add proper aria-labels** to icon-only buttons
8. **Use responsive values** for spacing and typography
9. **Keep text readable** - minimum `textSecondary` for gray text

### ❌ DON'T

1. **Don't use dark backgrounds** - keep everything light and warm
2. **Don't use `whiteAlpha` colors** - these are for dark themes
3. **Don't use ghost buttons** for important actions - they're invisible
4. **Don't hardcode colors** - use THEME tokens
5. **Don't use pure black** (`#000`) - use `textPrimary` instead
6. **Don't skip hover states** - users expect feedback
7. **Don't use harsh shadows** - keep them soft (`rgba(0,0,0,0.06)`)
8. **Don't over-animate** - subtle is better

---

## 10. Migration Checklist

When updating a page to match this design system:

- [ ] Import and use `THEME` object for all colors
- [ ] Replace dark backgrounds with `THEME.bg`
- [ ] Replace `GlassCard` with `WarmCard`
- [ ] Update all text colors to use `textPrimary`/`textSecondary`
- [ ] Change button variants from ghost to solid where needed
- [ ] Update input styles to match standard
- [ ] Add proper border colors (`gray.200`)
- [ ] Implement entry animations with Framer Motion
- [ ] Add hover states to interactive elements
- [ ] Test calendar colors (if applicable)
- [ ] Verify icon visibility
- [ ] Check responsive behavior

---

## 11. Page-Specific Notes

### Dashboard
- Uses weekly reflection, notes list, and calendar
- Semantic blocks: purple for reflection, yellow for mood, blue for movies
- Notes have edit/delete icon buttons (always visible)

### Home (Daily Entry)
- Large unstyled textarea for journaling
- Mood selector with chips
- Floating decorative orbs in background

### Chat
- Real-time message bubbles
- Light background (`#faf9f7`)
- Typing indicators with animations

### Login/Register
- **NEEDS MIGRATION** - Currently uses old dark theme
- Should use `WarmCard` for form container
- Match input styles to standard

---

## Appendix: Quick Reference

### Essential Imports
```jsx
import { motion } from 'framer-motion';
import { Box, Text, Button, Input, VStack, HStack, SimpleGrid } from '@chakra-ui/react';

const MotionBox = motion(Box);

const THEME = {
  bg: '#FDFCF8',
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  accent: '#805AD5',
  accentLight: '#E9D8FD',
  card: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.06)',
};
```

### Copy-Paste WarmCard
```jsx
const WarmCard = ({ children, ...props }) => (
  <Box
    bg="white"
    borderRadius="2xl"
    border="1px solid"
    borderColor="gray.200"
    boxShadow="0 4px 20px rgba(0, 0, 0, 0.06)"
    p={{ base: 5, md: 6 }}
    transition="all 0.2s ease"
    _hover={{ boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)', transform: 'translateY(-2px)' }}
    {...props}
  >
    {children}
  </Box>
);
```
