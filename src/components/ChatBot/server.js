const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config({ path: '.env' });

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/api/chat', async (req, res) => {
  const { message, chatHistory } = req.body;

  try {
    // Format conversation history for OpenAI API, filtering out any null/undefined content
    const messages = chatHistory
      .filter(msg => msg.message && typeof msg.message === 'string')
      .map(msg => ({
        role: msg.user === "me" ? "user" : "assistant",
        content: msg.message
      }));

    // Add the new user message
    messages.push({ role: "user", content: message });

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    const botResponse = response.data.choices[0].message.content;
    res.json({
      response: botResponse.trim(),
    });
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});