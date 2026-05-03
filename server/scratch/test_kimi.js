import axios from 'axios';
import 'dotenv/config';

const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY;

async function test() {
  try {
    const resp = await axios.post('https://api.fireworks.ai/inference/v1/chat/completions', {
      model: 'accounts/fireworks/models/kimi-k2p6',
      messages: [{ role: 'user', content: 'Say hello in JSON format {"msg": "..."}' }],
      response_format: { type: 'json_object' }
    }, {
      headers: { Authorization: `Bearer ${FIREWORKS_API_KEY}`, 'Content-Type': 'application/json' }
    });
    console.log('Success:', resp.data.choices[0].message.content);
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

test();
