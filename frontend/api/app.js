const express = require("express");
const multer = require("multer");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables FIRST, before importing services
dotenv.config();

// Debug: Check if environment variables are loaded
console.log("Environment check:", {
  GROQ_API_KEY: process.env.GROQ_API_KEY ? "Found" : "Missing",
  SMTP_USER: process.env.SMTP_USER ? "Found" : "Missing",
  NODE_ENV: process.env.NODE_ENV || "Not set",
});

// Also check the .env file path
console.log("Current working directory:", process.cwd());
console.log(".env file path:", require("path").resolve(".env"));

// Import services AFTER environment variables are loaded
const { generateSummary } = require("./services/aiService");
const { sendEmail } = require("./services/emailService");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// File upload setup - only accept text files
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/plain" || file.mimetype === "text/markdown") {
      cb(null, true);
    } else {
      cb(new Error("Only text files are allowed"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Routes
app.post("/api/upload", upload.single("transcript"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const transcript = req.file.buffer.toString("utf8");
    res.json({
      message: "File uploaded successfully",
      transcript: transcript,
      filename: req.file.originalname,
    });
  } catch (error) {
    res.status(500).json({ error: "File upload failed" });
  }
});

app.post("/api/summarize", async (req, res) => {
  try {
    const { transcript, customInstruction } = req.body;

    if (!transcript || !customInstruction) {
      return res.status(400).json({
        error: "Transcript and custom instruction are required",
      });
    }

    const summary = await generateSummary(transcript, customInstruction);
    res.json({ summary });
  } catch (error) {
    console.error("Summarization error:", error);
    // Return the actual error message for debugging
    res.status(500).json({
      error: "Failed to generate summary",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

app.post("/api/send-email", async (req, res) => {
  try {
    const { recipients, subject, summary } = req.body;

    if (!recipients || !summary) {
      return res.status(400).json({
        error: "Recipients and summary are required",
      });
    }

    const result = await sendEmail(recipients, subject, summary);
    res.json({
      message: "Email sent successfully",
      messageId: result.messageId,
      recipients: result.recipients,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Max size is 5MB." });
    }
  }
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
