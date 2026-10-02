import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// start the landing animation once the logo fonts are in (or after 1.5s at most)
const ready = () => document.documentElement.classList.add('fonts-ready')
Promise.race([
  Promise.all(['1em Katibeh', '1em "Mr Dafoe"'].map((f) => document.fonts.load(f, 'عتال Shady'))),
  new Promise((r) => setTimeout(r, 1500)),
]).then(ready, ready)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
