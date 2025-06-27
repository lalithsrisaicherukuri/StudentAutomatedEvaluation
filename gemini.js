const axios = require('axios');

// ✅ Replace with your actual API key
const API_KEY = 'AIzaSyAtPwAMOcEBE4SD2cZwfWmYOBTh2WcZPq8';

const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

async function askGemini(prompt) {
  try {
    const response = await axios.post(URL, {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    });

    const reply = response.data.candidates[0].content.parts[0].text;
    console.log("🔹 Gemini Response:\n", reply);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
}

// 🧪 Example
askGemini("explain ml in simple words");
