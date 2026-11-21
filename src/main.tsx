import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { ProgressProvider } from './state/progress';
import { InputProvider } from './input/InputContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      <InputProvider>
        <App />
      </InputProvider>
    </ProgressProvider>
  </StrictMode>,
);
