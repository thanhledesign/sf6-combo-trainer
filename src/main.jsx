import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import DevTuner from './components/DevTuner.jsx'
import { applyCachedSite, fetchSite } from './siteConfig'

applyCachedSite()
fetchSite()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <DevTuner />
    </BrowserRouter>
  </StrictMode>,
)
