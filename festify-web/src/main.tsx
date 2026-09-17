/**
 * main.tsx — React Application Entry Point
 *
 * 🎓 TEACHING NOTE: What is this file?
 * This is the FIRST file JavaScript runs when your app starts.
 * Its only job is to find the <div id="root"> in index.html and tell React:
 * "Take control of this div, and render our App component inside it."
 *
 * What is ReactDOM?
 * React itself is a library for describing what your UI should look like.
 * ReactDOM is what actually updates the real browser DOM (the actual HTML
 * elements you see on screen). They're separate because React can also
 * render to mobile (React Native), PDFs, servers, etc. — not just browsers.
 *
 * What is StrictMode?
 * <React.StrictMode> is a development-only wrapper that:
 * - Runs your component code TWICE to catch side effects that aren't safe
 * - Warns you about deprecated APIs
 * - Has no effect in production builds (so it doesn't slow users down)
 *
 * Think of it as a "linter that runs at runtime during development."
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'  // Import global styles (Tailwind + custom CSS)

// `document.getElementById('root')` finds the <div id="root"> in index.html
// The `!` at the end is a TypeScript "non-null assertion" — we're telling TS:
// "I KNOW this element exists, don't warn me that it might be null."
// (It definitely exists because we put it in index.html ourselves.)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
