/**
 * Robust JSON parser for AI responses.
 * Extracts the first JSON-like block and cleans common LLM errors (trailing commas, markdown).
 */
export function parseAIJSON(text) {
  if (!text) throw new Error('Empty AI response')

  // 1. Try to find the JSON block using a greedy match
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON structure found in AI response')

  let jsonStr = match[0]

  // 2. Basic cleaning: remove common trailing commas that break JSON.parse
  // Matches a comma followed by a closing bracket or brace, ignoring whitespace
  jsonStr = jsonStr
    .replace(/,\s*\]/g, ']')
    .replace(/,\s*\}/g, '}')

  try {
    return JSON.parse(jsonStr)
  } catch (e) {
    console.error('[parseAIJSON] Initial parse failed:', e.message)
    console.debug('[parseAIJSON] raw string snippet:', jsonStr.slice(0, 100) + '...' + jsonStr.slice(-100))

    // 3. Last ditch effort: if it's a quote/escape issue, we can't easily fix it here,
    // but at least we provide a cleaner error.
    throw new Error(`JSON Parse Error: ${e.message}`)
  }
}

/**
 * Basic sanitization for user-provided strings before inserting into LLM prompts.
 * Prevents basic prompt injection and limits input length.
 */
export function sanitizePromptInput(str, maxLen = 500) {
  if (typeof str !== 'string') return ''
  return str
    .trim()
    .slice(0, maxLen)
    .replace(/[<>]/g, '') // Avoid potential HTML or special tag-based injection cues
    .replace(/\r?\n/g, ' ') // Flatten to single line to keep context predictable
}
