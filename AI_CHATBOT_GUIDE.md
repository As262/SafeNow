# AI Safety Chatbot - Implementation Guide

## Overview

The SafeNow application now includes an **AI Safety Chatbot** that provides real-time guidance for safety-related questions and integrates seamlessly with the SOS emergency system.

## Features

### 1. **Intelligent Safety Assistance**

- Answers questions about first aid, safety precautions, and emergency situations
- Provides practical, actionable advice for minor injuries and safety concerns
- Uses Google Gemini AI for natural language understanding
- Includes fallback responses when AI is unavailable

### 2. **Smart SOS Integration**

- Automatically detects when professional help may be needed
- Suggests appropriate SOS request types based on the conversation:
  - **Ambulance**: Accidents, injuries, medical issues
  - **Fire**: Fire, smoke, gas leaks
  - **NGO**: Shelter, support, assistance needs
- One-click SOS button within chat for immediate emergency response

### 3. **User-Friendly Interface**

- Floating chat button at bottom-right corner
- Smooth slide-in chat panel
- Message history with timestamps
- Loading indicators for AI responses
- Mobile-responsive design

### 4. **Contextual Emergency Detection**

The chatbot is designed for **minor safety concerns**, not life-threatening emergencies:

- ✅ **Use chatbot for**: Small cuts, minor burns, safety tips, sprain advice, general safety questions
- ❌ **Don't use chatbot for**: Severe bleeding, heart attacks, unconsciousness (use main SOS button immediately)

## Component Structure

### Frontend Components

#### **SafetyChatbot.jsx**

- Located: `frontend/src/components/SafetyChatbot.jsx`
- Props:
  - `onSOSRequest`: Function to trigger SOS request
  - `userLocation`: User's current location object
- Features:
  - Message management
  - AI response handling
  - Emergency type detection
  - SOS suggestion logic

#### **UserDashboard.jsx** (Modified)

- Added import for SafetyChatbot
- New function: `handleChatbotSOS(emergencyType)` - handles SOS requests from chatbot
- Component rendered at the end of the dashboard

### Backend Implementation

#### **sos/views.py** (Modified)

- New view: `chatbot_response(request)`
- Endpoint: `POST /api/sos/chatbot/`
- Uses Google Gemini AI (gemini-1.5-flash model)
- Includes comprehensive fallback responses

#### **sos/urls.py** (Modified)

- Added route: `path('chatbot/', views.chatbot_response, name='chatbot')`

#### **utils/api.js** (Modified)

- New function: `sendChatbotMessage(message)`
- Sends POST request to chatbot endpoint

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install `google-generativeai==0.8.3` along with other dependencies.

### 2. Configure Google Gemini API Key

The chatbot uses Google's Gemini AI. You need to obtain an API key:

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### 3. Set Environment Variable

**On Windows (PowerShell):**

```powershell
$env:GEMINI_API_KEY="your-api-key-here"
```

**On Windows (Command Prompt):**

```cmd
set GEMINI_API_KEY=your-api-key-here
```

**On Linux/Mac:**

```bash
export GEMINI_API_KEY="your-api-key-here"
```

**For Production (using .env file):**

```
# Create a .env file in backend/
GEMINI_API_KEY=your-api-key-here
```

### 4. Run Backend Server

```bash
cd backend
python manage.py runserver
```

### 5. Run Frontend Development Server

```bash
cd frontend
npm install  # if not already done
npm run dev
```

## Usage Guide

### For Users

1. **Open the Chatbot**
   - Look for the floating purple chat button at the bottom-right corner
   - Click to open the chat panel

2. **Ask Safety Questions**
   - Type questions like:
     - "What should I do for a small cut?"
     - "I twisted my ankle, what should I do?"
     - "Safety tips when walking alone at night?"

3. **Receive AI Guidance**
   - Get immediate, practical advice
   - Responses are kept brief and actionable

4. **Send SOS When Needed**
   - If the chatbot suggests professional help
   - An SOS button will appear in the chat
   - Click "Send SOS" to trigger emergency alert
   - Your location is automatically included

### Example Conversations

**Example 1: Minor Cut**

```
User: "I have a small cut on my finger"
AI: "For a small cut, wash it with clean water and soap, apply pressure
with a clean cloth to stop bleeding, then cover with a bandage. If
bleeding persists or the cut is deep, consider seeking medical attention."
```

**Example 2: Safety Concern**

```
User: "Someone is following me on the street"
AI: "Stay in well-lit public areas, keep walking toward crowded places,
call a trusted contact, and if you feel threatened, use your SOS alert
to get help immediately."

[SOS Suggestion appears]
"Do you want to send an SOS request for NGO Support?"
[Send SOS button]
```

## Technical Details

### API Endpoints

#### Chatbot Endpoint

- **URL**: `POST /api/sos/chatbot/`
- **Authentication**: None required (AllowAny)
- **Request Body**:
  ```json
  {
    "message": "What should I do for a minor burn?"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "response": "For minor burns: Cool the burn under running water..."
  }
  ```

### Emergency Detection Keywords

**Ambulance Keywords:**

- accident, injured, bleeding, unconscious, heart attack, stroke, breathing, medical, hospital, hurt, pain, broken, fell

**Fire Keywords:**

- fire, smoke, burning, flames, explosion, gas leak, electrical fire

**NGO Keywords:**

- help, shelter, support, homeless, food, clothing, counseling, assistance, rescue

### Fallback Responses

The chatbot includes intelligent fallback responses for common scenarios when the AI is unavailable:

- Minor cuts and wounds
- Burns
- Stalking/harassment
- Accidents
- Fire emergencies
- Sprains and twists
- Chest pain and breathing issues
- Poisoning

## Customization

### Modify AI Behavior

Edit the system instruction in `backend/sos/views.py`:

```python
system_instruction = """You are a helpful safety assistant..."""
```

### Add More Keywords

Edit keyword mappings in `frontend/src/components/SafetyChatbot.jsx`:

```javascript
const keywords = {
  ambulance: ['accident', 'injured', ...],
  fire: ['fire', 'smoke', ...],
  ngo: ['help', 'shelter', ...]
};
```

### Change AI Model

In `backend/sos/views.py`, modify:

```python
model = genai.GenerativeModel('gemini-1.5-flash')
# Can use: 'gemini-1.5-pro', 'gemini-1.0-pro', etc.
```

## Troubleshooting

### Issue: Chatbot returns fallback responses

**Solution**: Check if GEMINI_API_KEY is set correctly

```bash
# Windows PowerShell
echo $env:GEMINI_API_KEY

# Linux/Mac
echo $GEMINI_API_KEY
```

### Issue: Import error for google.generativeai

**Solution**: Install the package

```bash
pip install google-generativeai
```

### Issue: Chatbot button not visible

**Solution**:

- Check browser console for errors
- Verify SafetyChatbot is imported in UserDashboard
- Check z-index conflicts with other components

### Issue: SOS not triggered from chatbot

**Solution**:

- Verify location permissions are enabled in browser
- Check `handleChatbotSOS` function in UserDashboard
- Ensure `location` object is passed to SafetyChatbot

## Security Considerations

1. **API Key Protection**:
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys periodically

2. **Rate Limiting**:
   - Google Gemini has free tier limits
   - Consider implementing rate limiting on backend
   - Monitor API usage

3. **User Privacy**:
   - Chatbot conversations are not stored
   - Location is only sent when SOS is triggered
   - No message history is saved on server

## Future Enhancements

Potential improvements:

- [ ] Message history persistence in local storage
- [ ] Voice input support
- [ ] Multi-language support
- [ ] Conversation context memory
- [ ] Integration with external emergency services APIs
- [ ] Chatbot analytics and usage tracking

## Support

For issues or questions about the AI chatbot:

1. Check this documentation
2. Review browser console for errors
3. Check Django server logs
4. Verify API key configuration

---

**Version**: 1.0  
**Last Updated**: March 2026  
**AI Model**: Google Gemini 1.5 Flash
