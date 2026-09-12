// ====================================================================
// module-loader.js — Lazy Module Loader for the AI Supply Chain Command
// Center. Replaces 19 individual <script> tags in cc-app/index.html with
// a single loader that defers module loading until the user requests it.
// --------------------------------------------------------------------
// Public API (window.__ccML):
//   - openLauncher()       — open the app-drawer grid
//   - closeLauncher()      — close the app-drawer grid
//   - openModule(id)       — load (if needed) + open a module by id
//   - isLoaded(id)         — boolean, has the module JS been loaded
//   - getRegistry()        — returns a copy of the module registry
// CSS prefix: cc-ml-
// ====================================================================
(function () {
  'use strict';

  if (window.__ccML) return; // guard against double-load

  // ------------------------------------------------------------------
  // MODULE REGISTRY
  // ------------------------------------------------------------------
  // 19 modules. Each entry:
  //   id           short identifier (used by openModule)
  //   name         display name
  //   description  one-line description (shown under name in the grid)
  //   icon         emoji
  //   shortcut     keyboard key (case-insensitive)
  //   gradient     CSS gradient for the card background accent
  //   scriptPath   relative path to the JS file
  //   openFn       global function reference (string) to call after load
  //   loaded       runtime flag — true once script has executed
  //   loading      runtime flag — true while script tag is in flight
  // ------------------------------------------------------------------
  var REGISTRY = [
    {
      id: 'order-management',
      name: 'Order Management',
      description: 'Create, ship, deliver & export orders with audit trail',
      icon: '📦',
      shortcut: 'O',
      gradient: 'linear-gradient(135deg, #10B981, #06B6D4)',
      scriptPath: '../js/order-management.js',
      openFn: 'window.__ccOM.openPanel',
      loaded: false,
      loading: false
    },
    {
      id: 'tender-management',
      name: 'Tender Management',
      description: 'Bidding, evaluation, compliance & document tracking',
      icon: '📋',
      shortcut: 'T',
      gradient: 'linear-gradient(135deg, #f59e0b, #ec4899)',
      scriptPath: '../js/tender-management.js',
      openFn: 'window.__ccTM.openPanel',
      loaded: false,
      loading: false
    },
    {
      id: 'platform-analytics',
      name: 'Platform Analytics',
      description: 'News, risk assessments & order trends across regions',
      icon: '📊',
      shortcut: 'A',
      gradient: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
      scriptPath: '../js/platform-analytics.js',
      openFn: 'window.__ccPA.open',
      loaded: false,
      loading: false
    },
    {
      id: 'dispatch-dashboard',
      name: 'Dispatch Dashboard',
      description: 'Ports, WMS, weather & digital twin what-if simulator',
      icon: '🚢',
      shortcut: 'D',
      gradient: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
      scriptPath: '../js/dispatch-dashboard.js',
      openFn: 'window.__ccDD.open',
      loaded: false,
      loading: false
    },
    {
      id: 'supplier-management',
      name: 'Supplier Management',
      description: 'Directory, performance scorecards & risk overview',
      icon: '🏭',
      shortcut: 'S',
      gradient: 'linear-gradient(135deg, #ef4444, #f59e0b)',
      scriptPath: '../js/supplier-management.js',
      openFn: 'window.__ccSM.open',
      loaded: false,
      loading: false
    },
    {
      id: 'compliance-monitoring',
      name: 'Compliance Monitoring',
      description: 'Regional scorecards, regulations & compliance heatmap',
      icon: '🛡️',
      shortcut: 'C',
      gradient: 'linear-gradient(135deg, #14b8a6, #22c55e)',
      scriptPath: '../js/compliance-monitoring.js',
      openFn: 'window.__ccCM.open',
      loaded: false,
      loading: false
    },
    {
      id: 'collaboration',
      name: 'Collaboration',
      description: 'Activity feed, tasks, messages & team directory',
      icon: '🤝',
      shortcut: 'B',
      gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
      scriptPath: '../js/collaboration.js',
      openFn: 'window.__ccCL.open',
      loaded: false,
      loading: false
    },
    {
      id: 'forecasting-space',
      name: 'Forecasting Space',
      description: 'Market trends, technology impact & evolution timeline',
      icon: '🔮',
      shortcut: 'F',
      gradient: 'linear-gradient(135deg, #6366f1, #06B6D4)',
      scriptPath: '../js/forecasting-space.js',
      openFn: 'window.__ccFS.open',
      loaded: false,
      loading: false
    },
    {
      id: 'api-marketplace',
      name: 'API Marketplace',
      description: '21 integrations, sandbox, code samples & multi-language',
      icon: '🔌',
      shortcut: 'P',
      gradient: 'linear-gradient(135deg, #22c55e, #14b8a6)',
      scriptPath: '../js/api-marketplace.js',
      openFn: 'window.__ccAM.open',
      loaded: false,
      loading: false
    },
    {
      id: 'nl-command',
      name: 'Natural Language Command',
      description: 'Ask questions in plain English — AI assistant with voice',
      icon: '💬',
      shortcut: 'N',
      gradient: 'linear-gradient(135deg, #06B6D4, #3b82f6)',
      scriptPath: '../js/nl-command.js',
      openFn: 'window.__ccNL.open',
      loaded: false,
      loading: false
    },
    {
      id: 'ai-report-generator',
      name: 'AI Report Generator',
      description: 'Generate, schedule & download AI-powered business reports',
      icon: '📈',
      shortcut: 'G',
      gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
      scriptPath: '../js/ai-report-generator.js',
      openFn: 'window.__ccRG.open',
      loaded: false,
      loading: false
    },
    {
      id: 'autonomous-agent',
      name: 'Autonomous Agent',
      description: 'Decision log, approval queue & autonomy settings',
      icon: '🤖',
      shortcut: 'X',
      gradient: 'linear-gradient(135deg, #f97316, #ef4444)',
      scriptPath: '../js/autonomous-agent.js',
      openFn: 'window.__ccAA.open',
      loaded: false,
      loading: false
    },
    {
      id: 'market-intelligence',
      name: 'Market Intelligence',
      description: 'Commodities, currencies, trade policy & market feed',
      icon: '🌐',
      shortcut: 'M',
      gradient: 'linear-gradient(135deg, #14b8a6, #0ea5e9)',
      scriptPath: '../js/market-intelligence.js',
      openFn: 'window.__ccMI.open',
      loaded: false,
      loading: false
    },
    {
      id: 'federated-learning',
      name: 'Federated Learning',
      description: 'Model training, privacy governance & benchmarking',
      icon: '🧠',
      shortcut: 'L',
      gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      scriptPath: '../js/federated-learning.js',
      openFn: 'window.__ccFL.open',
      loaded: false,
      loading: false
    },
    {
      id: 'esg',
      name: 'Carbon & ESG',
      description: 'Scope 1-3 emissions, offsets, net-zero planner & compliance',
      icon: '🌱',
      shortcut: 'E',
      gradient: 'linear-gradient(135deg,#059669,#10b8a6)',
      scriptPath: '../js/carbon-esg.js',
      openFn: 'window.__ccCE.open',
      loaded: false,
      loading: false
    },
    {
      id: 'network',
      name: 'Network Graph',
      description: 'Collaborative supply chain graph, risk & what-if simulator',
      icon: '🕸️',
      shortcut: 'V',
      gradient: 'linear-gradient(135deg,#2563eb,#06b6d4)',
      scriptPath: '../js/network-graph.js',
      openFn: 'window.__ccNG.open',
      loaded: false,
      loading: false
    },
    {
      id: 'iot',
      name: 'Edge & IoT',
      description: 'IoT device map, sensor streams, edge nodes & anomalies',
      icon: '📡',
      shortcut: 'I',
      gradient: 'linear-gradient(135deg,#ea580c,#f59e0b)',
      scriptPath: '../js/edge-iot.js',
      openFn: 'window.__ccEI.open',
      loaded: false,
      loading: false
    },
    {
      id: 'quantum',
      name: 'Quantum Ready',
      description: 'Quantum-ready algorithms, vendor partnerships & roadmap',
      icon: '⚛️',
      shortcut: 'Q',
      gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)',
      scriptPath: '../js/quantum-readiness.js',
      openFn: 'window.__ccQR.open',
      loaded: false,
      loading: false
    },
    {
      id: 'passport',
      name: 'Product Passport',
      description: 'EU DPP registry, traceability, compliance & QR scanner',
      icon: '🛢️',
      shortcut: 'Z',
      gradient: 'linear-gradient(135deg,#be185d,#ec4899)',
      scriptPath: '../js/product-passport.js',
      openFn: 'window.__ccPP.open',
      loaded: false,
      loading: false
    }
  ];

  // Quick lookup maps
  var byId = {};
  var byShortcut = {};
  REGISTRY.forEach(function (m) {
    byId[m.id] = m;
    byShortcut[m.shortcut.toLowerCase()] = m;
  });

  // ------------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------------
  var launcherOpen = false;
  var styleInjected = false;

  // ------------------------------------------------------------------
  // CSS — injected once. Prefix: cc-ml-
  // ------------------------------------------------------------------
  function injectStyles() {
    if (styleInjected) return;
    styleInjected = true;

    var css = [
      // -------- Floating launcher button --------
      '#cc-ml-launcher-btn {',
      '  position: fixed;',
      '  bottom: 60px;',
      '  right: 20px;',
      '  z-index: 10003;',
      '  width: 56px;',
      '  height: 56px;',
      '  border-radius: 16px;',
      '  background: linear-gradient(135deg, #14b8a6, #06B6D4);',
      '  color: #fff;',
      '  border: none;',
      '  cursor: pointer;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  box-shadow: 0 8px 24px rgba(20, 184, 166, 0.45);',
      '  transition: transform 0.2s ease, box-shadow 0.2s ease;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '}',
      '#cc-ml-launcher-btn:hover {',
      '  transform: translateY(-2px) scale(1.04);',
      '  box-shadow: 0 12px 32px rgba(20, 184, 166, 0.55);',
      '}',
      '#cc-ml-launcher-btn:active { transform: translateY(0) scale(0.98); }',
      '#cc-ml-launcher-btn:focus-visible { outline: 2px solid #14b8a6; outline-offset: 3px; }',
      '#cc-ml-launcher-btn svg { width: 26px; height: 26px; }',
      '#cc-ml-launcher-badge {',
      '  position: absolute;',
      '  top: -6px;',
      '  right: -6px;',
      '  background: #ef4444;',
      '  color: #fff;',
      '  font-size: 9px;',
      '  font-weight: 700;',
      '  padding: 2px 6px;',
      '  border-radius: 10px;',
      '  min-width: 18px;',
      '  text-align: center;',
      '  border: 2px solid var(--cc-ml-badge-border, #0a0a0a);',
      '  pointer-events: none;',
      '  letter-spacing: 0.02em;',
      '}',
      '#cc-ml-launcher-btn { position: fixed; }',

      // -------- App drawer overlay --------
      '#cc-ml-overlay {',
      '  position: fixed;',
      '  inset: 0;',
      '  z-index: 10004;',
      '  background: rgba(15, 23, 42, 0.65);',
      '  backdrop-filter: blur(8px);',
      '  -webkit-backdrop-filter: blur(8px);',
      '  display: flex;',
      '  align-items: flex-start;',
      '  justify-content: center;',
      '  overflow-y: auto;',
      '  padding: 40px 16px 80px;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  animation: cc-ml-fade-in 0.18s ease-out;',
      '}',
      'html.cc-ml-light #cc-ml-overlay { background: rgba(248, 250, 252, 0.78); }',
      '@keyframes cc-ml-fade-in { from { opacity: 0; } to { opacity: 1; } }',
      '@keyframes cc-ml-pop-in { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }',

      // -------- App drawer panel --------
      '#cc-ml-drawer {',
      '  width: 100%;',
      '  max-width: 1100px;',
      '  background: #0f172a;',
      '  color: #e2e8f0;',
      '  border: 1px solid rgba(148, 163, 184, 0.18);',
      '  border-radius: 18px;',
      '  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);',
      '  padding: 28px;',
      '  animation: cc-ml-pop-in 0.22s ease-out;',
      '}',
      'html.cc-ml-light #cc-ml-drawer {',
      '  background: #ffffff;',
      '  color: #0f172a;',
      '  border-color: rgba(15, 23, 42, 0.10);',
      '  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);',
      '}',

      // -------- Drawer header --------
      '#cc-ml-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }',
      '#cc-ml-title { font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.01em; }',
      '#cc-ml-subtitle { font-size: 13px; color: #94a3b8; margin: 4px 0 0; }',
      'html.cc-ml-light #cc-ml-subtitle { color: #64748b; }',
      '#cc-ml-close {',
      '  background: rgba(148, 163, 184, 0.10);',
      '  border: 1px solid rgba(148, 163, 184, 0.18);',
      '  color: inherit;',
      '  width: 34px; height: 34px;',
      '  border-radius: 10px;',
      '  font-size: 20px; line-height: 1;',
      '  cursor: pointer;',
      '  display: flex; align-items: center; justify-content: center;',
      '  transition: background 0.2s ease, transform 0.2s ease;',
      '  flex-shrink: 0;',
      '}',
      '#cc-ml-close:hover { background: rgba(239, 68, 68, 0.18); transform: rotate(90deg); }',

      // -------- Search box --------
      '#cc-ml-search-wrap { position: relative; margin-bottom: 18px; }',
      '#cc-ml-search {',
      '  width: 100%;',
      '  padding: 11px 14px 11px 38px;',
      '  background: rgba(148, 163, 184, 0.08);',
      '  border: 1px solid rgba(148, 163, 184, 0.20);',
      '  border-radius: 10px;',
      '  color: inherit;',
      '  font-size: 14px;',
      '  font-family: inherit;',
      '  outline: none;',
      '  transition: border-color 0.2s ease, box-shadow 0.2s ease;',
      '  box-sizing: border-box;',
      '}',
      '#cc-ml-search:focus { border-color: #14b8a6; box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.18); }',
      '#cc-ml-search::placeholder { color: #64748b; }',
      '#cc-ml-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; }',

      // -------- Grid + cards --------
      '#cc-ml-grid {',
      '  display: grid;',
      '  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));',
      '  gap: 14px;',
      '}',
      '.cc-ml-card {',
      '  position: relative;',
      '  background: rgba(148, 163, 184, 0.06);',
      '  border: 1px solid rgba(148, 163, 184, 0.14);',
      '  border-radius: 14px;',
      '  padding: 16px;',
      '  cursor: pointer;',
      '  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 8px;',
      '  text-align: left;',
      '  font-family: inherit;',
      '  color: inherit;',
      '  overflow: hidden;',
      '  min-height: 118px;',
      '}',
      'html.cc-ml-light .cc-ml-card { background: #f8fafc; border-color: rgba(15, 23, 42, 0.08); }',
      '.cc-ml-card::before {',
      '  content: "";',
      '  position: absolute;',
      '  inset: 0;',
      '  background: var(--cc-ml-card-gradient);',
      '  opacity: 0.10;',
      '  transition: opacity 0.18s ease;',
      '  pointer-events: none;',
      '}',
      '.cc-ml-card:hover {',
      '  transform: translateY(-3px);',
      '  border-color: rgba(20, 184, 166, 0.55);',
      '  box-shadow: 0 12px 28px rgba(20, 184, 166, 0.18);',
      '}',
      '.cc-ml-card:hover::before { opacity: 0.18; }',
      '.cc-ml-card:focus-visible { outline: 2px solid #14b8a6; outline-offset: 2px; }',
      '.cc-ml-card-icon { font-size: 26px; line-height: 1; }',
      '.cc-ml-card-name { font-size: 14px; font-weight: 700; margin: 0; }',
      '.cc-ml-card-desc { font-size: 11.5px; color: #94a3b8; margin: 0; line-height: 1.4; }',
      'html.cc-ml-light .cc-ml-card-desc { color: #64748b; }',
      '.cc-ml-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 6px; }',
      '.cc-ml-card-shortcut {',
      '  font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;',
      '  background: rgba(148, 163, 184, 0.18);',
      '  color: #cbd5e1;',
      '  padding: 2px 7px;',
      '  border-radius: 5px;',
      '  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;',
      '}',
      'html.cc-ml-light .cc-ml-card-shortcut { background: rgba(15, 23, 42, 0.08); color: #475569; }',
      '.cc-ml-card-status { font-size: 10px; color: #64748b; font-weight: 600; }',
      '.cc-ml-card-status.loaded { color: #22c55e; }',

      // -------- Empty state --------
      '#cc-ml-empty { text-align: center; padding: 40px 16px; color: #64748b; font-size: 14px; }',

      // -------- Loading spinner overlay --------
      '#cc-ml-loading {',
      '  position: fixed;',
      '  inset: 0;',
      '  z-index: 10005;',
      '  background: rgba(15, 23, 42, 0.55);',
      '  backdrop-filter: blur(4px);',
      '  -webkit-backdrop-filter: blur(4px);',
      '  display: flex; align-items: center; justify-content: center;',
      '  flex-direction: column; gap: 16px;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  color: #e2e8f0;',
      '  animation: cc-ml-fade-in 0.15s ease-out;',
      '}',
      'html.cc-ml-light #cc-ml-loading { background: rgba(248, 250, 252, 0.78); color: #0f172a; }',
      '.cc-ml-spinner {',
      '  width: 44px; height: 44px;',
      '  border: 4px solid rgba(20, 184, 166, 0.18);',
      '  border-top-color: #14b8a6;',
      '  border-radius: 50%;',
      '  animation: cc-ml-spin 0.8s linear infinite;',
      '}',
      '@keyframes cc-ml-spin { to { transform: rotate(360deg); } }',
      '#cc-ml-loading-text { font-size: 14px; font-weight: 600; }',

      // -------- Mobile responsive --------
      '@media (max-width: 768px) {',
      '  #cc-ml-launcher-btn { width: 48px; height: 48px; border-radius: 50%; bottom: 20px; right: 16px; }',
      '  #cc-ml-launcher-btn svg { width: 22px; height: 22px; }',
      '  #cc-ml-overlay { padding: 16px 10px 60px; }',
      '  #cc-ml-drawer { padding: 18px; border-radius: 14px; }',
      '  #cc-ml-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }',
      '  .cc-ml-card { padding: 12px; min-height: 102px; }',
      '  .cc-ml-card-icon { font-size: 22px; }',
      '  .cc-ml-card-name { font-size: 13px; }',
      '  .cc-ml-card-desc { font-size: 10.5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }',
      '  #cc-ml-title { font-size: 18px; }',
      '  #cc-ml-subtitle { font-size: 12px; }',
      '  /* Hide all per-module floating trigger buttons on mobile */',
      '  [id$="-trigger-btn"] { display: none !important; }',
      '}',
      '@media (max-width: 380px) {',
      '  #cc-ml-grid { grid-template-columns: 1fr; }',
      '}'
    ].join('\n');

    var style = document.createElement('style');
    style.id = 'cc-ml-styles';
    style.textContent = css;
    document.head.appendChild(style);

    // Light/dark observer — sync with the page theme
    syncTheme();
  }

  // ------------------------------------------------------------------
  // THEME SYNC — watches html.dark / html.light class
  // ------------------------------------------------------------------
  function syncTheme() {
    var html = document.documentElement;
    var isDark = html.classList.contains('dark') ||
                 !html.classList.contains('light') &&
                 window.matchMedia &&
                 window.matchMedia('(prefers-color-scheme: light)').matches
                   ? false // if .dark present → dark; if .light present → light
                   : true;
    // Re-evaluate cleanly
    if (html.classList.contains('light')) isDark = false;
    else if (html.classList.contains('dark')) isDark = true;
    else isDark = true; // default dark (matches the app)

    if (isDark) {
      html.classList.remove('cc-ml-light');
    } else {
      html.classList.add('cc-ml-light');
    }
  }

  // Observe theme changes on <html>
  function watchTheme() {
    var observer = new MutationObserver(function () { syncTheme(); });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  // ------------------------------------------------------------------
  // SVG ICONS
  // ------------------------------------------------------------------
  var GRID_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>';
  var SEARCH_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';

  // ------------------------------------------------------------------
  // LAUNCHER BUTTON
  // ------------------------------------------------------------------
  function injectLauncherButton() {
    if (document.getElementById('cc-ml-launcher-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'cc-ml-launcher-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open Module Launcher — see all 19 modules');
    btn.title = 'Module Launcher (click to see all modules)';
    btn.innerHTML = GRID_ICON + '<span id="cc-ml-launcher-badge">19</span>';
    btn.onclick = function (e) {
      e.preventDefault();
      openLauncher();
    };
    document.body.appendChild(btn);
  }

  // ------------------------------------------------------------------
  // APP DRAWER
  // ------------------------------------------------------------------
  function openLauncher() {
    if (launcherOpen) return;
    launcherOpen = true;
    injectStyles();

    var overlay = document.createElement('div');
    overlay.id = 'cc-ml-overlay';

    var drawer = document.createElement('div');
    drawer.id = 'cc-ml-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Module Launcher');

    drawer.innerHTML =
      '<div id="cc-ml-header">' +
        '<div>' +
          '<h2 id="cc-ml-title">Module Launcher</h2>' +
          '<p id="cc-ml-subtitle">19 modules · click a card to open · or press a shortcut key</p>' +
        '</div>' +
        '<button id="cc-ml-close" type="button" aria-label="Close launcher">×</button>' +
      '</div>' +
      '<div id="cc-ml-search-wrap">' +
        SEARCH_ICON +
        '<input id="cc-ml-search" type="search" placeholder="Search modules by name, shortcut or description…" autocomplete="off" />' +
      '</div>' +
      '<div id="cc-ml-grid"></div>';

    overlay.appendChild(drawer);
    document.body.appendChild(overlay);

    // Render the grid
    renderGrid('');

    // Wire up events
    document.getElementById('cc-ml-close').onclick = function () { closeLauncher(); };
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeLauncher();
    });

    var searchInput = document.getElementById('cc-ml-search');
    searchInput.addEventListener('input', function () {
      renderGrid(searchInput.value);
    });

    // ESC closes the launcher (but only if no module panel is open on top)
    document.addEventListener('keydown', onLauncherKeydown);

    // Focus the search input for fast keyboard filtering
    setTimeout(function () { searchInput.focus(); }, 50);
  }

  function closeLauncher() {
    var overlay = document.getElementById('cc-ml-overlay');
    if (overlay) overlay.remove();
    launcherOpen = false;
    document.removeEventListener('keydown', onLauncherKeydown);
  }

  function onLauncherKeydown(e) {
    if (e.key === 'Escape') {
      // Don't close the launcher if a module panel is open on top — let
      // the module's own ESC handler close its panel first.
      if (!anyModulePanelOpen()) {
        closeLauncher();
      }
    }
  }

  function anyModulePanelOpen() {
    // Heuristic — check for any of the known panel overlay IDs
    var panelIds = [
      'cc-om-panel-overlay', 'cc-tm-panel-overlay', 'cc-pa-overlay',
      'cc-dd-overlay', 'cc-sm-overlay', 'cc-cm-overlay', 'cc-cl-overlay',
      'cc-fs-overlay', 'cc-am-overlay', 'cc-nl-overlay', 'cc-rg-overlay',
      'cc-aa-overlay', 'cc-mi-overlay', 'cc-fl-overlay',
      'cc-ce-overlay', 'cc-ng-overlay', 'cc-ei-overlay',
      'cc-qr-overlay', 'cc-pp-overlay'
    ];
    for (var i = 0; i < panelIds.length; i++) {
      if (document.getElementById(panelIds[i])) return true;
    }
    return false;
  }

  // ------------------------------------------------------------------
  // RENDER GRID — supports search filtering
  // ------------------------------------------------------------------
  function renderGrid(query) {
    var grid = document.getElementById('cc-ml-grid');
    if (!grid) return;

    var q = (query || '').trim().toLowerCase();
    var matches = REGISTRY.filter(function (m) {
      if (!q) return true;
      return m.name.toLowerCase().indexOf(q) !== -1 ||
             m.description.toLowerCase().indexOf(q) !== -1 ||
             m.id.toLowerCase().indexOf(q) !== -1 ||
             m.shortcut.toLowerCase() === q;
    });

    if (matches.length === 0) {
      grid.innerHTML = '<div id="cc-ml-empty">No modules match “' + escapeHtml(query) + '”.</div>';
      return;
    }

    grid.innerHTML = '';
    matches.forEach(function (m) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'cc-ml-card';
      card.style.setProperty('--cc-ml-card-gradient', m.gradient);
      card.setAttribute('aria-label', 'Open ' + m.name + ' (shortcut ' + m.shortcut + ')');
      card.innerHTML =
        '<span class="cc-ml-card-icon">' + m.icon + '</span>' +
        '<h3 class="cc-ml-card-name">' + escapeHtml(m.name) + '</h3>' +
        '<p class="cc-ml-card-desc">' + escapeHtml(m.description) + '</p>' +
        '<div class="cc-ml-card-footer">' +
          '<span class="cc-ml-card-shortcut">' + m.shortcut + '</span>' +
          '<span class="cc-ml-card-status' + (m.loaded ? ' loaded' : '') + '">' +
            (m.loaded ? '✓ Ready' : (m.loading ? 'Loading…' : 'Tap to load')) +
          '</span>' +
        '</div>';
      card.onclick = function () {
        openModule(m.id, { fromLauncher: true });
      };
      grid.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ------------------------------------------------------------------
  // LOAD + OPEN MODULE
  // ------------------------------------------------------------------
  function openModule(id, opts) {
    opts = opts || {};
    var m = byId[id];
    if (!m) {
      console.warn('[module-loader] Unknown module id:', id);
      return;
    }

    // Close the launcher first if it's open
    if (launcherOpen) closeLauncher();

    if (m.loaded) {
      callOpenFn(m);
      return;
    }

    if (m.loading) {
      // Already loading — wait for it to finish, then open
      waitForLoading(m, function () { callOpenFn(m); });
      return;
    }

    // Start loading
    m.loading = true;
    showLoadingSpinner(m.name);

    var script = document.createElement('script');
    script.src = m.scriptPath;
    script.async = true;
    script.dataset.ccModule = m.id;

    script.onload = function () {
      m.loading = false;
      m.loaded = true;
      hideLoadingSpinner();
      // Small delay so the module's own init (which may inject a button +
      // register its own keydown handler) has fully run.
      setTimeout(function () {
        callOpenFn(m);
      }, 60);
      console.log('[module-loader] Loaded module:', m.id, '(' + m.scriptPath + ')');
    };

    script.onerror = function () {
      m.loading = false;
      hideLoadingSpinner();
      console.error('[module-loader] Failed to load module:', m.id, m.scriptPath);
      // Show a small inline error toast
      showErrorToast('Could not load ' + m.name + '. Please check your connection and try again.');
    };

    document.head.appendChild(script);
  }

  function waitForLoading(m, cb) {
    showLoadingSpinner(m.name);
    var interval = setInterval(function () {
      if (m.loaded) {
        clearInterval(interval);
        hideLoadingSpinner();
        cb();
      }
    }, 50);
  }

  // ------------------------------------------------------------------
  // CALL OPEN FUNCTION — with fallback for openPanel vs open
  // ------------------------------------------------------------------
  function callOpenFn(m) {
    // Resolve the namespace + method from the openFn string.
    // Supports formats like "window.__ccOM.open" and "window.__ccTM.openPanel"
    var parts = m.openFn.replace(/^window\./, '').split('.');
    var ctx = window;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!ctx[parts[i]]) {
        console.warn('[module-loader] Namespace missing for', m.id, '—', m.openFn);
        return;
      }
      ctx = ctx[parts[i]];
    }
    var methodName = parts[parts.length - 1];
    var fn = ctx[methodName];

    // Fallback: try .openPanel if .open is missing, or .open if .openPanel is missing
    if (typeof fn !== 'function') {
      if (methodName === 'open' && typeof ctx.openPanel === 'function') {
        fn = ctx.openPanel;
      } else if (methodName === 'openPanel' && typeof ctx.open === 'function') {
        fn = ctx.open;
      } else {
        console.warn('[module-loader] Open function not found for', m.id, '—', m.openFn);
        return;
      }
    }

    try {
      fn.call(ctx);
    } catch (err) {
      console.error('[module-loader] Error opening module', m.id, err);
    }
  }

  // ------------------------------------------------------------------
  // LOADING SPINNER
  // ------------------------------------------------------------------
  function showLoadingSpinner(moduleName) {
    if (document.getElementById('cc-ml-loading')) return;
    var overlay = document.createElement('div');
    overlay.id = 'cc-ml-loading';
    overlay.innerHTML =
      '<div class="cc-ml-spinner" role="status" aria-label="Loading module"></div>' +
      '<div id="cc-ml-loading-text">Loading ' + escapeHtml(moduleName) + '…</div>';
    document.body.appendChild(overlay);
  }

  function hideLoadingSpinner() {
    var overlay = document.getElementById('cc-ml-loading');
    if (overlay) overlay.remove();
  }

  // ------------------------------------------------------------------
  // ERROR TOAST
  // ------------------------------------------------------------------
  function showErrorToast(message) {
    var toast = document.createElement('div');
    toast.id = 'cc-ml-error-toast';
    toast.style.cssText = [
      'position: fixed',
      'bottom: 130px',
      'right: 20px',
      'z-index: 10006',
      'background: #ef4444',
      'color: #fff',
      'padding: 10px 16px',
      'border-radius: 8px',
      'font-size: 13px',
      'font-weight: 600',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'box-shadow: 0 6px 18px rgba(239, 68, 68, 0.4)',
      'max-width: 320px'
    ].join(';');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4500);
  }

  // ------------------------------------------------------------------
  // KEYBOARD SHORTCUTS — single global listener
  // ------------------------------------------------------------------
  function registerKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
      // Skip if user is typing in an input/textarea/contenteditable
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      // Skip if modifier keys are held (let browser / other handlers work)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      var key = e.key.toLowerCase();
      var m = byShortcut[key];
      if (!m) return;

      // If the launcher is open and the user pressed a module shortcut,
      // close the launcher and open the module instead.
      if (m.loaded) {
        // Module's own keydown listener will handle the open. But to be
        // safe (and to support the "from launcher" UX) we also call it.
        // The module's own handler guards against double-open via the
        // panel-overlay ID check.
        callOpenFn(m);
        if (launcherOpen) closeLauncher();
        e.preventDefault();
      } else {
        // Module not yet loaded — load it (which will open it)
        openModule(m.id);
        if (launcherOpen) closeLauncher();
        e.preventDefault();
      }
    });
  }

  // ------------------------------------------------------------------
  // PUBLIC API
  // ------------------------------------------------------------------
  window.__ccML = {
    openLauncher: openLauncher,
    closeLauncher: closeLauncher,
    openModule: openModule,
    isLoaded: function (id) { return !!(byId[id] && byId[id].loaded); },
    getRegistry: function () {
      return REGISTRY.map(function (m) {
        return {
          id: m.id, name: m.name, description: m.description, icon: m.icon,
          shortcut: m.shortcut, gradient: m.gradient, scriptPath: m.scriptPath,
          openFn: m.openFn, loaded: m.loaded, loading: m.loading
        };
      });
    }
  };

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  function init() {
    injectStyles();
    watchTheme();
    injectLauncherButton();
    registerKeyboardShortcuts();
    console.log('[module-loader.js] Initialised — 19 modules registered, launcher button + shortcuts active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
