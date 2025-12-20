# Test Accounts - Ready to Use

## 🎯 3 Test Accounts Created

All accounts are ready for testing gRPC, WebSocket, and all application features.

---

## 👤 Account 1: Active User (Alice)

**Login Credentials:**
```
Email: user1@test.com
Password: password123
```

**Profile:**
- Name: Alice Johnson
- Status: Active journaler with consistent streak
- Journal Entries: 7 entries (last 7 days)
- Streak: 7 days 🔥
- Gratitudes: All entries have 3 gratitudes

**Use Case:**
- Test streak functionality
- Test weekly analysis with complete data
- Test gratitude statistics with high activity
- Test WebSocket real-time updates
- Best for testing all features

---

## 👤 Account 2: Moderate User (Bob)

**Login Credentials:**
```
Email: user2@test.com
Password: password123
```

**Profile:**
- Name: Bob Smith
- Status: Moderate journaler with gaps
- Journal Entries: 5 entries (with gaps in days)
- Streak: Will vary (has gaps)
- Gratitudes: Most entries have 1-2 gratitudes

**Use Case:**
- Test streak calculation with gaps
- Test incomplete data scenarios
- Test mixed gratitude patterns
- Test recommendation system with partial data
- Good for testing edge cases

---

## 👤 Account 3: New User (Charlie)

**Login Credentials:**
```
Email: user3@test.com
Password: password123
```

**Profile:**
- Name: Charlie Davis
- Status: New user just starting
- Journal Entries: 2 entries (today and yesterday)
- Streak: 2 days
- Gratitudes: Each entry has 1 gratitude

**Use Case:**
- Test new user experience
- Test minimal data scenarios
- Test onboarding flow
- Test first-time analysis generation
- Good for testing initial state

---

## 🚀 How to Use

### 1. Login to Frontend
```
1. Open http://localhost:5173
2. Use any of the 3 accounts above
3. All features will work immediately
```

### 2. Test Features

**All Accounts Can Test:**
- ✅ Journal entry creation with images
- ✅ Gratitude tracking
- ✅ Daily/Weekly analysis
- ✅ Streak calculation
- ✅ Journal history with calendar
- ✅ Dashboard statistics
- ✅ WebSocket real-time updates
- ✅ gRPC recommendations
- ✅ Image upload and display

### 3. Test Scenarios

**Scenario 1: Active User Journey (Alice)**
```
1. Login as user1@test.com
2. Check Dashboard → See 7-day streak
3. Check Weekly Analysis → Full week data
4. Add new entry → Streak increases to 8
5. Upload image → View in history
6. Check recommendations → Based on 7 days of data
```

**Scenario 2: Moderate User (Bob)**
```
1. Login as user2@test.com
2. Check Dashboard → See gaps in streak
3. Fill gap day → Streak recalculates
4. Check Weekly Analysis → Partial week data
5. Test recommendation with mixed patterns
```

**Scenario 3: New User (Charlie)**
```
1. Login as user3@test.com
2. Check Dashboard → Minimal stats
3. Add first image → Test upload flow
4. Build streak → Add entries for consecutive days
5. Watch stats grow → Real-time updates
```

---

## 🧪 Testing WebSocket & gRPC

### WebSocket Testing
```
1. Login with 2 different accounts in 2 browsers
2. Create entry in Account 1
3. See real-time update in Account 2 (if same user)
4. Test notification system
```

### gRPC Recommendations Testing
```
1. Login as Alice (most data)
2. Go to Dashboard
3. Click "Generate Weekly Analysis"
4. See gRPC recommendations based on journal patterns
5. Test with different users for different results
```

---

## 📊 Data Summary

| Account | Email | Entries | Streak | Gratitudes | Best For |
|---------|-------|---------|--------|------------|----------|
| Alice | user1@test.com | 7 | 7 days | High | Full features |
| Bob | user2@test.com | 5 | Varies | Medium | Edge cases |
| Charlie | user3@test.com | 2 | 2 days | Low | New user flow |

---

## 🔄 Reset Data (If Needed)

```bash
cd backend

# Reset and reseed
php artisan migrate:fresh
php artisan db:seed --class=TestUsersSeeder

# Or just reseed without losing other data
php artisan db:seed --class=TestUsersSeeder
```

---

## 💡 Tips

1. **Test Streak:** Login daily with Alice to maintain streak
2. **Test Gaps:** Use Bob to test streak breaking and recovery
3. **Test Growth:** Use Charlie to test progression from new user
4. **Test Images:** Upload different images to each account
5. **Test Analysis:** Generate weekly analysis on different days
6. **Test Real-time:** Open multiple tabs with same account
7. **Test Recommendations:** Compare recommendations across accounts

---

## ✅ All Accounts Ready!

All 3 accounts are now in the database with realistic journal data. You can:
- Login immediately
- Test all features
- Upload images
- Generate analyses
- Test WebSocket connections
- Test gRPC recommendations

**Password for all accounts: `password123`**

Happy Testing! 🚀
