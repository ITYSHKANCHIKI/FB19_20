import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/custom-sw.js')
      .then((reg) => {
        console.log('Service Worker зарегистрирован', reg);
      })
      .catch((err) => {
        console.error('Ошибка регистрации Service Worker:', err);
      });
  });
}
 
