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

import { useAccount } from 'wagmi'
import { Skull, X } from 'lucide-react'
import { STEPS } from '../hooks/useTokenCreator'
import { AUTH_STATUS } from '../hooks/useFourMemeAuth'
import CreateInput from '../components/CreateInput'
import TokenPreviewNew from '../components/TokenPreviewNew'
import LaunchScreen from '../components/LaunchScreen'
import SuccessScreen from '../components/SuccessScreen'

export default function CreatePage({ tokenCreator, auth }) {
  const { isConnected } = useAccount()
  const {
    step, error, result, generated, genProgress,
    isGenerating, isDeploying,
    generate, deploy, reset, setGenerated,
  } = tokenCreator

  const { status: authStatus } = auth ?? {}
  const isAuthReady = authStatus === AUTH_STATUS.READY

  const handleGenerate = async (idea, imageStyle) => {
    try { await generate(idea, imageStyle) }
    catch (e) { console.error(e) }
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
    <div className="create-page">
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
        />
      )}
      {showPreview && (
        <>
          <TokenPreviewNew
            data={generated}
            onEdit={setGenerated}
            onDeploy={handleDeploy}
            onReset={reset}
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
