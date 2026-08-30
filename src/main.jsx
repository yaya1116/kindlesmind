import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// index.html ships a JavaScript-free copy of the homepage for crawlers, agents
// and visitors whose bundle never loads. Once React is about to take over it is
// redundant, so drop it before the first paint of the app.
document.getElementById('km-nojs')?.remove()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
