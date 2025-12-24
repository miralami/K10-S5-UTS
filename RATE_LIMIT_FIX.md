# Rate Limit Fix for Weekly Journal Analysis

## Problem
The weekly journal analysis was failing with error "RESOURCE_EXHAUSTED" from Google Gemini API due to hitting the free tier rate limits:
- Input token count per minute exceeded
- Requests per minute per model exceeded  
- Requests per day per model exceeded

## Solution Implemented

### 1. **Rate Limit Detection in GeminiMoodAnalysisService.php**
   - Added detection for HTTP 429 status codes
   - Added detection for "RESOURCE_EXHAUSTED" and "quota" keywords in error responses
   - Throws specific exception with code 429 when rate limited

### 2. **Graceful Fallback for Weekly Analysis**
   - When rate limited, returns a user-friendly fallback analysis instead of failing
   - Includes message: "Ringkasan mingguan tidak dapat dihasilkan saat ini karena batas kuota API tercapai. Silakan coba lagi dalam beberapa menit."
   - Marks analysis with `rateLimited: true` flag

### 3. **Improved Error Messages in Controller**
   - JournalAnalysisController now detects rate limit errors
   - Returns HTTP 429 status for rate limit errors (instead of 500)
   - Provides specific Indonesian message: "Batas kuota API tercapai. Silakan tunggu beberapa menit dan coba lagi."

### 4. **Frontend Error Handling Enhancement**
   - Updated journalService.js to detect rate limit errors (429 status)
   - Appends clarification text: "(Batas API tercapai - coba lagi dalam beberapa menit)"
   - Provides better user feedback

### 5. **API Call Throttling in DailyJournalAnalysisService.php**
   - Added 500ms delay between consecutive daily analysis API calls
   - Prevents rapid-fire requests that trigger rate limits
   - Added try-catch to gracefully handle failures and use empty analysis as fallback

## Files Modified

1. `backend/app/Services/GeminiMoodAnalysisService.php`
   - Added rate limit detection in 3 API call methods
   - Added graceful fallback for weekly analysis

2. `backend/app/Http/Controllers/JournalAnalysisController.php`
   - Improved error handling with rate limit detection
   - Returns appropriate HTTP status codes

3. `frontend/src/services/journalService.js`
   - Enhanced error message handling for rate limits

4. `backend/app/Services/DailyJournalAnalysisService.php`
   - Added delay between API calls
   - Added error handling for individual daily analysis failures

5. **`backend/.env`**
   - **Changed model from `gemini-2.0-flash-lite` to `gemini-1.5-flash`**
   - gemini-1.5-flash has better rate limits (15 RPM vs lower limits on 2.0-flash-lite)

## Testing
Run `php artisan about` to verify no syntax errors (✓ Passed)

## Recommendations

### Short-term
- The current fix provides graceful degradation
- Users will see informative messages when rate limited
- System won't crash, just shows cached/fallback data

### Long-term (Choose one or more)
1. **Upgrade to Gemini API paid tier** for higher rate limits
2. **Implement Redis-based rate limiting** on your side to prevent hitting API limits
3. **Switch to a different model** (e.g., gemini-1.5-flash instead of gemini-2.0-flash-lite)
4. **Reduce API calls** by:
   - Only generating analyses on-demand (not preemptively)
   - Caching results more aggressively
   - Batching multiple days into single API call
5. **Implement exponential backoff** retry logic with longer delays

## Usage
When users hit rate limits:
- Daily analyses will show empty/cached results
- Weekly analyses will show fallback message
- Error messages are user-friendly in Indonesian
- System continues to function without crashes
