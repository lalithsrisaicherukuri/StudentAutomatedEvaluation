const axios = require('axios');

// ✅ Replace with your actual API key
const API_KEY = '';




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
askGemini("\[ \text{Solve the initial–value problem}\quad \frac{d^{2}y}{dx^{2}} - 3\frac{dy}{dx} + 2y \;=\; e^{2x}, \qquad y(0)=1,\; y'(0)=0. \] see give me questions related to this from basic level to this level and necessary formulaes to solve it");
