# Fixing Gemini API Model Error

## The Problem
Getting `404 Not Found` for `gemini-pro` in v1beta API. This usually means:

1. **API Key Issue**: The API key might not be valid or doesn't have access
2. **Wrong API Version**: SDK might be using v1beta but models are in v1
3. **Model Name Format**: Need to use correct model identifier

## Solution 1: Verify Your API Key

1. **Go to Google AI Studio**: https://makersuite.google.com/app/apikey
2. **Check your API key is active**:
   - Make sure it's not expired
   - Ensure it has access to Gemini models
3. **Copy the API key exactly** (no extra spaces)

4. **In your `.env` file**, make sure:
   ```env
   GOOGLE_AI_API_KEY=your_actual_api_key_here
   ```
   - No quotes around the key
   - No spaces before/after
   - Exact copy from Google AI Studio

## Solution 2: Test Which Models Work

I created a test endpoint. Visit in your browser:
```
http://localhost:3000/api/test-models
```

This will show which models are available with your API key.

## Solution 3: Try Alternative Model Names

The SDK might need different model names. Common working names:
- `gemini-1.5-flash` (most common)
- `gemini-1.5-pro`
- `gemini-1.0-pro`

## Solution 4: Check SDK Version

Make sure you're using the latest SDK:
```bash
npm install @google/generative-ai@latest
```

## Quick Fix: Verify API Key Format

Your API key should:
- Start with `AIza...`
- Be about 39 characters long
- Be copied directly from Google AI Studio (no extra characters)

If your API key looks wrong, generate a new one at:
https://makersuite.google.com/app/apikey
