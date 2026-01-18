# Simple Test Cases for Verification

## Test Case 1: Basic Text to LLM (Simplest)

### Steps:
1. **Add Text Node:**
   - Click "Text Node" in left sidebar
   - Type: `"What is 2+2? Answer in one sentence."`

2. **Add LLM Node:**
   - Click "Run Any LLM" in left sidebar
   - Model: `gemini-1.5-flash` (default)
   - System Prompt: Leave empty or type: `"You are a helpful assistant"`
   - User Message: Leave empty (will come from connection)

3. **Connect Nodes:**
   - Drag from bottom handle of Text Node
   - Connect to left handle of LLM Node (labeled "user_message")
   - Text field in LLM Node should become disabled/greyed out

4. **Run:**
   - Click "Run" button on LLM Node
   - Wait for response (5-10 seconds)

### Expected Output:
```
✅ Response should appear in LLM Node, something like:
"2+2 equals 4."
OR
"The answer to 2+2 is 4."
OR
"2 plus 2 equals 4."
```

### Success Criteria:
- ✅ Text node saves the text
- ✅ Connection created (purple line appears)
- ✅ User Message field becomes disabled when connected
- ✅ LLM Node shows "Running..." while processing
- ✅ Response appears below the Run button
- ✅ Response is a number or sentence about 2+2 being 4

---

## Test Case 2: Image Upload and Preview

### Steps:
1. **Add Upload Image Node:**
   - Click "Upload Image" in left sidebar
   - Click "Click to upload" area in the node
   - Select any image file (jpg, png, webp, or gif)
   - Wait for upload to complete

### Expected Output:
```
✅ Image preview appears in the node
✅ File name is displayed below the image
✅ Output handle (purple circle) is visible at bottom of node
✅ No error messages
```

### Success Criteria:
- ✅ Upload button/area is clickable
- ✅ File picker opens when clicked
- ✅ After selecting image, preview appears
- ✅ File name is shown
- ✅ Node shows image without errors

### Optional - Test Different Formats:
- Try `.jpg` - should work
- Try `.png` - should work
- Try `.webp` - should work

---

## Test Case 3: LLM with Image (Vision Test)

### Steps:
1. **Add Upload Image Node:**
   - Click "Upload Image"
   - Upload any image (e.g., a photo, diagram, screenshot)

2. **Add LLM Node:**
   - Click "Run Any LLM"
   - System Prompt: `"You are an image analyzer"`
   - User Message: `"Describe what you see in this image in one sentence."`

3. **Connect Image to LLM:**
   - Drag from Image Node output handle (bottom)
   - Connect to LLM Node's left handle (labeled "images")
   - Note: Images handle accepts connections

4. **Run LLM:**
   - Click "Run" button
   - Wait for response (10-15 seconds for vision)

### Expected Output:
```
✅ Response should describe the image, for example:
- If image is a cat: "This image shows a cat..." or "I can see a cat..."
- If image is a sunset: "The image displays a sunset scene..."
- If image is text/screenshot: "The image contains text that says..."

⚠️ If image upload didn't work: Response might say "I don't see an image" or error
```

### Success Criteria:
- ✅ Image uploads successfully
- ✅ Connection between Image and LLM Node works
- ✅ LLM response mentions the image content
- ✅ Response is relevant to what's in the image
- ✅ No "image not found" errors

---

## Quick Verification Checklist

After running these tests, verify:

### Basic Functionality:
- [ ] Nodes can be created from sidebar
- [ ] Nodes appear on canvas
- [ ] Nodes can be selected and moved
- [ ] Text can be entered in Text Node
- [ ] Images can be uploaded and previewed
- [ ] Nodes can be connected (drag handles)

### LLM Functionality:
- [ ] LLM Node can generate responses
- [ ] Responses appear in the node (not in separate output node)
- [ ] Running state shows (button disabled, spinner, etc.)
- [ ] Error messages show if something fails (not blank)

### Connections:
- [ ] Connected input fields become disabled/greyed out
- [ ] Connection lines are purple and animated
- [ ] Multiple connections can be made (e.g., multiple images to one LLM)

---

## Troubleshooting

### If Test Case 1 fails:
- **No response?** Check terminal for API errors
- **Connection not working?** Make sure you drag from output handle (bottom) to input handle (top/left)
- **Response is wrong?** Check if API key is correct and has quota

### If Test Case 2 fails:
- **Upload not working?** Check browser console for errors
- **No preview?** Check if image file is valid format
- **Error on upload?** Check Transloadit credentials (if configured)

### If Test Case 3 fails:
- **LLM doesn't mention image?** Image might not be connected properly
- **Error about image?** Check if image URL is accessible
- **Vision not working?** Check API key has access to multimodal models

---

## Expected Response Times

- **Text-only LLM:** 5-10 seconds
- **Image upload:** 2-5 seconds
- **LLM with image (vision):** 10-20 seconds

If responses take much longer or timeout, check your internet connection and API quota.
