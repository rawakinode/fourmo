/** Validates token creation body — catches name constraint errors early. */
export function validateTokenCreate(bodyStr) {
  try {
    const body = JSON.parse(bodyStr)
    const { name } = body
    if (!name || typeof name !== 'string') return { error: "Mandatory parameter 'name' is required" }
    const trimmedName = String(name).trim()
    if (trimmedName.length === 0) return { error: "Mandatory parameter 'name' cannot be empty" }
    if (trimmedName.length > 20) return { error: `Mandatory parameter 'name' error, 'size must be between 0 and 20' (current: ${trimmedName.length} chars)` }
    return null
  } catch (e) { return null }
}

/** Request logging middleware */
export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.url}`)
  next()
}
