import axios from 'axios';
import { validateTokenCreate } from '../middleware/validator.js';

const fourMemeApi = axios.create({
  baseURL: 'https://four.meme/meme-api/v1',
  timeout: 30_000,
  validateStatus: () => true,
})

export const proxyFourMeme = async (req, res) => {
  try {
    const path = req.params[0] || ''
    const method = req.method
    
    if (path === 'private/token/create' && (method === 'POST' || method === 'PUT')) {
      const validationError = validateTokenCreate(req.body.toString())
      if (validationError) return res.status(400).json(validationError)
    }

    const headers = {}
    if (req.headers['meme-web-access']) headers['meme-web-access'] = req.headers['meme-web-access']
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type']

    let response
    if (method === 'POST' || method === 'PUT') {
      response = await fourMemeApi.request({ method, url: `/${path}`, data: req.body, headers })
    } else if (method === 'GET') {
      response = await fourMemeApi.get(`/${path}`, { headers, params: req.query })
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    res.status(response.status).json(response.data)
  } catch (err) {
    const status = err.response?.status || 500
    const data = err.response?.data || { error: err.message }
    console.error('[four-meme-proxy]', `${status}:`, data)
    res.status(status).json(data)
  }
}
