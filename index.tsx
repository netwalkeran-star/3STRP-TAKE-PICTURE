
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("PoseGen: Application booting...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("PoseGen: Could not find root element!");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("PoseGen: React mounted successfully.");
} catch (err) {
  console.error("PoseGen: Mounting failed:", err);
}
