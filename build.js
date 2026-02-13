const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { marked } = require('marked');

// --- Configuration ---
const REGISTRY_URL = 'https://raw.githubusercontent.com/VoltAgent/awesome-openclaw-skills/main/README.md';
const OUTPUT_DIR = __dirname;
const REPO_ROOT = 'https://github.com/openclaw/skills/tree/main/skills';
const SITE_ORIGIN = 'https://moltdirectory.com';

function cleanPath(inputPath = '/', trailingSlash = true) {
  let normalized = inputPath || '/';

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/{2,}/g, '/');

  if (normalized !== '/' && trailingSlash) {
    normalized = normalized.replace(/\/?$/, '/');
  }

  if (!trailingSlash && normalized !== '/') {
    normalized = normalized.replace(/\/+$/, '');
  }

  return normalized;
}

function absoluteUrl(sitePath, trailingSlash = true) {
  return `${SITE_ORIGIN}${cleanPath(sitePath, trailingSlash)}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// --- Icons Mapping ---
const icons = {
  'web-frontend': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  'coding-agents': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  'git-github': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>',
  'devops-cloud': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
  'browser-automation': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>',
  'image-video': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>',
  'apple': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  'apple-apps--services': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  'search-research': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  'openclaw-tools': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  'clawdbot-tools': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  'cli-utilities': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  'marketing-sales': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  'productivity': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  'productivity--tasks': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  'ai-llms': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  'finance-crypto': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  'media-streaming': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  'notes-pkm': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  'ios-macos-dev': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  'ios--macos-development': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  'transportation': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
  'personal-dev': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  'personal-development': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  'health-fitness': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  'communication': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  'speech-transcription': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  'smart-home': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  'smart-home--iot': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  'shopping': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
  'shopping--e-commerce': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
  'calendar': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  'calendar--scheduling': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  'pdf-documents': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
  'self-hosted': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
  'self-hosted--automation': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
  'news-rss': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>',
  'bookmarks': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  'bookmarks--reading': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  'weather': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
  'security': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  'security--passwords': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  'coding-agents--ides': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  'git--github': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>',
  'devops--cloud': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
  'browser--automation': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>',
  'image--video-generation': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>'
};

// --- Templates ---
const PAGE_TEMPLATE = (content, title, desc, canonicalPath = '/') => {
  const canonicalUrl = absoluteUrl(canonicalPath, canonicalPath !== '/security-auditor');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${desc}">
  <title>${title} - OpenClaw Directory</title>
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦞</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
  <script>
    // Apply saved theme before page renders to prevent flash
    (function() {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    })();
  </script>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <a href="/" class="logo">

        <span class="logo-text">OpenClaw Directory</span>
      </a>
      <nav class="header-links">
        <a href="/start-here/" class="header-link">Start Here</a>
        <a href="/security-auditor" class="header-link">Security Auditor</a>
        <a href="https://github.com/neonone123/moltdirectory/issues/new?template=add-skill.yml" class="header-link" target="_blank" rel="noopener">Add Skill</a>
        <button class="theme-toggle" aria-label="Toggle theme" onclick="toggleTheme()">
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>
        <a href="https://www.reddit.com/r/OpenClawDirectory/" class="header-link" target="_blank" rel="noopener" aria-label="Community">
          <svg viewBox="0 0 16 16" fill="currentColor" width="28" height="28"><path d="M6.167 8a.83.83 0 0 0-.83.83c0 .459.372.84.83.831a.831.831 0 0 0 0-1.661m1.843 3.647c.315 0 1.403-.038 1.976-.611a.23.23 0 0 0 0-.306.213.213 0 0 0-.306 0c-.353.363-1.126.487-1.67.487-.545 0-1.308-.124-1.671-.487a.213.213 0 0 0-.306 0 .213.213 0 0 0 0 .306c.564.563 1.652.61 1.977.61zm.992-2.807c0 .458.373.83.831.83s.83-.381.83-.83a.831.831 0 0 0-1.66 0z"/><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.828-1.165c-.315 0-.602.124-.812.325-.801-.573-1.9-.945-3.121-.993l.534-2.501 1.738.372a.83.83 0 1 0 .83-.869.83.83 0 0 0-.744.468l-1.938-.41a.2.2 0 0 0-.153.028.2.2 0 0 0-.086.134l-.592 2.788c-1.24.038-2.358.41-3.17.992-.21-.2-.496-.324-.81-.324a1.163 1.163 0 0 0-.478 2.224q-.03.17-.029.353c0 1.795 2.091 3.256 4.669 3.256s4.668-1.451 4.668-3.256c0-.114-.01-.238-.029-.353.401-.181.688-.592.688-1.069 0-.65-.525-1.165-1.165-1.165"/></svg>
        </a>
      </nav>
    </div>
  </header>
  ${content}
  <footer class="footer">
    <div class="footer-inner">
      <p class="footer-text" style="margin-bottom: 8px;"><a href="https://github.com/neonone123/moltdirectory" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: none;">View on GitHub</a></p>
      <p class="footer-text" style="opacity: 0.6; font-size: 13px;">OpenClawDirectory.com is a community-run project and is not affiliated with the official OpenClaw team or Peter Steinberger. We are just fans of the lobster.</p>
    </div>
  </footer>
  <script>
    function toggleTheme() {
      const html = document.documentElement;
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      if (newTheme === 'light') {
        html.setAttribute('data-theme', 'light');
      } else {
        html.removeAttribute('data-theme');
      }
      localStorage.setItem('theme', newTheme);
    }
    
    function copySkillContent(btn) {
      const wrapper = btn.closest('.skill-source-wrapper');
      const content = wrapper.querySelector('.markdown-content');
      if (content) {
        const text = content.innerText || content.textContent;
        navigator.clipboard.writeText(text).then(() => {
          btn.classList.add('copied');
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
          }, 2000);
        });
      }
    }

    async function sendToSecurityAuditor() {
      try {
        const contentElement = document.querySelector('.markdown-content');
        if (!contentElement) throw new Error('Could not find markdown content');
        const skillContent = contentElement.innerText || contentElement.textContent;
        localStorage.setItem('skillAuditContent', skillContent);
        window.open('/security-auditor', '_blank'); 
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  </script>
</body>
</html>`;
};

function rewriteRelativeDocLinks(skillHtml, skillRepoUrl) {
  const blobBase = skillRepoUrl
    .replace('/tree/', '/blob/')
    .replace(/\/SKILL\.md$/, '/');

  return skillHtml.replace(/<a([^>]*?)href="([^"]+)"([^>]*)>/gi, (match, pre, href, post) => {
    const isAbsolute = /^(?:[a-z]+:)?\/\//i.test(href) || href.startsWith('/') || href.startsWith('#');
    const isMetaLink = href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('data:');

    if (isAbsolute || isMetaLink) {
      return match;
    }

    const [pathPart, hashPart = ''] = href.split('#');
    const [cleanHref, queryPart = ''] = pathPart.split('?');
    const lowerHref = cleanHref.toLowerCase();
    const targetsDoc =
      lowerHref.endsWith('.md') ||
      lowerHref === 'skill.md' ||
      lowerHref.startsWith('references/') ||
      lowerHref.includes('/references/');

    if (!targetsDoc) {
      return match;
    }

    const githubHref = `${blobBase}${cleanHref}${queryPart ? `?${queryPart}` : ''}${hashPart ? `#${hashPart}` : ''}`;
    return `<a${pre}href="${githubHref}"${post}>`;
  });
}

// --- Build Logic ---
async function build() {
  console.log('Fetching registry from GitHub...');
  const res = await axios.get(REGISTRY_URL);
  let rawContent = res.data;

  // GLOBAL REBRAND: Replace all instances of MoltBot with OpenClaw in the raw registry data
  rawContent = rawContent.replace(/MoltBot/g, 'OpenClaw').replace(/MoltDirectory/g, 'OpenClaw Directory');

  const lines = rawContent.split('\n');

  const categories = [];
  const skills = [];

  // Parse categories and skills from README
  // Support both ## and ### for headers depending on README structure
  // We'll normalize by splitting on newlines and processing line by line statefully
  let currentCat = null;
  let currentCatSkills = [];

  for (const line of lines) {
    // Check for Category Header
    // 1. Standard Markdown (## or ###)
    let headerMatch = line.match(/^(#{2,3})\s+(.*)/);

    // 2. HTML Style (<summary><h3>...)
    if (!headerMatch) {
      const htmlMatch = line.match(/<summary><h3[^>]*>(.*?)<\/h3><\/summary>/);
      if (htmlMatch) {
        headerMatch = [line, '###', htmlMatch[1]]; // Mock the markdown match structure
      }
    }

    if (headerMatch) {
      // If we were processing a category, push it before starting new one
      if (currentCat) {
        categories.push({ ...currentCat, count: currentCatSkills.length });
        currentCatSkills = [];
      }

      let catName = headerMatch[2].replace(/ \(.*\)/, '').trim();
      // Remove any trailing colon or special chars if present
      catName = catName.replace(/:$/, '');

      const catId = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      // Default desc, might be refined if description lines follow (omitted for simplicity here)
      const catDesc = `Skills for ${catName}`;

      currentCat = { id: catId, name: catName, desc: catDesc };
    } else if (currentCat) {
      // Process Skills
      // Format: - [Name](URL) - Description
      const skillMatch = line.match(/^\s*-\s*\[(.*?)\]\((.*?)\)\s*-\s*(.*)/);
      if (skillMatch) {
        const [_, name, url, desc] = skillMatch;
        const author = url.split('/skills/').pop().split('/')[0] || 'VoltAgent';
        const skill = {
          name,
          url,
          desc: desc.trim().replace(/\.$/, ''),
          catId: currentCat.id,
          catName: currentCat.name,
          author,
          id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        };
        currentCatSkills.push(skill);
        skills.push(skill);
      }
    }
  }
  // Push the last category
  if (currentCat) {
    categories.push({ ...currentCat, count: currentCatSkills.length });
  }

  // Filter out non-skill categories
  const EXCLUDED_CATEGORIES = ['installation', 'table-of-contents', 'contributing'];
  const filteredCategories = categories.filter(cat =>
    !EXCLUDED_CATEGORIES.includes(cat.id) && cat.count > 0
  );
  const filteredSkills = skills.filter(s =>
    !EXCLUDED_CATEGORIES.includes(s.catId)
  );

  // --- Map Icons to new Category IDs if missing ---
  // The README headers are dynamic, let's normalize icon matching
  const getIcon = (id) => {
    // Try exact match
    if (icons[id]) return icons[id];
    // Try finding a partial match in the icons object
    const key = Object.keys(icons).find(k => id.includes(k) || k.includes(id));
    return icons[key] || icons['openclaw-tools'];
  };

  console.log(`Found ${filteredCategories.length} categories and ${filteredSkills.length} skills.`);

  // 1. Generate Homepage
  const homeContent = `
    <section class="hero">
      <!-- Animated background orbs -->
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>
      <div class="hero-orb hero-orb-3"></div>

      <div class="hero-content">
        <div class="hero-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
          <span>Directory v4.2</span>
        </div>
        <h1 class="hero-title">Browse OpenClaw Skills</h1>
        <p class="hero-subtitle">The largest directory of pre-built skills for OpenClaw agents.</p>
        
        <div class="hero-stats">
          <div class="hero-stat-card">
            <div class="hero-stat-value">${filteredSkills.length}</div>
            <div class="hero-stat-label">Skills</div>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat-card">
            <div class="hero-stat-value">${filteredCategories.length}</div>
            <div class="hero-stat-label">Categories</div>
          </div>
        </div>
      </div>
    </section>
    <section class="search-section">
      <div class="search-wrapper">
        <div class="search-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <input type="text" class="search-input" id="searchInput" placeholder="Search categories and skills..." autocomplete="off">
        <span class="search-shortcut">⌘K</span>
      </div>
      <div id="searchResults" class="search-results" style="display: none;"></div>
    </section>
    <section class="categories-section" id="categoriesSection">
      <div class="categories-grid" id="categoriesGrid">
        ${filteredCategories.map(cat => `
          <a href="/${cat.id}/" class="category-card" data-name="${cat.name.toLowerCase()}" data-desc="${cat.desc.toLowerCase()}">
            <div class="category-icon">${getIcon(cat.id)}</div>
            <div class="category-content">
              <div class="category-name">${cat.name}</div>
              <div class="category-desc">${cat.desc}</div>
              <div class="category-count">${cat.count} skills</div>
            </div>
          </a>
        `).join('')}
      </div>
      <div id="noResults" class="empty-state" style="display: none;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <div class="empty-state-title">No categories found</div>
        <div class="empty-state-desc">Try a different search term</div>
      </div>
    </section>
    <script>
      // Static search data embedded at build time
      const skillsData = ${JSON.stringify(filteredSkills.map(s => ({ name: s.name, desc: s.desc, catId: s.catId, catName: s.catName, id: s.id })))};
      
      const searchInput = document.getElementById('searchInput');
      const categoriesGrid = document.getElementById('categoriesGrid');
      const noResults = document.getElementById('noResults');
      const searchResults = document.getElementById('searchResults');
      const categoryCards = document.querySelectorAll('.category-card');
      
      // Keyboard shortcut
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          searchInput.focus();
        }
        if (e.key === 'Escape') {
          searchInput.blur();
          searchInput.value = '';
          handleSearch('');
        }
      });
      
      searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
      
      function handleSearch(query) {
        const q = query.toLowerCase().trim();
        
        if (!q) {
          // Show all categories, hide skill results
          categoryCards.forEach(card => card.style.display = '');
          noResults.style.display = 'none';
          searchResults.style.display = 'none';
          return;
        }
        
        // Filter categories
        let visibleCount = 0;
        categoryCards.forEach(card => {
          const name = card.dataset.name;
          const desc = card.dataset.desc;
          const matches = name.includes(q) || desc.includes(q);
          card.style.display = matches ? '' : 'none';
          if (matches) visibleCount++;
        });
        
        // Search skills
        const matchingSkills = skillsData.filter(s => 
          s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
        ).slice(0, 8);
        
        if (matchingSkills.length > 0) {
          searchResults.innerHTML = '<div class="search-results-title">Skills matching "' + q + '"</div>' +
            matchingSkills.map(s => 
              '<a href="/' + s.catId + '/' + s.id + '/" class="search-result-item">' +
                '<div class="search-result-name">' + s.name + '</div>' +
                '<div class="search-result-cat">' + s.catName + '</div>' +
              '</a>'
            ).join('');
          searchResults.style.display = 'block';
        } else {
          searchResults.style.display = 'none';
        }
        
        noResults.style.display = visibleCount === 0 && matchingSkills.length === 0 ? 'block' : 'none';
      }
    </script>
  `;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), PAGE_TEMPLATE(homeContent, 'OpenClaw Skills Directory', 'Browse AI agent skills for OpenClaw', '/'));

  // 2. Generate Category Pages
  for (const cat of filteredCategories) {
    const catSkills = skills.filter(s => s.catId === cat.id);
    const catContent = `
      <section class="category-hero">
        <div class="category-hero-content">
          <a href="/" class="back-link">← All Categories</a>
          <div class="category-hero-header">
            <div class="category-hero-icon">${getIcon(cat.id)}</div>
            <div>
              <h1 class="category-hero-title">${cat.name}</h1>
              <p class="category-hero-desc">${cat.desc}</p>
            </div>
          </div>
        </div>
      </section>
      <section class="skills-section">
        <div class="skills-grid">
          ${catSkills.map(s => `
            <a href="/${cat.id}/${s.id}/" class="skill-card" style="text-decoration: none; color: inherit;">
              <div class="skill-header">
                <div class="skill-name">${s.name}</div>
              </div>
              <div class="skill-desc">${s.desc}</div>
              <div class="skill-footer">
                <div class="skill-author">by @${s.author}</div>
                <div class="skill-link">View Details →</div>
              </div>
            </a>
          `).join('')}
        </div>
      </section>
    `;
    const catDir = path.join(OUTPUT_DIR, cat.id);
    if (!fs.existsSync(catDir)) fs.mkdirSync(catDir);
    fs.writeFileSync(path.join(catDir, 'index.html'), PAGE_TEMPLATE(catContent, cat.name, cat.desc, `/${cat.id}/`));

    // 3. Generate Skill Pages
    console.log(`Generating pages for ${cat.name}...`);
    for (const s of catSkills) {
      const skillDir = path.join(catDir, s.id);
      if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir);

      try {
        const rawUrl = s.url.replace('github.com', 'raw.githubusercontent.com').replace('/tree/', '/').replace('/blob/', '/');
        const skillRes = await axios.get(rawUrl);
        let skillMd = skillRes.data;

        // GLOBAL REBRAND: Replace all instances of MoltBot with OpenClaw in the skill content
        skillMd = skillMd.replace(/MoltBot/g, 'OpenClaw').replace(/MoltDirectory/g, 'OpenClaw Directory').replace(/Molt /g, 'OpenClaw ');

        // Remove YAML frontmatter (---...---) from the start of the markdown
        skillMd = skillMd.replace(/^---[\s\S]*?---\n*/m, '');

        const skillHtml = rewriteRelativeDocLinks(marked(skillMd), s.url);

        const skillContent = `
          <section class="skill-page-header">
            <div class="skill-page-header-inner">
              <a href="/${cat.id}/" class="back-link">← Back to ${cat.name}</a>
              <div class="skill-page-meta">
                <a href="/${cat.id}/" class="skill-page-category">${cat.name}</a>
                <span class="skill-page-author">by @${s.author}</span>
              </div>
              <h1 class="skill-page-title">${s.name}</h1>
              <p class="skill-page-desc">${s.desc}</p>
            </div>
          </section>
          <div class="skill-page-body">
            <article class="skill-page-content">
              <div class="skill-source-wrapper">
                <div class="skill-source-header">
                  <div class="skill-source-title">Source Code</div>
                  <button class="copy-btn" onclick="copySkillContent(this)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy
                  </button>
                </div>
                <div class="markdown-content">
                  ${skillHtml}
                </div>
              </div>
            </article>
            <aside class="skill-page-sidebar">
              <div class="sidebar-card">
                <div class="sidebar-title">Actions</div>
                <a href="${s.url}" target="_blank" rel="noopener" class="sidebar-btn sidebar-btn-primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                  View on GitHub
                </a>
                <a href="https://clawdhub.com/${s.author}/${s.id}" target="_blank" rel="noopener" class="sidebar-btn sidebar-btn-clawdhub">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                  View on ClawdHub
                </a>
                <a href="${rawUrl}" download="SKILL.md" class="sidebar-btn sidebar-btn-secondary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download SKILL.md
                </a>
                <button onclick="sendToSecurityAuditor()" class="sidebar-btn sidebar-btn-security">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Security Check
                </button>
              </div>
              <div class="sidebar-card">
                <div class="sidebar-title">Details</div>
                <div class="sidebar-info">
                  <div class="sidebar-info-item">
                    <span class="sidebar-info-label">Author</span>
                    <span class="sidebar-info-value">@${s.author}</span>
                  </div>
                  <div class="sidebar-info-item">
                    <span class="sidebar-info-label">Category</span>
                    <span class="sidebar-info-value">${cat.name}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        `;
        fs.writeFileSync(path.join(skillDir, 'index.html'), PAGE_TEMPLATE(skillContent, s.name, s.desc, `/${cat.id}/${s.id}/`));
      } catch (err) {
        console.error(`Failed to fetch SKILL.md for ${s.name}: ${err.message}`);
        // Fallback page if SKILL.md fails
        const fallbackContent = `
          <section class="skill-page-header">
            <div class="skill-page-header-inner">
              <a href="/${cat.id}/" class="back-link">← Back to ${cat.name}</a>
              <div class="skill-page-meta">
                <a href="/${cat.id}/" class="skill-page-category">${cat.name}</a>
              </div>
              <h1 class="skill-page-title">${s.name}</h1>
              <p class="skill-page-desc">${s.desc}</p>
            </div>
          </section>
          <div class="skill-page-body">
            <article class="skill-page-content">
              <div class="markdown-content">
                <p>Skill documentation is available on GitHub.</p>
              </div>
            </article>
            <aside class="skill-page-sidebar">
              <div class="sidebar-card">
                <div class="sidebar-title">Actions</div>
                <a href="${s.url}" target="_blank" rel="noopener" class="sidebar-btn sidebar-btn-primary">View on GitHub</a>
                <a href="https://clawdhub.com/${s.author}/${s.id}" target="_blank" rel="noopener" class="sidebar-btn sidebar-btn-clawdhub">View on ClawdHub</a>
              </div>
            </aside>
          </div>
        `;
        fs.writeFileSync(path.join(skillDir, 'index.html'), PAGE_TEMPLATE(fallbackContent, s.name, s.desc, `/${cat.id}/${s.id}/`));
      }
    }
  }

  console.log('Generating Start Here page...');
  const startHereMd = `
# Start Here: The Awesome Guide to OpenClaw

**Formerly known as ClawdBot (🦞)**

A curated collection of resources, tools, and guides for [OpenClaw](https://openclaw.io) - the AI-powered messaging gateway that bridges your favorite chat platforms to coding agents.

> **Note on the Rebrand**: OpenClaw was previously known as Clawdbot. The project was renamed in early 2025. All existing Clawdbot configurations (\`~/.clawdbot/\`) remain fully compatible.

## 🚀 Quick Install

Get up and running in seconds:

\`\`\`bash
# macOS/Linux
curl -fsSL https://molt.bot/install.sh | bash

# Windows (PowerShell)
iwr -useb https://molt.bot/install.ps1 | iex

# npm
npm install -g openclaw@latest
\`\`\`

## 📚 Official Resources

- **[OpenClaw Website](https://openclaw.io)** - Official home with downloads.
- **[Documentation](https://docs.openclaw.io)** - Comprehensive guides and API docs.
- **[GitHub Repository](https://github.com/openclaw/openclaw)** - Source code and issues.
- **[Changelog](https://docs.openclaw.io/changelog)** - Latest updates and history.

## ⚡ Getting Started

- **[Quick Start Guide](https://docs.openclaw.io/getting-started)** - The fastest way to your first bot.
- **[First Bot Setup](https://github.com/minhlucvan/aswesome-moltbot/blob/main/docs/first-bot.md)** - Step-by-step connection guide.
- **[Architecture Overview](https://github.com/minhlucvan/aswesome-moltbot/blob/main/docs/architecture.md)** - Learn how the magic works.

## 🎓 Tutorials & Guides

### Video Tutorials
- **[OpenClaw in 5 Minutes](https://github.com/minhlucvan/aswesome-moltbot/blob/main/tutorials/videos.md#quick-start)** - Quick intro.
- **[Complete Setup Walkthrough](https://github.com/minhlucvan/aswesome-moltbot/blob/main/tutorials/videos.md#full-setup)** - Detailed guide.

### Written Guides
- **[WhatsApp AI Assistant](https://github.com/minhlucvan/aswesome-moltbot/blob/main/tutorials/whatsapp-assistant.md)** - Build a personal assistant.
- **[Team Coding Bot](https://github.com/minhlucvan/aswesome-moltbot/blob/main/tutorials/team-bot.md)** - Enhance team collaboration.
- **[Multi-Channel Deployment](https://github.com/minhlucvan/aswesome-moltbot/blob/main/tutorials/multi-channel.md)** - Be everywhere at once.
- **[Privacy-First Setup](https://github.com/minhlucvan/aswesome-moltbot/blob/main/tutorials/privacy-setup.md)** - Secure your data.

## 🛠️ The Skills Directory (Why we are here)

OpenClaw's power comes from **Skills** (plugins). Out of the box, it can do basic things. With skills, it becomes a god.

**Top Community Resources:**

*   **[Awesome OpenClaw Skills](https://github.com/VoltAgent/awesome-openclaw-skills):** The community-maintained "best of" list.
*   **[ClawdHub (Legacy)](https://clawdhub.com):** The original skill registry.
*   **Browse the OpenClaw Directory** to find verified skills for Email, Calendar, Coding, and more.
`;
  const startHereHtml = marked(startHereMd);
  const startHereContent = `
    <section class="category-hero">
      <div class="category-hero-content">
        <a href="/" class="back-link">← Home</a>
        <h1 class="category-hero-title">Start Here</h1>
        <p class="category-hero-desc">The Unofficial Guide to OpenClaw</p>
      </div>
    </section>
    <article class="skill-page-content" style="max-width: 800px; margin: 0 auto; padding: 40px 24px;">
      <div class="markdown-content">
        ${startHereHtml}
      </div>
    </article>
  `;
  const startHereDir = path.join(OUTPUT_DIR, 'start-here');
  if (!fs.existsSync(startHereDir)) fs.mkdirSync(startHereDir);
  fs.writeFileSync(path.join(startHereDir, 'index.html'), PAGE_TEMPLATE(startHereContent, 'Start Here', 'The Unofficial Guide to OpenClaw', '/start-here/'));

  console.log('Generating robots.txt...');
  const robotsTxt = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /*/references/',
    'Disallow: /*.md',
    'Disallow: /*/SKILL.md',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`
  ].join('\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'robots.txt'), `${robotsTxt}\n`);

  console.log('Generating sitemap.xml...');
  const todayUtc = new Date().toISOString().split('T')[0];
  const canonicalPaths = new Set([
    cleanPath('/'),
    cleanPath('/start-here/'),
    cleanPath('/security-auditor', false),
    ...filteredCategories.map(cat => cleanPath(`/${cat.id}/`)),
    ...filteredSkills.map(s => cleanPath(`/${s.catId}/${s.id}/`))
  ]);
  const sitemapUrls = [...canonicalPaths]
    .sort()
    .map(sitePath => `  <url><loc>${escapeXml(absoluteUrl(sitePath, sitePath !== '/security-auditor'))}</loc><lastmod>${todayUtc}</lastmod></url>`)
    .join('\n');
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls}
</urlset>
`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemapXml);

  console.log('\nBuild Finished Successfully!');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
