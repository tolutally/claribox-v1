import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/styles/popup.css';

function Popup() {
  return (
    <div className="popup-container">
      <h1>Claribox</h1>
      <p>Gmail sidebar extension for email clarity</p>
      <button
        onClick={() => chrome.tabs.create({ url: 'https://mail.google.com' })}
        className="open-gmail-btn"
      >
        Open Gmail
      </button>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<Popup />);
}