// ====================================================================
// quantum-readiness.js — Quantum Computing Readiness Dashboard
// ====================================================================
// Quantum computing strategy & roadmap for supply chain optimization:
//   1. Overview: KPI cards (quantum-ready algorithms, speedup, partnerships, timeline)
//   2. Optimization Problems: TSP, VRP, portfolio, slotting — marked quantum-ready
//   3. Quantum vs Classical: comparison table (problem, classical, quantum, speedup)
//   4. Partnerships: IBM Quantum, Google Quantum AI, D-Wave, IonQ mockup cards
//   5. Roadmap: timeline 2026-2031 showing quantum adoption milestones
//
// Architecture: IIFE + modal + sidebar pattern. No floating button.
// CSS prefix: cc-qr-  ·  Global API: window.__ccQR.open()
// ====================================================================
(function() {
  'use strict';

  if (window.__quantumReadyLoaded) return;
  window.__quantumReadyLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_quantum_readiness_db_v1';

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(a) {
    if (a >= 1e6) return '$' + (a / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (a / 1e3).toFixed(0) + 'k';
    return '$' + a.toFixed(0);
  }

  // ------------------------------------------------------------------
  // STATIC DATA
  // ------------------------------------------------------------------
  const PROBLEMS = [
    { id: 'TSP', name: 'Traveling Salesman Problem', cat: 'Routing', classical: 'O(n!)', quantum: 'O(√n · poly(n))', speedup: 2400, status: 'Pilot', qubits: 256, desc: 'Find shortest route visiting N nodes once. QAOA + quantum annealing.' },
    { id: 'VRP', name: 'Vehicle Routing Problem', cat: 'Routing', classical: 'O(2^n)', quantum: 'O(poly(n) · log n)', speedup: 1800, status: 'Pilot', qubits: 384, desc: 'Multi-vehicle route optimization with capacity & time constraints.' },
    { id: 'PORT', name: 'Portfolio Optimization', cat: 'Finance', classical: 'O(2^n)', quantum: 'O(n²)', speedup: 950, status: 'Research', qubits: 512, desc: 'Markowitz mean-variance optimization across N assets.' },
    { id: 'SLOT', name: 'Warehouse Slotting', cat: 'Operations', classical: 'O(n log n)', quantum: 'O(log n)', speedup: 320, status: 'Production', qubits: 128, desc: 'Optimal item placement in pick-faces to minimize travel time.' },
    { id: 'KNAP', name: 'Multi-Knapsack Packing', cat: 'Logistics', classical: 'O(2^n)', quantum: 'O(poly(n))', speedup: 680, status: 'Pilot', qubits: 256, desc: 'Bin packing with weight, volume & priority constraints.' },
    { id: 'SCHED', name: 'Job Shop Scheduling', cat: 'Manufacturing', classical: 'O(n^m)', quantum: 'O(poly(n))', speedup: 1200, status: 'Research', qubits: 448, desc: 'Production scheduling across M machines and N jobs.' },
    { id: 'NETWK', name: 'Network Flow Optimization', cat: 'Logistics', classical: 'O(V·E²)', quantum: 'O(√V · E)', speedup: 410, status: 'Production', qubits: 96, desc: 'Max-flow / min-cut for supply chain network design.' },
    { id: 'DEMAND', name: 'Demand Forecasting ML', cat: 'AI/ML', classical: 'O(n²)', quantum: 'O(n·log n)', speedup: 180, status: 'Production', qubits: 64, desc: 'Quantum kernel methods for high-dimensional demand prediction.' },
    { id: 'RISK', name: 'Supply Risk Simulation', cat: 'Risk', classical: 'O(2^n)', quantum: 'O(poly(n))', speedup: 540, status: 'Pilot', qubits: 320, desc: 'Monte Carlo simulation with quantum amplitude estimation.' }
  ];

  const PARTNERSHIPS = [
    { id: 'ibm', name: 'IBM Quantum', logo: '🔵', qubits: 1121, topology: 'Heavy-hex', access: 'Cloud (IBM Quantum Network)', status: 'Active', since: '2024-03', projects: 12, color: '#3b82f6', desc: 'Eagle & Heron processors. 127-qubit Eagle, 1,121-qubit Condor. Qiskit runtime.' },
    { id: 'google', name: 'Google Quantum AI', logo: '🟡', qubits: 70, topology: '2D grid (Sycamore)', access: 'Limited partnership', status: 'Active', since: '2024-09', projects: 4, color: '#f59e0b', desc: 'Willow processor with quantum error correction. Cirq framework.' },
    { id: 'dwave', name: 'D-Wave Systems', logo: '🟢', qubits: 5640, topology: 'Pegasus (annealer)', access: 'Leap cloud service', status: 'Active', since: '2023-06', projects: 18, color: '#10b981', desc: 'Advantage system annealer. Specialized for QUBO / Ising optimization problems.' },
    { id: 'ionq', name: 'IonQ', logo: '🟣', qubits: 32, topology: 'Linear ion trap', access: 'Cloud (AWS / Azure)', status: 'Active', since: '2024-11', projects: 6, color: '#8b5cf6', desc: 'Forte processor with all-to-all connectivity. Trapped-ion qubits, low error rates.' },
    { id: 'rigetti', name: 'Rigetti Computing', logo: '🔴', qubits: 84, topology: 'Square lattice', access: 'Forest SDK / QCS', status: 'Evaluating', since: '2025-02', projects: 2, color: '#ef4444', desc: 'Ankaa-2 superconducting processor. Hybrid quantum-classical workflows.' },
    { id: 'pasqal', name: 'Pasqal', logo: '⚪', qubits: 100, topology: '2D / 3D neutral atom', access: 'Cloud (partner)', status: 'Evaluating', since: '2025-04', projects: 1, color: '#94a3b8', desc: 'Neutral atom processor with 100+ qubit arrays. Analog quantum simulation.' }
  ];

  const ROADMAP = [
    { year: 2026, q1: 'Identify 3 pilot use cases', q2: 'Qiskit training program', q3: 'IBM Quantum Network onboarding', q4: 'First TSP pilot on 32-qubit simulator', milestone: 'Foundation & Training' },
    { year: 2027, q1: 'D-Wave pilot for warehouse slotting', q2: 'QAOA algorithm development', q3: 'Production slotting on D-Wave', q4: 'Hybrid orchestration framework', milestone: 'First Production Workload' },
    { year: 2028, q1: 'IonQ partnership for VRP', q2: 'Error-mitigation toolkit', q3: 'Quantum-classical demand forecasting', q4: '12 quantum-trained engineers', milestone: 'Multi-Algorithm Portfolio' },
    { year: 2029, q1: 'Real-time VRP in production', q2: 'Quantum risk simulation pilot', q3: 'Portfolio optimization research', q4: 'Quantum-ready API marketplace', milestone: 'Real-Time Operations' },
    { year: 2030, q1: 'Error-corrected algorithms', q2: 'Cross-vendor workload portability', q3: 'Quantum ML at scale', q4: 'Patent portfolio: 8 filings', milestone: 'Scale & IP Leadership' },
    { year: 2031, q1: 'Full quantum-classical hybrid cloud', q2: 'Quantum advantage in 3 use cases', q3: 'Industry consortium leadership', q4: 'Quantum-native supply chain platform', milestone: 'Quantum Advantage' }
  ];

  // ------------------------------------------------------------------
  // DB INIT
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.generated) return db;
    db = {
      problems: PROBLEMS,
      partnerships: PARTNERSHIPS,
      roadmap: ROADMAP,
      generated: true,
      meta: { created: new Date().toISOString(), version: 1, lastUpdate: new Date().toISOString() }
    };
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }

  // ------------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------------
  let currentView = 'overview';

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-qr-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-qr-styles';
    style.textContent = `
      .cc-qr-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10012; background: rgba(14,8,22,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-qr-sidebar { width: 220px; flex-shrink: 0; background: rgba(28,16,46,0.6); border-right: 1px solid rgba(124,58,237,0.18); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-qr-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(124,58,237,0.18); margin-bottom: 12px; }
      .cc-qr-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; background: linear-gradient(135deg, #7c3aed, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .cc-qr-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-qr-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; font-family: inherit; }
      .cc-qr-nav-item:hover { background: rgba(124,58,237,0.06); color: #e2e8f0; }
      .cc-qr-nav-item.active { background: rgba(124,58,237,0.1); color: #a855f7; border-left-color: #a855f7; }
      .cc-qr-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-qr-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-qr-close { position: fixed; top: 16px; right: 20px; z-index: 10013; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-qr-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-qr-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(124,58,237,0.18); flex-wrap: wrap; gap: 12px; }
      .cc-qr-page-title { font-size: 22px; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #7c3aed, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .cc-qr-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; font-weight: 600; -webkit-text-fill-color: #fff; }
      .cc-qr-live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #a855f7; font-weight: 600; }
      .cc-qr-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #a855f7; animation: cc-qr-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-qr-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .cc-qr-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-qr-card { background: linear-gradient(135deg, rgba(124,58,237,0.06), rgba(168,85,247,0.06)); border: 1px solid rgba(124,58,237,0.22); border-radius: 12px; padding: 16px; }
      .cc-qr-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 6px; }
      .cc-qr-card-value { font-size: 24px; font-weight: 800; color: #fff; }
      .cc-qr-card-delta { font-size: 11px; margin-top: 4px; color: #94a3b8; }
      .cc-qr-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(124,58,237,0.18); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
      .cc-qr-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
      .cc-qr-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-qr-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(124,58,237,0.2); }
      .cc-qr-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; vertical-align: middle; }
      .cc-qr-table tr:hover td { background: rgba(124,58,237,0.05); }
      .cc-qr-scroll { max-height: 520px; overflow-y: auto; border: 1px solid rgba(124,58,237,0.18); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(124,58,237,0.4) transparent; }
      .cc-qr-scroll::-webkit-scrollbar { width: 8px; }
      .cc-qr-scroll::-webkit-scrollbar-track { background: transparent; }
      .cc-qr-scroll::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 4px; }
      .cc-qr-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
      .cc-qr-status-prod { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-qr-status-pilot { background: rgba(168,85,247,0.15); color: #a855f7; border: 1px solid rgba(168,85,247,0.3); }
      .cc-qr-status-research { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-qr-status-active { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-qr-status-eval { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-qr-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
      .cc-qr-tile { background: linear-gradient(135deg, rgba(124,58,237,0.05), rgba(168,85,247,0.05)); border: 1px solid rgba(124,58,237,0.22); border-radius: 12px; padding: 18px; transition: border-color 0.2s, transform 0.2s; }
      .cc-qr-tile:hover { border-color: rgba(124,58,237,0.5); transform: translateY(-3px); }
      .cc-qr-tile-logo { font-size: 32px; margin-bottom: 8px; }
      .cc-qr-tile-name { font-size: 15px; font-weight: 700; color: #fff; }
      .cc-qr-tile-sub { font-size: 11px; color: #a855f7; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
      .cc-qr-tile-desc { font-size: 12px; color: #94a3b8; margin-top: 8px; line-height: 1.5; }
      .cc-qr-tile-meta { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-top: 12px; font-size: 11px; }
      .cc-qr-tile-meta-item { background: rgba(124,58,237,0.08); padding: 8px; border-radius: 6px; }
      .cc-qr-tile-meta-label { color: #64748b; font-size: 10px; }
      .cc-qr-tile-meta-value { color: #fff; font-weight: 700; margin-top: 2px; }
      .cc-qr-bar-track { display: inline-block; width: 100px; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; vertical-align: middle; margin-right: 6px; }
      .cc-qr-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #7c3aed, #a855f7); }
      .cc-qr-timeline { position: relative; padding-left: 32px; }
      .cc-qr-timeline::before { content: ''; position: absolute; left: 14px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, #7c3aed, #a855f7); }
      .cc-qr-timeline-item { position: relative; padding: 16px 0 16px 24px; }
      .cc-qr-timeline-item::before { content: ''; position: absolute; left: -22px; top: 22px; width: 14px; height: 14px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #a855f7); box-shadow: 0 0 0 4px rgba(124,58,237,0.2); }
      .cc-qr-timeline-year { font-size: 16px; font-weight: 800; color: #a855f7; }
      .cc-qr-timeline-title { font-size: 14px; font-weight: 700; color: #fff; margin-top: 2px; }
      .cc-qr-timeline-desc { font-size: 12px; color: #94a3b8; margin-top: 6px; line-height: 1.5; }
      .cc-qr-timeline-quarters { display: grid; grid-template-columns: repeat(2,1fr); gap: 6px; margin-top: 10px; }
      .cc-qr-timeline-q { background: rgba(124,58,237,0.06); padding: 6px 10px; border-radius: 6px; font-size: 11px; color: #cbd5e1; border-left: 2px solid #a855f7; }
      .cc-qr-timeline-q strong { color: #a855f7; font-weight: 700; }
      @media (max-width: 767px) {
        .cc-qr-modal { flex-direction: column; }
        .cc-qr-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-qr-sidebar-brand { display: none; }
        .cc-qr-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-qr-nav-item.active { border-bottom-color: #a855f7; border-left-color: transparent; }
        .cc-qr-main { padding: 12px 12px 20px; }
        .cc-qr-cards { grid-template-columns: repeat(2, 1fr); }
        .cc-qr-timeline-quarters { grid-template-columns: 1fr; }
      }
      html:not(.dark) .cc-qr-modal { background: rgba(250,247,253,0.99); color: #1e293b; }
      html:not(.dark) .cc-qr-sidebar { background: rgba(243,236,251,0.8); border-right-color: rgba(124,58,237,0.12); }
      html:not(.dark) .cc-qr-sidebar-title { background: linear-gradient(135deg, #6d28d9, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      html:not(.dark) .cc-qr-nav-item { color: #64748b; }
      html:not(.dark) .cc-qr-nav-item:hover { background: rgba(124,58,237,0.06); color: #1e293b; }
      html:not(.dark) .cc-qr-nav-item.active { background: rgba(124,58,237,0.1); color: #6d28d9; }
      html:not(.dark) .cc-qr-page-title { background: linear-gradient(135deg, #6d28d9, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      html:not(.dark) .cc-qr-header { border-bottom-color: rgba(124,58,237,0.1); }
      html:not(.dark) .cc-qr-card { background: rgba(124,58,237,0.05); border-color: rgba(124,58,237,0.2); }
      html:not(.dark) .cc-qr-card-label { color: #64748b; }
      html:not(.dark) .cc-qr-card-value { color: #0f172a; }
      html:not(.dark) .cc-qr-card-delta { color: #64748b; }
      html:not(.dark) .cc-qr-section { background: rgba(0,0,0,0.02); border-color: rgba(124,58,237,0.15); }
      html:not(.dark) .cc-qr-section-title { color: #1e293b; }
      html:not(.dark) .cc-qr-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-qr-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-qr-table tr:hover td { background: rgba(124,58,237,0.04); }
      html:not(.dark) .cc-qr-tile { background: rgba(124,58,237,0.04); border-color: rgba(124,58,237,0.2); }
      html:not(.dark) .cc-qr-tile-name { color: #0f172a; }
      html:not(.dark) .cc-qr-tile-desc { color: #64748b; }
      html:not(.dark) .cc-qr-tile-meta-value { color: #0f172a; }
      html:not(.dark) .cc-qr-tile-meta-item { background: rgba(124,58,237,0.06); }
      html:not(.dark) .cc-qr-timeline-title { color: #0f172a; }
      html:not(.dark) .cc-qr-timeline-desc { color: #64748b; }
      html:not(.dark) .cc-qr-timeline-q { background: rgba(124,58,237,0.05); color: #334155; }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    initDatabase();
    const overlay = document.createElement('div');
    overlay.id = 'cc-qr-overlay';
    overlay.className = 'cc-qr-modal';
    overlay.innerHTML = `
      <button class="cc-qr-close" onclick="window.__ccQR.close()" aria-label="Close">×</button>
      <div class="cc-qr-sidebar">
        <div class="cc-qr-sidebar-brand">
          <div class="cc-qr-sidebar-title">⚛️ Quantum Ready</div>
          <div class="cc-qr-sidebar-sub">Quantum Computing Strategy</div>
        </div>
        <button class="cc-qr-nav-item ${currentView==='overview'?'active':''}" onclick="window.__ccQR.setView('overview')"><span class="cc-qr-nav-icon">📊</span> Overview</button>
        <button class="cc-qr-nav-item ${currentView==='problems'?'active':''}" onclick="window.__ccQR.setView('problems')"><span class="cc-qr-nav-icon">🧩</span> Optimization Problems</button>
        <button class="cc-qr-nav-item ${currentView==='compare'?'active':''}" onclick="window.__ccQR.setView('compare')"><span class="cc-qr-nav-icon">⚡</span> Quantum vs Classical</button>
        <button class="cc-qr-nav-item ${currentView==='partners'?'active':''}" onclick="window.__ccQR.setView('partners')"><span class="cc-qr-nav-icon">🤝</span> Partnerships</button>
        <button class="cc-qr-nav-item ${currentView==='roadmap'?'active':''}" onclick="window.__ccQR.setView('roadmap')"><span class="cc-qr-nav-icon">🗺️</span> Roadmap</button>
      </div>
      <div class="cc-qr-main" id="cc-qr-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const container = document.getElementById('cc-qr-content');
    if (!container) return;
    if (currentView === 'overview') renderOverview(container);
    else if (currentView === 'problems') renderProblems(container);
    else if (currentView === 'compare') renderCompare(container);
    else if (currentView === 'partners') renderPartners(container);
    else if (currentView === 'roadmap') renderRoadmap(container);
    document.querySelectorAll('.cc-qr-nav-item').forEach(item => {
      const oc = item.getAttribute('onclick') || '';
      item.classList.toggle('active', oc.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // 1. OVERVIEW
  // ------------------------------------------------------------------
  function renderOverview(c) {
    const db = initDatabase();
    const avgSpeedup = Math.round(db.problems.reduce((s, p) => s + p.speedup, 0) / db.problems.length);
    const inProduction = db.problems.filter(p => p.status === 'Production').length;
    const totalQubits = db.partnerships.reduce((s, p) => s + p.qubits, 0);
    c.innerHTML = `
      <div class="cc-qr-header">
        <h2 class="cc-qr-page-title">⚛️ Quantum Readiness Overview <span class="cc-qr-page-badge">2026-2031</span></h2>
        <div class="cc-qr-live-indicator"><div class="cc-qr-live-dot"></div> Strategy active</div>
      </div>
      <div class="cc-qr-cards">
        <div class="cc-qr-card"><div class="cc-qr-card-label">Quantum-Ready Algorithms</div><div class="cc-qr-card-value" style="color:#a855f7">${db.problems.length}</div><div class="cc-qr-card-delta">${inProduction} in production</div></div>
        <div class="cc-qr-card"><div class="cc-qr-card-label">Avg Speedup Factor</div><div class="cc-qr-card-value">${avgSpeedup.toLocaleString()}×</div><div class="cc-qr-card-delta">vs classical solvers</div></div>
        <div class="cc-qr-card"><div class="cc-qr-card-label">Active Partnerships</div><div class="cc-qr-card-value" style="color:#22c55e">${db.partnerships.filter(p=>p.status==='Active').length}</div><div class="cc-qr-card-delta">${db.partnerships.filter(p=>p.status==='Evaluating').length} under evaluation</div></div>
        <div class="cc-qr-card"><div class="cc-qr-card-label">Total Qubit Access</div><div class="cc-qr-card-value" style="color:#a855f7">${totalQubits.toLocaleString()}</div><div class="cc-qr-card-delta">across ${db.partnerships.length} vendors</div></div>
      </div>
      <div class="cc-qr-section">
        <div class="cc-qr-section-title">⚡ Top Quantum Speedups (vs classical solvers)</div>
        <div style="display:flex;align-items:flex-end;gap:10px;height:240px;padding:0 4px">
          ${db.problems.slice().sort((a,b)=>b.speedup-a.speedup).slice(0,9).map(p => {
            const pct = (p.speedup / 2400) * 100;
            const color = p.status === 'Production' ? '#22c55e' : p.status === 'Pilot' ? '#a855f7' : '#f59e0b';
            return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
                <div style="font-size:11px;font-weight:700;color:#e2e8f0">${p.speedup}×</div>
                <div style="width:100%;max-width:50px;border-radius:4px 4px 0 0;min-height:4px;background:${color};height:${pct}%;cursor:pointer;transition:opacity 0.2s" title="${p.name}: ${p.speedup}× speedup (${p.status})"></div>
                <div style="font-size:9px;color:#94a3b8;text-align:center;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.id}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top:12px;display:flex;gap:16px;font-size:11px;color:#94a3b8;flex-wrap:wrap">
          <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:#22c55e;border-radius:2px"></span> Production</span>
          <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:#a855f7;border-radius:2px"></span> Pilot</span>
          <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:#f59e0b;border-radius:2px"></span> Research</span>
        </div>
      </div>
      <div class="cc-qr-section">
        <div class="cc-qr-section-title">🎯 Strategic Highlights</div>
        <div class="cc-qr-grid-2">
          <div class="cc-qr-tile">
            <div class="cc-qr-tile-logo">🏆</div>
            <div class="cc-qr-tile-name">First quantum advantage targeted by 2031</div>
            <div class="cc-qr-tile-sub">Milestone</div>
            <div class="cc-qr-tile-desc">Quantum advantage expected in 3 use cases: VRP, TSP, and supply risk simulation. Goal: 2 production workloads by 2029.</div>
          </div>
          <div class="cc-qr-tile">
            <div class="cc-qr-tile-logo">🧠</div>
            <div class="cc-qr-tile-name">12 quantum-trained engineers by 2028</div>
            <div class="cc-qr-tile-sub">Talent</div>
            <div class="cc-qr-tile-desc">Qiskit & Cirq training program. Currently 4 engineers certified, targeting 12 by end of 2028 with 50% female participation.</div>
          </div>
          <div class="cc-qr-tile">
            <div class="cc-qr-tile-logo">🔐</div>
            <div class="cc-qr-tile-name">Post-quantum cryptography migration</div>
            <div class="cc-qr-tile-sub">Security</div>
            <div class="cc-qr-tile-desc">NIST PQC algorithms (CRYSTALS-Kyber, Dilithium) rollout completed for 78% of internal systems. Full migration by 2027.</div>
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 2. OPTIMIZATION PROBLEMS
  // ------------------------------------------------------------------
  function renderProblems(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-qr-header">
        <h2 class="cc-qr-page-title">🧩 Quantum-Ready Optimization Problems <span class="cc-qr-page-badge">${db.problems.length} ALGORITHMS</span></h2>
      </div>
      <div class="cc-qr-cards">
        <div class="cc-qr-card"><div class="cc-qr-card-label">In Production</div><div class="cc-qr-card-value" style="color:#22c55e">${db.problems.filter(p=>p.status==='Production').length}</div></div>
        <div class="cc-qr-card"><div class="cc-qr-card-label">In Pilot</div><div class="cc-qr-card-value" style="color:#a855f7">${db.problems.filter(p=>p.status==='Pilot').length}</div></div>
        <div class="cc-qr-card"><div class="cc-qr-card-label">In Research</div><div class="cc-qr-card-value" style="color:#f59e0b">${db.problems.filter(p=>p.status==='Research').length}</div></div>
        <div class="cc-qr-card"><div class="cc-qr-card-label">Total Qubits Needed</div><div class="cc-qr-card-value">${db.problems.reduce((s,p)=>s+p.qubits,0).toLocaleString()}</div></div>
      </div>
      <div class="cc-qr-section">
        <div class="cc-qr-section-title">📋 Algorithm Portfolio</div>
        <div class="cc-qr-scroll">
          <table class="cc-qr-table">
            <thead><tr><th>ID</th><th>Problem</th><th>Category</th><th>Algorithm</th><th>Qubits</th><th>Status</th><th>Speedup</th><th>Description</th></tr></thead>
            <tbody>
              ${db.problems.map(p => {
                const st = p.status === 'Production' ? 'cc-qr-status-prod' : p.status === 'Pilot' ? 'cc-qr-status-pilot' : 'cc-qr-status-research';
                const speedColor = p.speedup > 1000 ? '#22c55e' : p.speedup > 500 ? '#a855f7' : '#f59e0b';
                return `
                  <tr>
                    <td style="font-family:monospace;color:#a855f7;font-weight:700">${p.id}</td>
                    <td style="font-weight:700">${p.name}</td>
                    <td>${p.cat}</td>
                    <td style="font-family:monospace;font-size:11px">${p.classical} → ${p.quantum}</td>
                    <td>${p.qubits}</td>
                    <td><span class="cc-qr-status ${st}">${p.status}</span></td>
                    <td style="font-weight:800;color:${speedColor}">${p.speedup.toLocaleString()}×</td>
                    <td style="font-size:11px;color:#94a3b8;max-width:280px">${p.desc}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="cc-qr-section">
        <div class="cc-qr-section-title">🧠 Algorithm Cards</div>
        <div class="cc-qr-grid-2">
          ${db.problems.map(p => {
            const st = p.status === 'Production' ? 'cc-qr-status-prod' : p.status === 'Pilot' ? 'cc-qr-status-pilot' : 'cc-qr-status-research';
            return `
              <div class="cc-qr-tile">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <div>
                    <div class="cc-qr-tile-name">${p.name}</div>
                    <div class="cc-qr-tile-sub">${p.cat} · ${p.id}</div>
                  </div>
                  <span class="cc-qr-status ${st}">${p.status}</span>
                </div>
                <div class="cc-qr-tile-desc">${p.desc}</div>
                <div class="cc-qr-tile-meta">
                  <div class="cc-qr-tile-meta-item"><div class="cc-qr-tile-meta-label">Classical</div><div class="cc-qr-tile-meta-value" style="font-family:monospace;font-size:11px">${p.classical}</div></div>
                  <div class="cc-qr-tile-meta-item"><div class="cc-qr-tile-meta-label">Quantum</div><div class="cc-qr-tile-meta-value" style="font-family:monospace;font-size:11px">${p.quantum}</div></div>
                  <div class="cc-qr-tile-meta-item"><div class="cc-qr-tile-meta-label">Speedup</div><div class="cc-qr-tile-meta-value" style="color:#a855f7">${p.speedup.toLocaleString()}×</div></div>
                  <div class="cc-qr-tile-meta-item"><div class="cc-qr-tile-meta-label">Qubits needed</div><div class="cc-qr-tile-meta-value">${p.qubits}</div></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 3. QUANTUM VS CLASSICAL
  // ------------------------------------------------------------------
  function renderCompare(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-qr-header">
        <h2 class="cc-qr-page-title">⚡ Quantum vs Classical Comparison <span class="cc-qr-page-badge">BENCHMARKS</span></h2>
      </div>
      <div class="cc-qr-section">
        <div class="cc-qr-section-title">📊 Side-by-Side Benchmark — N=100 problem size</div>
        <div class="cc-qr-scroll">
          <table class="cc-qr-table">
            <thead><tr><th>Problem</th><th>Category</th><th>Classical Time</th><th>Quantum Time</th><th>Speedup</th><th>Bar</th><th>Best Vendor</th></tr></thead>
            <tbody>
              ${db.problems.map(p => {
                // Synthesize concrete wall-times at N=100
                const classicalSec = Math.round(Math.pow(2, Math.min(20, p.speedup/200)) * 0.5);
                const quantumSec = +(classicalSec / p.speedup).toFixed(4);
                const formatTime = (sec) => {
                  if (sec < 1) return (sec * 1000).toFixed(1) + ' ms';
                  if (sec < 60) return sec.toFixed(1) + ' s';
                  if (sec < 3600) return (sec/60).toFixed(1) + ' min';
                  if (sec < 86400) return (sec/3600).toFixed(1) + ' h';
                  return (sec/86400).toFixed(1) + ' days';
                };
                const vendor = p.qubits > 400 ? 'IBM Quantum' : p.qubits > 200 ? 'IonQ' : p.qubits > 100 ? 'D-Wave' : 'Rigetti';
                const speedColor = p.speedup > 1000 ? '#22c55e' : p.speedup > 500 ? '#a855f7' : '#f59e0b';
                return `
                  <tr>
                    <td style="font-weight:700;color:#a855f7">${p.name}</td>
                    <td>${p.cat}</td>
                    <td style="color:#ef4444;font-weight:600">${formatTime(classicalSec)}</td>
                    <td style="color:#22c55e;font-weight:700">${formatTime(quantumSec)}</td>
                    <td style="font-weight:800;color:${speedColor}">${p.speedup.toLocaleString()}×</td>
                    <td><span class="cc-qr-bar-track" style="width:120px"><span class="cc-qr-bar-fill" style="width:${Math.min(100, (p.speedup/2400)*100)}%"></span></span></td>
                    <td>${vendor}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="cc-qr-section">
        <div class="cc-qr-section-title">📈 Speedup Comparison Chart</div>
        <div style="display:flex;align-items:flex-end;gap:10px;height:260px;padding:0 4px">
          ${db.problems.slice().sort((a,b)=>b.speedup-a.speedup).map(p => {
            const pct = (p.speedup / 2400) * 100;
            const color = p.status === 'Production' ? '#22c55e' : p.status === 'Pilot' ? '#a855f7' : '#f59e0b';
            return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
                <div style="font-size:11px;font-weight:800;color:${color}">${p.speedup}×</div>
                <div style="width:100%;max-width:60px;border-radius:4px 4px 0 0;min-height:4px;background:linear-gradient(180deg, ${color}, ${color}aa);height:${pct}%;cursor:pointer;transition:opacity 0.2s;position:relative" title="${p.name}: ${p.speedup}× speedup"></div>
                <div style="font-size:9px;color:#94a3b8;text-align:center;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.id}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 4. PARTNERSHIPS
  // ------------------------------------------------------------------
  function renderPartners(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-qr-header">
        <h2 class="cc-qr-page-title">🤝 Quantum Vendor Partnerships <span class="cc-qr-page-badge">${db.partnerships.length} VENDORS</span></h2>
      </div>
      <div class="cc-qr-cards">
        <div class="cc-qr-card"><div class="cc-qr-card-label">Active Partnerships</div><div class="cc-qr-card-value" style="color:#22c55e">${db.partnerships.filter(p=>p.status==='Active').length}</div></div>
        <div class="cc-qr-card"><div class="cc-qr-card-label">Under Evaluation</div><div class="cc-qr-card-value" style="color:#f59e0b">${db.partnerships.filter(p=>p.status==='Evaluating').length}</div></div>
        <div class="cc-qr-card"><div class="cc-qr-card-label">Max Single-QPU</div><div class="cc-qr-card-value" style="color:#a855f7">${Math.max(...db.partnerships.map(p=>p.qubits)).toLocaleString()}</div><div class="cc-qr-card-delta">qubits (D-Wave)</div></div>
        <div class="cc-qr-card"><div class="cc-qr-card-label">Joint Projects</div><div class="cc-qr-card-value">${db.partnerships.reduce((s,p)=>s+p.projects,0)}</div></div>
      </div>
      <div class="cc-qr-section">
        <div class="cc-qr-section-title">🌐 Vendor Cards</div>
        <div class="cc-qr-grid-2">
          ${db.partnerships.map(p => {
            const st = p.status === 'Active' ? 'cc-qr-status-active' : 'cc-qr-status-eval';
            return `
              <div class="cc-qr-tile" style="border-left:4px solid ${p.color}">
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <div style="display:flex;align-items:center;gap:10px">
                    <span class="cc-qr-tile-logo" style="margin:0">${p.logo}</span>
                    <div>
                      <div class="cc-qr-tile-name">${p.name}</div>
                      <div class="cc-qr-tile-sub">Partner since ${p.since}</div>
                    </div>
                  </div>
                  <span class="cc-qr-status ${st}">${p.status}</span>
                </div>
                <div class="cc-qr-tile-desc">${p.desc}</div>
                <div class="cc-qr-tile-meta">
                  <div class="cc-qr-tile-meta-item"><div class="cc-qr-tile-meta-label">Qubits</div><div class="cc-qr-tile-meta-value" style="color:${p.color}">${p.qubits.toLocaleString()}</div></div>
                  <div class="cc-qr-tile-meta-item"><div class="cc-qr-tile-meta-label">Topology</div><div class="cc-qr-tile-meta-value" style="font-size:11px">${p.topology}</div></div>
                  <div class="cc-qr-tile-meta-item"><div class="cc-qr-tile-meta-label">Access</div><div class="cc-qr-tile-meta-value" style="font-size:11px">${p.access}</div></div>
                  <div class="cc-qr-tile-meta-item"><div class="cc-qr-tile-meta-label">Joint Projects</div><div class="cc-qr-tile-meta-value">${p.projects}</div></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="cc-qr-section">
        <div class="cc-qr-section-title">📊 Qubit Capacity by Vendor</div>
        <div style="display:flex;align-items:flex-end;gap:14px;height:240px;padding:0 4px">
          ${db.partnerships.map(p => {
            const max = Math.max(...db.partnerships.map(x=>x.qubits));
            const pct = (p.qubits / max) * 100;
            return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
                <div style="font-size:11px;font-weight:800;color:${p.color}">${p.qubits.toLocaleString()}</div>
                <div style="width:100%;max-width:70px;border-radius:4px 4px 0 0;min-height:4px;background:${p.color};height:${pct}%;cursor:pointer;transition:opacity 0.2s" title="${p.name}: ${p.qubits} qubits"></div>
                <div style="font-size:10px;color:#94a3b8;text-align:center;max-width:80px">${p.name.split(' ')[0]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 5. ROADMAP
  // ------------------------------------------------------------------
  function renderRoadmap(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-qr-header">
        <h2 class="cc-qr-page-title">🗺️ Quantum Adoption Roadmap <span class="cc-qr-page-badge">2026-2031</span></h2>
      </div>
      <div class="cc-qr-section">
        <div class="cc-qr-section-title">📅 6-Year Strategic Timeline</div>
        <div class="cc-qr-timeline">
          ${db.roadmap.map(r => `
            <div class="cc-qr-timeline-item">
              <div class="cc-qr-timeline-year">${r.year}</div>
              <div class="cc-qr-timeline-title">${r.milestone}</div>
              <div class="cc-qr-timeline-quarters">
                <div class="cc-qr-timeline-q"><strong>Q1:</strong> ${r.q1}</div>
                <div class="cc-qr-timeline-q"><strong>Q2:</strong> ${r.q2}</div>
                <div class="cc-qr-timeline-q"><strong>Q3:</strong> ${r.q3}</div>
                <div class="cc-qr-timeline-q"><strong>Q4:</strong> ${r.q4}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="cc-qr-section">
        <div class="cc-qr-section-title">📈 Investment Trajectory</div>
        <svg viewBox="0 0 720 240" style="width:100%;height:auto;font-family:inherit">
          ${(() => {
            const w = 720, h = 240, pad = 50;
            const investment = [
              { y: 2026, spend: 1.2 },
              { y: 2027, spend: 2.8 },
              { y: 2028, spend: 5.4 },
              { y: 2029, spend: 8.2 },
              { y: 2030, spend: 12.6 },
              { y: 2031, spend: 18.4 }
            ];
            const maxSpend = 20;
            const x = (yr) => pad + ((yr - 2026) / 5) * (w - pad*2);
            const y = (v) => h - pad - (v / maxSpend) * (h - pad*2);
            const gridLines = [0, 5, 10, 15, 20].map(v => `
              <line x1="${pad}" y1="${y(v)}" x2="${w-pad}" y2="${y(v)}" stroke="rgba(255,255,255,0.06)"/>
              <text x="${pad-8}" y="${y(v)+4}" text-anchor="end" fill="#64748b" font-size="10">$${v}M</text>
            `).join('');
            const path = 'M ' + investment.map(d => `${x(d.y)},${y(d.spend)}`).join(' L ');
            const areaPath = path + ` L ${x(2031)},${h-pad} L ${x(2026)},${h-pad} Z`;
            const yearLabel = investment.map(d => `<text x="${x(d.y)}" y="${h-pad+18}" text-anchor="middle" fill="#64748b" font-size="10">${d.y}</text>`).join('');
            const points = investment.map(d => `<circle cx="${x(d.y)}" cy="${y(d.spend)}" r="4" fill="#a855f7"><title>${d.y}: $${d.spend}M</title></circle>`).join('');
            const labels = investment.map(d => `<text x="${x(d.y)}" y="${y(d.spend)-10}" text-anchor="middle" fill="#a855f7" font-size="11" font-weight="700">$${d.spend}M</text>`).join('');
            return gridLines +
              `<path d="${areaPath}" fill="url(#cc-qr-grad)" opacity="0.3"/>` +
              `<defs><linearGradient id="cc-qr-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a855f7" stop-opacity="0.4"/><stop offset="100%" stop-color="#a855f7" stop-opacity="0"/></linearGradient></defs>` +
              `<path d="${path}" fill="none" stroke="#a855f7" stroke-width="2.5"/>` +
              points + labels + yearLabel;
          })()}
        </svg>
        <div style="text-align:center;margin-top:8px;font-size:11px;color:#94a3b8">Cumulative quantum R&D investment: ~$48.6M over 2026-2031</div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-qr-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-qr-overlay');
    if (overlay) overlay.remove();
  }

  function setView(view) {
    currentView = view;
    renderContent();
  }

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  function init() {
    injectStyles();
    window.__ccQR = { open, close, setView };

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (document.getElementById('cc-qr-overlay')) close();
      }
    });
  }

  init();
})();
