
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('[main.tsx] Bootstrapping application');
createRoot(document.getElementById("root")!).render(<App />);
