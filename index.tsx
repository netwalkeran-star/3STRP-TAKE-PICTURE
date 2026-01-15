
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("PoseGen: Application booting...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("PoseGen: Could not find root element!");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("PoseGen: React mounted.");
  } catch (err) {
    console.error("PoseGen: Render error:", err);
    const fallback = document.getElementById('loading-fallback');
    if (fallback) fallback.innerText = "RENDER ERROR: " + err;
  }
}
