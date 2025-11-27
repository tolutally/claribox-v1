import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';

// Mount the React app
const rootElement = document.getElementById('claribox-root');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
