import { AI_LLM_PROVIDER, LLM_MODEL, dgridApi, fireworksLlm } from '../config/ai-config.js';

/**
 * Sends a chat completion request to the active LLM provider.
 * Forces JSON response format. Strips <think> tags from reasoning models.
 */
export async function chat(systemPrompt, userPrompt, maxTokens = 1000) {
  const model = LLM_MODEL
  const payload = {
    model, max_tokens: maxTokens, temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
  }

  let res;
  if (AI_LLM_PROVIDER === 'dgrid') {
    res = await dgridApi.post('/chat/completions', payload)
  } else {
    res = await fireworksLlm.post('/chat/completions', payload)
  }
  const content = res.data.choices[0].message.content
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}
