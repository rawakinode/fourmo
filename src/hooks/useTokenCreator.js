/**
 * useTokenCreator.js
 *
 * Orchestrates the full token creation pipeline:
 *   1. AI generation — token concept, logo, lore (via backend LLM/image APIs)
 *   2. Deployment — upload to Four.meme, register on-chain via TokenManager2
 *
 * The hook tracks progress through discrete steps so the UI can show
 * granular loading states (generating → uploading → signing → confirming).
 *
 * Requires `ensureAuth` from useFourMemeAuth to obtain a valid access token
 * before calling any authenticated Four.meme endpoints.
 */

import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { generateToken, generateImage, generateLore, scoreToken } from '../lib/apiClient'
import { uploadImage, getPublicConfig, createTokenAPI } from '../lib/fourmeme'
import { TOKEN_MANAGER2_ADDRESS, TOKEN_MANAGER2_ABI } from '../lib/contracts'

// Pipeline step identifiers
export const STEPS = {
  IDLE: 'idle',
  GENERATING: 'generating',     // AI generating token concept
  GEN_LORE: 'gen_lore',       // AI generating lore & tweet
  GEN_IMAGE: 'gen_image',      // AI generating logo
  GEN_SCORE: 'gen_score',      // AI scoring viral potential
  UPLOADING: 'uploading',      // uploading image to Four.meme
  CREATING_API: 'creating_api',   // registering token via API
  SIGNING_TX: 'signing_tx',     // waiting for MetaMask tx approval
  CONFIRMING: 'confirming',     // waiting for BSC block confirmation
  DONE: 'done',
  ERROR: 'error',
}

// Human-readable labels for each step (shown in UI)
export const STEP_LABELS = {
  [STEPS.IDLE]: '',
  [STEPS.GENERATING]: 'AI is creating meme details...',
  [STEPS.GEN_LORE]: 'AI is creating meme lore...',
  [STEPS.GEN_IMAGE]: 'AI is creating meme image...',
  [STEPS.GEN_SCORE]: 'AI is creating viral score...',
  [STEPS.UPLOADING]: 'Uploading logo to Four.meme...',
  [STEPS.CREATING_API]: 'Registering token on Four.meme API...',
  [STEPS.SIGNING_TX]: 'Sign launch transaction (check wallet)',
  [STEPS.CONFIRMING]: 'Waiting for BSC confirmation...',
  [STEPS.DONE]: 'Token is live! 🚀',
  [STEPS.ERROR]: 'Something went wrong',
}

// Steps that belong to the on-chain deployment phase
export const DEPLOY_STEPS = [
  STEPS.UPLOADING,
  STEPS.CREATING_API,
  STEPS.SIGNING_TX,
  STEPS.CONFIRMING,
]

// All steps in order (used for progress tracking)
export const ALL_STEPS = [
  STEPS.GENERATING,
  STEPS.GEN_LORE,
  STEPS.GEN_IMAGE,
  STEPS.GEN_SCORE,
  ...DEPLOY_STEPS,
  STEPS.DONE,
]

export function useTokenCreator({ ensureAuth } = {}) {
  const { address, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()

  const [step, setStep] = useState(STEPS.IDLE)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [generated, setGenerated] = useState(null)
  const [genProgress, setGenProgress] = useState({ token: false, lore: false, image: false, score: false })

  /**
   * Phase 1: Generate all token assets via AI.
   * Runs sequentially: concept → lore → image → viral score.
   * Lore and score failures are non-fatal (catch and continue).
   */
  const generate = useCallback(async (idea) => {
    setError(null)
    setResult(null)
    setGenProgress({ token: false, lore: false, image: false, score: false })

    // Step 1: Create meme details
    setStep(STEPS.GENERATING)
    const meta = await generateToken(idea)
    setGenProgress(p => ({ ...p, token: true }))

    // Step 2: Create meme lore
    setStep(STEPS.GEN_LORE)
    let loreData = {}
    try { loreData = await generateLore(meta) } catch (_) { }
    setGenProgress(p => ({ ...p, lore: true }))

    // Step 3: Create meme image
    setStep(STEPS.GEN_IMAGE)
    const imgData = await generateImage(meta.imagePrompt, meta.name, meta.shortName)
    setGenProgress(p => ({ ...p, image: true }))

    // Step 4: Create AI viral score
    setStep(STEPS.GEN_SCORE)
    let viralScore = null
    try {
      viralScore = await scoreToken({
        name: meta.name,
        shortName: meta.shortName,
        desc: meta.desc,
        lore: loreData.lore || '',
        tagline: meta.tagline || '',
        label: meta.label || 'Meme',
      })
    } catch (_) { }
    setGenProgress(p => ({ ...p, score: true }))

    const tokenData = { ...meta, ...imgData, ...loreData, viralScore }
    setGenerated(tokenData)
    setStep(STEPS.IDLE)
    return tokenData
  }, [])

  /**
   * Phase 2: Deploy token to Four.meme + BSC.
   * Flow: get auth → upload image → create via API → read launch fee →
   *       submit on-chain tx → wait for receipt.
   * The user sees two MetaMask popups: one for login (if needed), one for tx.
   */
  const deploy = useCallback(async (tokenData) => {
    if (!address || !isConnected) throw new Error('Wallet not connected')
    if (!ensureAuth) throw new Error('Auth not available')
    setError(null)

    try {
      // Get or reuse cached access token (no popup if already logged in)
      const accessToken = await ensureAuth()

      // Convert base64/SVG image to Blob for upload
      setStep(STEPS.UPLOADING)
      const { imageBase64, mediaType, svgText } = tokenData
      let imageBlob
      if (svgText) {
        imageBlob = new Blob([svgText], { type: 'image/svg+xml' })
      } else {
        if (!imageBase64) throw new Error('No image data available')
        const b64 = String(imageBase64).replace(/^data:[^;]+;base64,/, '')
        const byteStr = atob(b64)
        const ab = new ArrayBuffer(byteStr.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i)
        imageBlob = new Blob([ab], { type: mediaType || 'image/png' })
      }
      const imgUrl = await uploadImage(accessToken, imageBlob, `${tokenData.shortName}.png`)

      // Fetch bonding curve config (total supply, sale rate, etc.)
      const raisedToken = await getPublicConfig()

      // Register the token via Four.meme API — returns createArg + signature
      setStep(STEPS.CREATING_API)
      const { createArg, signature: createSig } = await createTokenAPI(accessToken, {
        name: tokenData.name,
        shortName: tokenData.shortName,
        desc: tokenData.desc,
        imgUrl,
        label: tokenData.label,
        raisedToken,
        twitterUrl: tokenData.twitterUrl,
        telegramUrl: tokenData.telegramUrl,
      })

      // Read on-chain launch fee from TokenManager2
      const launchFee = await publicClient.readContract({
        address: TOKEN_MANAGER2_ADDRESS,
        abi: TOKEN_MANAGER2_ABI,
        functionName: '_launchFee',
      })

      // Submit the createToken transaction (MetaMask popup for tx approval)
      setStep(STEPS.SIGNING_TX)
      const toHexBytes = (val) => {
        if (!val) return '0x'
        if (val.startsWith('0x')) return val
        try {
          const bin = atob(val)
          return '0x' + Array.from(bin, c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
        } catch (_) {
          return `0x${val}`
        }
      }

      const txHash = await writeContractAsync({
        address: TOKEN_MANAGER2_ADDRESS,
        abi: TOKEN_MANAGER2_ABI,
        functionName: 'createToken',
        args: [toHexBytes(createArg), toHexBytes(createSig)],
        value: launchFee,
        chainId: bsc.id,
      })

      // Wait for on-chain confirmation
      setStep(STEPS.CONFIRMING)
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

      // Extract deployed token address from the first event log
      const deployedAddr = receipt.logs?.[0]?.address ?? ''
      const finalResult = {
        txHash,
        receipt,
        tokenData: { ...tokenData, imgUrl },
        tokenAddress: deployedAddr,
        fourMemeUrl: `https://four.meme/token/${deployedAddr}`,
        bscScanUrl: `https://bscscan.com/tx/${txHash}`,
      }
      setResult(finalResult)
      setStep(STEPS.DONE)
      return finalResult

    } catch (e) {
      setError(e.message)
      setStep(STEPS.ERROR)
      throw e
    }
  }, [address, isConnected, ensureAuth, writeContractAsync, publicClient])

  /** Reset all state back to initial. */
  const reset = useCallback(() => {
    setStep(STEPS.IDLE)
    setError(null)
    setResult(null)
    setGenerated(null)
    setGenProgress({ token: false, lore: false, image: false, score: false })
  }, [])

  /** Clear error and return to idle state. */
  const clearError = useCallback(() => {
    setError(null)
    setStep(STEPS.IDLE)
  }, [])

  const isGenerating = [STEPS.GENERATING, STEPS.GEN_LORE, STEPS.GEN_IMAGE, STEPS.GEN_SCORE].includes(step)
  const isDeploying = DEPLOY_STEPS.includes(step)

  return {
    step, error, result, generated, genProgress,
    isGenerating, isDeploying,
    generate, deploy, reset, clearError, setGenerated,
  }
}
