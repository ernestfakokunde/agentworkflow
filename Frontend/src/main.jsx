import { DAppKitProvider } from '@mysten/dapp-kit-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { dAppKit } from './wallet/dappKit'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DAppKitProvider dAppKit={dAppKit}>
      <App />
    </DAppKitProvider>
  </StrictMode>,
)
