import axios from 'axios';
import 'dotenv/config';

const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY;

async function test() {
  try {
    const resp = await axios.get('https://api.fireworks.ai/inference/v1/models', {
      headers: { Authorization: `Bearer ${FIREWORKS_API_KEY}` }
    });
    console.log('Available models:', resp.data.data.map(m => m.id).filter(id => id.includes('kimi')));
  } catch (e) {
    console.error('Error listing models:', e.response?.data || e.message);
  }
}

test();
