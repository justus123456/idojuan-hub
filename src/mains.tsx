import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './indexxs.css'
import App from './apples.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)