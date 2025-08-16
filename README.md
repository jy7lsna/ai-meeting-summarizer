# Meeting Notes Summarizer

A Node.js/Express backend service that provides AI-powered meeting transcript summarization and email sharing capabilities.

## Features

- **File Upload**: Accept text file uploads (5MB max)
- **AI Summarization**: Generate summaries using Groq's Llama-3.3-70B model
- **Custom Instructions**: Tailor summaries based on user requirements
- **Email Sharing**: Send summaries via SMTP email service
- **Error Handling**: Comprehensive error handling and validation

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 1.1. Get Groq API Key
1. Visit [https://console.groq.com/](https://console.groq.com/)
2. Sign up or log in to your account
3. Create a new API key
4. Copy the API key for use in your `.env` file

### 2. Environment Configuration
Copy `env.example` to `.env` and fill in your credentials:

```bash
cp env.example .env
```

**Required Environment Variables:**
- `GROQ_API_KEY`: Your Groq API key ([Get it here](https://console.groq.com/))
- `SMTP_USER`: Email address for sending emails
- `SMTP_PASS`: Email password or app-specific password

**Optional Environment Variables:**
- `SMTP_HOST`: SMTP server host (default: smtp.gmail.com)
- `SMTP_PORT`: SMTP server port (default: 587)
- `PORT`: Server port (default: 5000)

### 3. Start the Server
```bash
npm start
# or
node app.js
```

The server will run on `http://localhost:5000`

## API Endpoints

### POST `/api/upload`
Upload a transcript file for processing.

**Request:**
- `Content-Type: multipart/form-data`
- `transcript`: Text file (.txt, .md)

**Response:**
```json
{
  "message": "File uploaded successfully",
  "transcript": "File content as string",
  "filename": "original_filename.txt"
}
```

### POST `/api/summarize`
Generate an AI summary based on transcript and custom instructions.

**Request:**
```json
{
  "transcript": "Meeting transcript text...",
  "customInstruction": "Summarize in bullet points for executives"
}
```

**Response:**
```json
{
  "summary": "AI-generated summary based on instructions..."
}
```

### POST `/api/send-email`
Send the summary via email to specified recipients.

**Request:**
```json
{
  "recipients": ["user1@example.com", "user2@example.com"],
  "subject": "Meeting Summary - Q4 Planning",
  "summary": "Summary content to send..."
}
```

**Response:**
```json
{
  "message": "Email sent successfully",
  "messageId": "email_message_id",
  "recipients": ["user1@example.com", "user2@example.com"]
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400`: Bad Request (missing parameters, invalid file type)
- `500`: Internal Server Error (AI service failure, email sending failure)

## File Upload Restrictions

- **File Types**: Only `.txt` and `.md` files accepted
- **File Size**: Maximum 5MB
- **Storage**: Files are processed in memory and not persisted

## Security Notes

- Files are not stored on disk
- Email addresses are validated before sending
- CORS is enabled for frontend integration
- Environment variables are used for sensitive configuration

## Testing

Test the endpoints using tools like Postman, curl, or your frontend application:

```bash
# Test file upload
curl -X POST -F "transcript=@meeting.txt" http://localhost:5000/api/upload

# Test summarization
curl -X POST -H "Content-Type: application/json" \
  -d '{"transcript":"Meeting content...","customInstruction":"Summarize for executives"}' \
  http://localhost:5000/api/summarize

# Test email sending
curl -X POST -H "Content-Type: application/json" \
  -d '{"recipients":["test@example.com"],"summary":"Test summary"}' \
  http://localhost:5000/api/send-email
``` 
