import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { PrimeReactProvider, PrimeReactContext } from 'primereact/api';
import "primereact/resources/themes/lara-light-cyan/theme.css";


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrimeReactProvider>
      <App className="app" />
    </PrimeReactProvider>
  </StrictMode>,
)
