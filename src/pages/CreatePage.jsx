/**
 * CreatePage.jsx
 *
 * Token creation flow page. Orchestrates the 4-phase UI:
 *   1. CreateInput  — user enters their meme idea
 *   2. TokenPreview — review/edit AI-generated token before deploying
 *   3. LaunchScreen — deployment progress (upload → sign → confirm)
 *   4. SuccessScreen — post-launch celebration + marketing kit
 *
 * Only one phase is visible at a time based on token creator state.
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Skull, X } from 'lucide-react'
import { STEPS } from '../hooks/useTokenCreator'
import { AUTH_STATUS } from '../hooks/useFourMemeAuth'
import CreateInput from '../components/CreateInput'
import TokenPreviewNew from '../components/TokenPreviewNew'
import LaunchScreen from '../components/LaunchScreen'
import SuccessScreen from '../components/SuccessScreen'
import useScrollReveal from '../hooks/useScrollReveal'

export default function CreatePage({ tokenCreator, auth }) {
  useScrollReveal()
  const { isConnected } = useAccount()
  const [searchParams] = useSearchParams()
  const initialIdea = searchParams.get('idea') || ''

  const {
    step, error, result, generated, genProgress,
    isGenerating, isDeploying,
    generate, deploy, reset, setGenerated,
  } = tokenCreator

  // Reset state on mount so the user starts fresh if they leave and come back
  useEffect(() => {
    reset()
  }, [reset])

  const [lastInputs, setLastInputs] = useState({ idea: '', imageStyle: '' })
  const { status: authStatus } = auth ?? {}
  const isAuthReady = authStatus === AUTH_STATUS.READY

  const handleGenerate = async (idea, imageStyle) => {
    setLastInputs({ idea, imageStyle })
    try { await generate(idea, imageStyle) }
    catch (e) { console.error(e) }
  }

  const handleRegenerate = () => {
    handleGenerate(lastInputs.idea, lastInputs.imageStyle)
  }

  const handleDeploy = async (tokenData) => {
    if (!isConnected || !isAuthReady) return
    try { await deploy(tokenData) }
    catch (e) { console.error(e) }
  }

  // Phase visibility flags — only one is true at a time
  const showInput = (step === STEPS.IDLE && !generated) || isGenerating
  const showPreview = generated && !isGenerating && !isDeploying && step !== STEPS.DONE

  const showLaunch = isDeploying
  const showSuccess = step === STEPS.DONE && result

  return (
    <div className="create-page reveal">
      {/* Error toast */}
      {error && step === STEPS.ERROR && (
        <div className="error-toast">
          <span className="error-toast-icon"><Skull size={20} /></span>
          <div className="error-toast-body">
            <strong>something broke lol</strong>
            <span>{error.length > 100 ? error.substring(0, 100) + '...' : error}</span>
          </div>
          <button className="error-toast-close" onClick={tokenCreator.clearError}><X size={18} /></button>
        </div>
      )}

      {showInput && (
        <CreateInput
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          step={step}
          genProgress={genProgress}
          initialIdea={initialIdea}
        />
      )}
      {showPreview && (
        <>
          <TokenPreviewNew
            data={generated}
            onEdit={setGenerated}
            onDeploy={handleDeploy}
            onReset={reset}
            onRegenerate={handleRegenerate}
            isConnected={isConnected}
            isAuthReady={isAuthReady}
            authStatus={authStatus}
          />
        </>
      )}
      {showLaunch && <LaunchScreen step={step} />}
      {showSuccess && <SuccessScreen result={result} onReset={reset} />}
    </div>
  )
}
