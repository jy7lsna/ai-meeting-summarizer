const OpenAI = require("openai");

// Initialize Groq client (OpenAI-compatible API)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function generateSummary(transcript, customInstruction) {
  try {
    // Input validation
    if (!transcript || !customInstruction) {
      throw new Error("Transcript and custom instruction are required");
    }

    // Log input details
    console.log("AI Service - Input:", {
      transcriptLength: transcript.length,
      transcriptPreview: transcript.substring(0, 100) + "...",
      customInstruction,
    });

    // Check API key
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY environment variable is missing");
    }
    console.log("AI Service - API Key: Present");

    // Create the prompt
    const prompt = `Please summarize the following meeting transcript according to these instructions: "${customInstruction}"

Transcript:
${transcript}

Summary:`;

    console.log("AI Service - Sending request to Groq...");

    // Make the API call to Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Groq's fast and efficient model
      messages: [
        {
          role: "system",
          content:
            "You are a professional meeting summarizer. Provide clear, structured summaries based on the user's specific instructions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500, // Reduced tokens to save costs
      temperature: 0.3,
    });

    console.log("AI Service - Groq response received successfully");

    // Extract and return the summary
    const summary = completion.choices[0]?.message?.content;
    if (!summary) {
      throw new Error("No summary content received from Groq API");
    }

    return summary;
  } catch (error) {
    console.error("Groq API Error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      stack: error.stack,
    });

    // Re-throw with more context
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
}

module.exports = { generateSummary };
