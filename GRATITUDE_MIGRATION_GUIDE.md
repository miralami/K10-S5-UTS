# Gratitude Feature Migration Guide

## Overview
The gratitude feature has been successfully merged into the journal note feature. Users can now add gratitude entries alongside their regular journal notes in a unified interface.

## What Changed

### Backend Changes

#### 1. Database Schema
- **Added gratitude fields to `journal_notes` table:**
  - `gratitude_1` (text, nullable)
  - `gratitude_2` (text, nullable)
  - `gratitude_3` (text, nullable)
  - `gratitude_category_1` (string, nullable)
  - `gratitude_category_2` (string, nullable)
  - `gratitude_category_3` (string, nullable)

- **Removed tables:**
  - `gratitudes`
  - `gratitude_categories`

#### 2. Models
- **Enhanced `JournalNote` model** with:
  - Gratitude accessors (`getGratitudesAttribute`, `getGratitudeCategoriesAttribute`)
  - Gratitude count accessor (`getGratitudeCountAttribute`)
  - Auto-categorization method (`detectGratitudeCategory`)

- **Removed models:**
  - `Gratitude`
  - `GratitudeCategory`

#### 3. Controllers
- **Enhanced `JournalNoteController`** with new methods:
  - `gratitudeStats()` - Get gratitude statistics
  - `gratitudeDistribution()` - Get category distribution
  - `gratitudeInsights()` - Get insights and analytics
  - `randomGratitude()` - Get random gratitude for reflection
  - `gratitudePrompts()` - Get writing prompts

- **Removed:**
  - `GratitudeController`

#### 4. Routes
- **New routes under `/api/journal/gratitude/`:**
  - `GET /journal/gratitude/stats`
  - `GET /journal/gratitude/distribution`
  - `GET /journal/gratitude/insights`
  - `GET /journal/gratitude/random`
  - `GET /journal/gratitude/prompts`

- **Removed routes:**
  - All `/api/gratitudes/*` routes

### Frontend Changes

#### 1. Components
- **Created:** `JournalNoteWithGratitude.jsx` - Unified component with tabs for journal and gratitude
- **Removed:** `GratitudeJournal.jsx`

#### 2. Services
- **Enhanced `journalService.js`** with:
  - Gratitude-related API functions
  - Updated `createNote` and `updateNote` to support gratitude fields

## Migration Steps

### 1. Run Migrations
```bash
cd backend
php artisan migrate
```

This will:
- Add gratitude fields to `journal_notes` table
- Drop old `gratitudes` and `gratitude_categories` tables

### 2. (Optional) Seed Sample Data
```bash
php artisan db:seed --class=JournalNotesWithGratitudeSeeder
```

This creates 30 days of sample journal notes with gratitude entries.

### 3. Clear Cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

## API Usage Examples

### Creating a Journal Note with Gratitude
```javascript
POST /api/journal/notes
{
  "title": "A Great Day",
  "body": "Today was wonderful...",
  "note_date": "2025-12-17",
  "gratitude_1": "Morning coffee with friends",
  "gratitude_2": "Beautiful weather",
  "gratitude_3": "Completed my project"
}
```

### Getting Gratitude Statistics
```javascript
GET /api/journal/gratitude/stats

Response:
{
  "today_gratitude": {...},
  "week_count": 5,
  "total_gratitudes": 23,
  "current_streak": 3
}
```

### Getting Category Distribution
```javascript
GET /api/journal/gratitude/distribution

Response: [
  {
    "category": "Friends",
    "count": 15,
    "emoji": "👥",
    "percentage": 25.5
  },
  ...
]
```

## Features Preserved

All original gratitude features are preserved:
- ✅ 3 gratitude items per day
- ✅ Auto-categorization (Friends, Family, Health, Work, Nature, Food, Love, Learning, Peace, Success)
- ✅ Statistics and analytics
- ✅ Streak tracking
- ✅ Category distribution charts
- ✅ Random gratitude reflection
- ✅ Writing prompts
- ✅ Calendar view with gratitude indicators

## New Benefits

1. **Unified Interface**: Journal notes and gratitude in one place
2. **Better Context**: Gratitude entries are tied to daily journal entries
3. **Simplified Codebase**: One model, one controller, one set of routes
4. **Flexible**: Users can add gratitude to any journal entry, not just dedicated gratitude entries

## Frontend Integration

Use the new `JournalNoteWithGratitude` component:

```jsx
import JournalNoteWithGratitude from '../components/JournalNoteWithGratitude';

<JournalNoteWithGratitude
  selectedDate={new Date()}
  existingNote={note}
  onSave={(savedNote) => console.log('Saved:', savedNote)}
  onCancel={() => console.log('Cancelled')}
/>
```

The component provides:
- Tab interface for Journal and Gratitude sections
- Auto-saving gratitude categories
- Character counters
- Writing prompts
- Badge showing gratitude count

## Rollback (If Needed)

If you need to rollback:

```bash
php artisan migrate:rollback --step=2
```

This will:
1. Remove gratitude fields from `journal_notes`
2. Restore `gratitudes` and `gratitude_categories` tables

Note: You'll need to restore the deleted files from git history.

## Testing Checklist

- [ ] Run migrations successfully
- [ ] Create journal note with gratitude
- [ ] Update journal note with gratitude
- [ ] View gratitude statistics
- [ ] View category distribution
- [ ] Get random gratitude
- [ ] Get writing prompts
- [ ] Verify auto-categorization works
- [ ] Check streak calculation
- [ ] Test frontend component

## Support

If you encounter any issues during migration, check:
1. Database connection is working
2. All migrations ran successfully
3. Cache is cleared
4. Frontend dependencies are installed

## Notes

- Existing journal notes without gratitude fields will continue to work normally
- The gratitude fields are optional - users can create journal notes without gratitude
- Categories are automatically detected based on keywords in the gratitude text
- The system supports up to 3 gratitude items per day per note
