// ====================================================================
// network-graph.js — Collaborative Supply Chain Network Graph
// ====================================================================
// Interactive visual network of suppliers, ports, warehouses & flows:
//   1. Network View: SVG force-directed-like graph (nodes sized by importance,
//      colored by type, edges show flow volume)
//   2. Risk Analysis: nodes colored by risk score, risk heatmap
//   3. Critical Nodes: centrality / betweenness analysis
//   4. Dependencies: click a node to inspect inbound/outbound dependencies
//   5. What-If: remove-a-node simulator showing cascading impact
//
// Architecture: IIFE + modal + sidebar pattern. No floating button.
// CSS prefix: cc-ng-  ·  Global API: window.__ccNG.open()
// ====================================================================
(function() {
  'use strict';

  if (window.__networkGraphLoaded) return;
  window.__networkGraphLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_network_graph_db_v1';

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(a) {
    if (a >= 1e6) return '$' + (a / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (a / 1e3).toFixed(0) + 'k';
    return '$' + a.toFixed(0);
  }

  // ------------------------------------------------------------------
  // STATIC NODES — fixed positions on a 1000x620 canvas
  // Types: supplier, port, warehouse, dc, customer
  // ------------------------------------------------------------------
  const NODES = [
    { id: 'SUP-NORDIC', name: 'Nordic Pulp & Paper', type: 'supplier', x: 90, y: 120, risk: 18, importance: 72, country: 'SE', capacity: 4200 },
    { id: 'SUP-BAYOU', name: 'Bayou Chemical Co', type: 'supplier', x: 90, y: 280, risk: 78, importance: 88, country: 'US', capacity: 18400 },
    { id: 'SUP-OSAKA', name: 'Osaka Precision', type: 'supplier', x: 90, y: 440, risk: 22, importance: 80, country: 'JP', capacity: 6800 },
    { id: 'SUP-MUMBAI', name: 'Mumbai Steel', type: 'supplier', x: 90, y: 560, risk: 54, importance: 76, country: 'IN', capacity: 14200 },

    { id: 'PORT-RTM', name: 'Port of Rotterdam', type: 'port', x: 340, y: 90, risk: 28, importance: 95, country: 'NL', capacity: 44000000 },
    { id: 'PORT-SHA', name: 'Port of Shanghai', type: 'port', x: 340, y: 240, risk: 32, importance: 98, country: 'CN', capacity: 47300000 },
    { id: 'PORT-LGB', name: 'Port of Long Beach', type: 'port', x: 340, y: 400, risk: 38, importance: 92, country: 'US', capacity: 9300000 },
    { id: 'PORT-SIN', name: 'Port of Singapore', type: 'port', x: 340, y: 540, risk: 24, importance: 96, country: 'SG', capacity: 37500000 },

    { id: 'WH-RTM1', name: 'Rotterdam DC-1', type: 'warehouse', x: 580, y: 110, risk: 20, importance: 74, country: 'NL', capacity: 42000 },
    { id: 'WH-HAM', name: 'Hamburg Cold Storage', type: 'warehouse', x: 580, y: 240, risk: 42, importance: 70, country: 'DE', capacity: 28000 },
    { id: 'WH-MEM', name: 'Memphis Mega-DC', type: 'warehouse', x: 580, y: 370, risk: 34, importance: 90, country: 'US', capacity: 95000 },
    { id: 'WH-SHA', name: 'Shanghai Hub', type: 'warehouse', x: 580, y: 500, risk: 48, importance: 86, country: 'CN', capacity: 78000 },

    { id: 'DC-BERLIN', name: 'Berlin DC', type: 'dc', x: 800, y: 150, risk: 16, importance: 68, country: 'DE', capacity: 18000 },
    { id: 'DC-PARIS', name: 'Paris DC', type: 'dc', x: 800, y: 300, risk: 22, importance: 76, country: 'FR', capacity: 22000 },
    { id: 'DC-TOKYO', name: 'Tokyo DC', type: 'dc', x: 800, y: 450, risk: 26, importance: 82, country: 'JP', capacity: 24000 },

    { id: 'CUS-AMZ', name: 'Amazon EU', type: 'customer', x: 940, y: 110, risk: 12, importance: 60, country: 'EU', capacity: 0 },
    { id: 'CUS-WMT', name: 'Walmart US', type: 'customer', x: 940, y: 280, risk: 14, importance: 64, country: 'US', capacity: 0 },
    { id: 'CUS-RKT', name: 'Rakuten JP', type: 'customer', x: 940, y: 440, risk: 18, importance: 58, country: 'JP', capacity: 0 }
  ];

  // Edges — flow_volume in TEU/month (relative weight)
  const EDGES = [
    { from: 'SUP-NORDIC', to: 'PORT-RTM', volume: 4200 },
    { from: 'SUP-NORDIC', to: 'PORT-HAM', volume: 1800 },
    { from: 'SUP-BAYOU', to: 'PORT-LGB', volume: 12400 },
    { from: 'SUP-BAYOU', to: 'PORT-RTM', volume: 4200 },
    { from: 'SUP-OSAKA', to: 'PORT-SHA', volume: 6800 },
    { from: 'SUP-OSAKA', to: 'PORT-SIN', volume: 2400 },
    { from: 'SUP-MUMBAI', to: 'PORT-SIN', volume: 9200 },
    { from: 'SUP-MUMBAI', to: 'PORT-SHA', volume: 5400 },
    { from: 'PORT-RTM', to: 'WH-RTM1', volume: 18400 },
    { from: 'PORT-RTM', to: 'WH-HAM', volume: 9800 },
    { from: 'PORT-HAM', to: 'WH-HAM', volume: 4200 },
    { from: 'PORT-SHA', to: 'WH-SHA', volume: 24800 },
    { from: 'PORT-SHA', to: 'PORT-SIN', volume: 6200 },
    { from: 'PORT-LGB', to: 'WH-MEM', volume: 14800 },
    { from: 'PORT-SIN', to: 'WH-SHA', volume: 8400 },
    { from: 'PORT-SIN', to: 'PORT-LGB', volume: 3200 },
    { from: 'WH-RTM1', to: 'DC-BERLIN', volume: 9200 },
    { from: 'WH-RTM1', to: 'DC-PARIS', volume: 7400 },
    { from: 'WH-HAM', to: 'DC-BERLIN', volume: 6200 },
    { from: 'WH-MEM', to: 'DC-PARIS', volume: 2400 },
    { from: 'WH-SHA', to: 'DC-TOKYO', volume: 12400 },
    { from: 'WH-SHA', to: 'PORT-SIN', volume: 4200 },
    { from: 'DC-BERLIN', to: 'CUS-AMZ', volume: 8800 },
    { from: 'DC-PARIS', to: 'CUS-AMZ', volume: 5400 },
    { from: 'DC-PARIS', to: 'CUS-WMT', volume: 6200 },
    { from: 'DC-TOKYO', to: 'CUS-RKT', volume: 11200 },
    { from: 'DC-TOKYO', to: 'PORT-SHA', volume: 1800 }
  ];

  // Critical node analysis (precomputed — betweenness / degree centrality)
  const CRITICAL_NODES = [
    { id: 'PORT-SHA', betweenness: 0.82, degree: 6, eigenvector: 0.94, criticality: 'Critical' },
    { id: 'PORT-RTM', betweenness: 0.74, degree: 5, eigenvector: 0.88, criticality: 'Critical' },
    { id: 'PORT-SIN', betweenness: 0.69, degree: 5, eigenvector: 0.86, criticality: 'Critical' },
    { id: 'WH-MEM', betweenness: 0.61, degree: 3, eigenvector: 0.74, criticality: 'High' },
    { id: 'WH-SHA', betweenness: 0.58, degree: 4, eigenvector: 0.78, criticality: 'High' },
    { id: 'PORT-LGB', betweenness: 0.52, degree: 3, eigenvector: 0.68, criticality: 'High' },
    { id: 'DC-TOKYO', betweenness: 0.44, degree: 3, eigenvector: 0.62, criticality: 'Medium' },
    { id: 'WH-HAM', betweenness: 0.38, degree: 3, eigenvector: 0.54, criticality: 'Medium' },
    { id: 'SUP-BAYOU', betweenness: 0.32, degree: 2, eigenvector: 0.48, criticality: 'Medium' },
    { id: 'DC-PARIS', betweenness: 0.28, degree: 3, eigenvector: 0.46, criticality: 'Medium' }
  ];

  // What-If scenarios — cascading impact of removing a node
  const SCENARIOS = [
    { nodeId: 'PORT-SHA', lostFlow: 37400, affectedDownstream: 6, estCost: 2840000, daysDelay: 14, altRoutes: 2 },
    { nodeId: 'PORT-RTM', lostFlow: 28200, affectedDownstream: 4, estCost: 1840000, daysDelay: 9, altRoutes: 3 },
    { nodeId: 'PORT-SIN', lostFlow: 24800, affectedDownstream: 5, estCost: 1620000, daysDelay: 11, altRoutes: 2 },
    { nodeId: 'WH-MEM', lostFlow: 14800, affectedDownstream: 2, estCost: 920000, daysDelay: 5, altRoutes: 4 },
    { nodeId: 'SUP-BAYOU', lostFlow: 16600, affectedDownstream: 4, estCost: 1240000, daysDelay: 21, altRoutes: 1 },
    { nodeId: 'PORT-LGB', lostFlow: 18000, affectedDownstream: 3, estCost: 1180000, daysDelay: 8, altRoutes: 3 }
  ];

  // ------------------------------------------------------------------
  // DB INIT
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.generated) return db;
    db = {
      nodes: NODES,
      edges: EDGES,
      critical: CRITICAL_NODES,
      scenarios: SCENARIOS,
      generated: true,
      meta: { created: new Date().toISOString(), version: 1, lastUpdate: new Date().toISOString() }
    };
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }

  // ------------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------------
  let currentView = 'network';
  let selectedNodeId = null;
  let whatIfRemovedId = null;
  let nodeSearch = '';
  let hiddenNodes = new Set(); // for what-if simulation

  const TYPE_COLORS = {
    supplier: '#f59e0b',
    port: '#06b6d4',
    warehouse: '#2563eb',
    dc: '#7c3aed',
    customer: '#22c55e'
  };
  const TYPE_LABELS = {
    supplier: 'Supplier',
    port: 'Port',
    warehouse: 'Warehouse',
    dc: 'Distribution Center',
    customer: 'Customer'
  };

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-ng-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-ng-styles';
    style.textContent = `
      .cc-ng-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10012; background: rgba(4,10,18,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-ng-sidebar { width: 220px; flex-shrink: 0; background: rgba(10,22,40,0.6); border-right: 1px solid rgba(37,99,235,0.15); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-ng-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(37,99,235,0.15); margin-bottom: 12px; }
      .cc-ng-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; background: linear-gradient(135deg, #2563eb, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .cc-ng-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-ng-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; font-family: inherit; }
      .cc-ng-nav-item:hover { background: rgba(37,99,235,0.06); color: #e2e8f0; }
      .cc-ng-nav-item.active { background: rgba(37,99,235,0.1); color: #3b82f6; border-left-color: #3b82f6; }
      .cc-ng-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-ng-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-ng-close { position: fixed; top: 16px; right: 20px; z-index: 10013; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-ng-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-ng-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(37,99,235,0.15); flex-wrap: wrap; gap: 12px; }
      .cc-ng-page-title { font-size: 22px; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #2563eb, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .cc-ng-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #2563eb, #06b6d4); color: #fff; font-weight: 600; -webkit-text-fill-color: #fff; }
      .cc-ng-live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #3b82f6; font-weight: 600; }
      .cc-ng-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; animation: cc-ng-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-ng-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .cc-ng-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-ng-card { background: linear-gradient(135deg, rgba(37,99,235,0.06), rgba(6,182,212,0.06)); border: 1px solid rgba(37,99,235,0.22); border-radius: 12px; padding: 16px; }
      .cc-ng-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 6px; }
      .cc-ng-card-value { font-size: 24px; font-weight: 800; color: #fff; }
      .cc-ng-card-delta { font-size: 11px; margin-top: 4px; color: #94a3b8; }
      .cc-ng-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(37,99,235,0.15); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
      .cc-ng-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
      .cc-ng-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-ng-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(37,99,235,0.18); }
      .cc-ng-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; vertical-align: middle; }
      .cc-ng-table tr:hover td { background: rgba(37,99,235,0.05); }
      .cc-ng-scroll { max-height: 520px; overflow-y: auto; border: 1px solid rgba(37,99,235,0.15); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(37,99,235,0.4) transparent; }
      .cc-ng-scroll::-webkit-scrollbar { width: 8px; }
      .cc-ng-scroll::-webkit-scrollbar-track { background: transparent; }
      .cc-ng-scroll::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.3); border-radius: 4px; }
      .cc-ng-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
      .cc-ng-status-crit { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .cc-ng-status-high { background: rgba(249,115,22,0.15); color: #f97316; border: 1px solid rgba(249,115,22,0.3); }
      .cc-ng-status-med { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-ng-status-low { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-ng-bar-track { display: inline-block; width: 100px; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; vertical-align: middle; margin-right: 6px; }
      .cc-ng-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #2563eb, #06b6d4); }
      .cc-ng-graph-wrap { background: linear-gradient(135deg, rgba(10,22,40,0.6), rgba(4,12,24,0.6)); border: 1px solid rgba(37,99,235,0.18); border-radius: 12px; padding: 12px; position: relative; }
      .cc-ng-graph-svg { width: 100%; height: auto; display: block; }
      .cc-ng-legend { display: flex; gap: 14px; flex-wrap: wrap; padding: 8px 4px 0; font-size: 11px; color: #94a3b8; }
      .cc-ng-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
      .cc-ng-input { background: rgba(10,22,40,0.7); border: 1px solid rgba(37,99,235,0.25); color: #e2e8f0; border-radius: 8px; padding: 9px 12px; font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.2s; }
      .cc-ng-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(37,99,235,0.2); }
      .cc-ng-btn { background: linear-gradient(135deg, #2563eb, #06b6d4); color: #fff; border: none; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: transform 0.15s, box-shadow 0.15s; }
      .cc-ng-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37,99,235,0.35); }
      .cc-ng-btn-danger { background: linear-gradient(135deg, #ef4444, #f97316); }
      .cc-ng-btn-danger:hover { box-shadow: 0 6px 16px rgba(239,68,68,0.4); }
      .cc-ng-node-circle { cursor: pointer; transition: opacity 0.2s, stroke-width 0.2s; }
      .cc-ng-node-circle:hover { stroke-width: 3; }
      .cc-ng-edge { transition: opacity 0.2s, stroke-width 0.2s; }
      .cc-ng-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
      .cc-ng-tile { background: linear-gradient(135deg, rgba(37,99,235,0.05), rgba(6,182,212,0.05)); border: 1px solid rgba(37,99,235,0.2); border-radius: 12px; padding: 16px; transition: border-color 0.2s, transform 0.2s; }
      .cc-ng-tile:hover { border-color: rgba(37,99,235,0.5); transform: translateY(-2px); }
      .cc-ng-tile-title { font-size: 14px; font-weight: 700; color: #fff; }
      .cc-ng-tile-sub { font-size: 11px; color: #3b82f6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
      .cc-ng-tile-desc { font-size: 12px; color: #94a3b8; margin-top: 8px; line-height: 1.5; }
      .cc-ng-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start; }
      .cc-ng-row > * { flex: 1; min-width: 240px; }
      .cc-ng-detail-panel { background: rgba(37,99,235,0.06); border: 1px solid rgba(37,99,235,0.25); border-radius: 12px; padding: 16px; }
      .cc-ng-heat-cell { display: inline-block; width: 22px; height: 22px; border-radius: 3px; }
      @media (max-width: 767px) {
        .cc-ng-modal { flex-direction: column; }
        .cc-ng-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-ng-sidebar-brand { display: none; }
        .cc-ng-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-ng-nav-item.active { border-bottom-color: #3b82f6; border-left-color: transparent; }
        .cc-ng-main { padding: 12px 12px 20px; }
        .cc-ng-cards { grid-template-columns: repeat(2, 1fr); }
      }
      html:not(.dark) .cc-ng-modal { background: rgba(245,249,253,0.99); color: #1e293b; }
      html:not(.dark) .cc-ng-sidebar { background: rgba(238,244,252,0.8); border-right-color: rgba(37,99,235,0.12); }
      html:not(.dark) .cc-ng-sidebar-title { background: linear-gradient(135deg, #1d4ed8, #0891b2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      html:not(.dark) .cc-ng-nav-item { color: #64748b; }
      html:not(.dark) .cc-ng-nav-item:hover { background: rgba(37,99,235,0.06); color: #1e293b; }
      html:not(.dark) .cc-ng-nav-item.active { background: rgba(37,99,235,0.1); color: #1d4ed8; }
      html:not(.dark) .cc-ng-page-title { background: linear-gradient(135deg, #1d4ed8, #0891b2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      html:not(.dark) .cc-ng-header { border-bottom-color: rgba(37,99,235,0.1); }
      html:not(.dark) .cc-ng-card { background: rgba(37,99,235,0.05); border-color: rgba(37,99,235,0.2); }
      html:not(.dark) .cc-ng-card-label { color: #64748b; }
      html:not(.dark) .cc-ng-card-value { color: #0f172a; }
      html:not(.dark) .cc-ng-card-delta { color: #64748b; }
      html:not(.dark) .cc-ng-section { background: rgba(0,0,0,0.02); border-color: rgba(37,99,235,0.15); }
      html:not(.dark) .cc-ng-section-title { color: #1e293b; }
      html:not(.dark) .cc-ng-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-ng-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-ng-table tr:hover td { background: rgba(37,99,235,0.04); }
      html:not(.dark) .cc-ng-graph-wrap { background: rgba(238,244,252,0.6); border-color: rgba(37,99,235,0.18); }
      html:not(.dark) .cc-ng-input { background: #fff; border-color: rgba(37,99,235,0.2); color: #1e293b; }
      html:not(.dark) .cc-ng-tile { background: rgba(37,99,235,0.04); border-color: rgba(37,99,235,0.18); }
      html:not(.dark) .cc-ng-tile-title { color: #0f172a; }
      html:not(.dark) .cc-ng-tile-desc { color: #64748b; }
      html:not(.dark) .cc-ng-detail-panel { background: rgba(37,99,235,0.06); border-color: rgba(37,99,235,0.2); }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // GRAPH RENDERING (SVG)
  // ------------------------------------------------------------------
  function renderGraphSVG(mode, colorMode) {
    // mode: 'normal' | 'risk' | 'selected'
    // colorMode: 'type' | 'risk' | 'whatif'
    const db = initDatabase();
    const visibleNodes = db.nodes.filter(n => !hiddenNodes.has(n.id));
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = db.edges.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to));
    const maxVol = Math.max(...db.edges.map(e => e.volume));
    const maxImp = Math.max(...db.nodes.map(n => n.importance));

    function nodeColor(n) {
      if (colorMode === 'risk') {
        if (n.risk >= 60) return '#ef4444';
        if (n.risk >= 40) return '#f97316';
        if (n.risk >= 25) return '#f59e0b';
        return '#22c55e';
      }
      if (colorMode === 'whatif') {
        if (hiddenNodes.has(n.id)) return '#475569';
        return TYPE_COLORS[n.type] || '#94a3b8';
      }
      return TYPE_COLORS[n.type] || '#94a3b8';
    }
    function nodeRadius(n) {
      return 8 + (n.importance / maxImp) * 18;
    }

    const edges = visibleEdges.map(e => {
      const from = db.nodes.find(n => n.id === e.from);
      const to = db.nodes.find(n => n.id === e.to);
      const w = 1 + (e.volume / maxVol) * 5;
      const isActive = mode === 'selected' && (e.from === selectedNodeId || e.to === selectedNodeId);
      return `<line class="cc-ng-edge" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${isActive ? '#06b6d4' : 'rgba(148,163,184,0.25)'}" stroke-width="${isActive ? w * 1.6 : w}" opacity="${mode === 'selected' && !isActive ? 0.2 : 1}"/>`;
    }).join('');

    const nodes = visibleNodes.map(n => {
      const r = nodeRadius(n);
      const color = nodeColor(n);
      const isSelected = n.id === selectedNodeId;
      const opacity = (mode === 'selected' && selectedNodeId && n.id !== selectedNodeId &&
                      !db.edges.some(e => (e.from === selectedNodeId && e.to === n.id) || (e.to === selectedNodeId && e.from === n.id)))
                    ? 0.35 : 1;
      return `
        <g class="cc-ng-node-circle" opacity="${opacity}" onclick="window.__ccNG.selectNode('${n.id}')">
          ${isSelected ? `<circle cx="${n.x}" cy="${n.y}" r="${r + 8}" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.7"/>` : ''}
          <circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-width="${isSelected ? 3 : 1.8}"/>
          <text x="${n.x}" y="${n.y - r - 5}" text-anchor="middle" fill="${color}" font-size="10" font-weight="700">${n.name}</text>
          <text x="${n.x}" y="${n.y + 3}" text-anchor="middle" fill="#fff" font-size="9" font-weight="600">${n.country}</text>
        </g>
      `;
    }).join('');

    return `
      <svg class="cc-ng-graph-svg" viewBox="0 0 1000 620">
        <defs>
          <marker id="cc-ng-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(148,163,184,0.5)"/>
          </marker>
        </defs>
        ${edges}
        ${nodes}
      </svg>
    `;
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    initDatabase();
    const overlay = document.createElement('div');
    overlay.id = 'cc-ng-overlay';
    overlay.className = 'cc-ng-modal';
    overlay.innerHTML = `
      <button class="cc-ng-close" onclick="window.__ccNG.close()" aria-label="Close">×</button>
      <div class="cc-ng-sidebar">
        <div class="cc-ng-sidebar-brand">
          <div class="cc-ng-sidebar-title">🕸️ Network Graph</div>
          <div class="cc-ng-sidebar-sub">Collaborative Supply Chain Map</div>
        </div>
        <button class="cc-ng-nav-item ${currentView==='network'?'active':''}" onclick="window.__ccNG.setView('network')"><span class="cc-ng-nav-icon">🌐</span> Network View</button>
        <button class="cc-ng-nav-item ${currentView==='risk'?'active':''}" onclick="window.__ccNG.setView('risk')"><span class="cc-ng-nav-icon">⚠️</span> Risk Analysis</button>
        <button class="cc-ng-nav-item ${currentView==='critical'?'active':''}" onclick="window.__ccNG.setView('critical')"><span class="cc-ng-nav-icon">⭐</span> Critical Nodes</button>
        <button class="cc-ng-nav-item ${currentView==='deps'?'active':''}" onclick="window.__ccNG.setView('deps')"><span class="cc-ng-nav-icon">🔗</span> Dependencies</button>
        <button class="cc-ng-nav-item ${currentView==='whatif'?'active':''}" onclick="window.__ccNG.setView('whatif')"><span class="cc-ng-nav-icon">🧪</span> What-If Simulator</button>
      </div>
      <div class="cc-ng-main" id="cc-ng-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const container = document.getElementById('cc-ng-content');
    if (!container) return;
    if (currentView === 'network') renderNetwork(container);
    else if (currentView === 'risk') renderRisk(container);
    else if (currentView === 'critical') renderCritical(container);
    else if (currentView === 'deps') renderDeps(container);
    else if (currentView === 'whatif') renderWhatIf(container);
    document.querySelectorAll('.cc-ng-nav-item').forEach(item => {
      const oc = item.getAttribute('onclick') || '';
      item.classList.toggle('active', oc.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // 1. NETWORK VIEW
  // ------------------------------------------------------------------
  function renderNetwork(c) {
    const db = initDatabase();
    const totalFlow = db.edges.reduce((s, e) => s + e.volume, 0);
    c.innerHTML = `
      <div class="cc-ng-header">
        <h2 class="cc-ng-page-title">🌐 Network View <span class="cc-ng-page-badge">${db.nodes.length} NODES · ${db.edges.length} FLOWS</span></h2>
        <div class="cc-ng-live-indicator"><div class="cc-ng-live-dot"></div> Live network telemetry</div>
      </div>
      <div class="cc-ng-cards">
        <div class="cc-ng-card"><div class="cc-ng-card-label">Suppliers</div><div class="cc-ng-card-value">${db.nodes.filter(n=>n.type==='supplier').length}</div></div>
        <div class="cc-ng-card"><div class="cc-ng-card-label">Ports</div><div class="cc-ng-card-value">${db.nodes.filter(n=>n.type==='port').length}</div></div>
        <div class="cc-ng-card"><div class="cc-ng-card-label">Warehouses + DCs</div><div class="cc-ng-card-value">${db.nodes.filter(n=>n.type==='warehouse'||n.type==='dc').length}</div></div>
        <div class="cc-ng-card"><div class="cc-ng-card-label">Monthly Flow</div><div class="cc-ng-card-value" style="color:#06b6d4">${(totalFlow/1000).toFixed(1)}k TEU</div></div>
      </div>
      <div class="cc-ng-section">
        <div class="cc-ng-section-title">🗺️ Interactive Network Graph — click any node to inspect</div>
        <div class="cc-ng-graph-wrap">
          ${renderGraphSVG('normal', 'type')}
          <div class="cc-ng-legend">
            ${Object.keys(TYPE_LABELS).map(t => `<span style="display:flex;align-items:center;gap:6px"><span class="cc-ng-legend-dot" style="background:${TYPE_COLORS[t]}"></span> ${TYPE_LABELS[t]}</span>`).join('')}
            <span style="margin-left:auto;color:#64748b">Edge thickness = flow volume</span>
          </div>
        </div>
      </div>
      <div class="cc-ng-section">
        <div class="cc-ng-section-title">📊 Network Statistics</div>
        <div class="cc-ng-grid-2">
          <div class="cc-ng-tile">
            <div class="cc-ng-tile-title">${db.nodes.length} Nodes</div>
            <div class="cc-ng-tile-sub">Network Topology</div>
            <div class="cc-ng-tile-desc">${db.edges.length} directed edges. Network density: ${((db.edges.length / (db.nodes.length * (db.nodes.length-1))) * 100).toFixed(1)}%. Average degree: ${(db.edges.length * 2 / db.nodes.length).toFixed(1)}.</div>
          </div>
          <div class="cc-ng-tile">
            <div class="cc-ng-tile-title">${(totalFlow).toLocaleString()} TEU/mo</div>
            <div class="cc-ng-tile-sub">Throughput</div>
            <div class="cc-ng-tile-desc">Aggregate monthly flow across all edges. Busiest edge: ${db.edges.slice().sort((a,b)=>b.volume-a.volume)[0].from} → ${db.edges.slice().sort((a,b)=>b.volume-a.volume)[0].to}.</div>
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 2. RISK ANALYSIS
  // ------------------------------------------------------------------
  function renderRisk(c) {
    const db = initDatabase();
    const highRisk = db.nodes.filter(n => n.risk >= 40);
    const medRisk = db.nodes.filter(n => n.risk >= 25 && n.risk < 40);
    const lowRisk = db.nodes.filter(n => n.risk < 25);
    const maxRisk = Math.max(...db.nodes.map(n => n.risk));
    c.innerHTML = `
      <div class="cc-ng-header">
        <h2 class="cc-ng-page-title">⚠️ Risk Analysis <span class="cc-ng-page-badge">${db.nodes.length} NODES</span></h2>
      </div>
      <div class="cc-ng-cards">
        <div class="cc-ng-card"><div class="cc-ng-card-label">High Risk (≥40)</div><div class="cc-ng-card-value" style="color:#ef4444">${highRisk.length}</div><div class="cc-ng-card-delta">Immediate attention</div></div>
        <div class="cc-ng-card"><div class="cc-ng-card-label">Medium (25-39)</div><div class="cc-ng-card-value" style="color:#f59e0b">${medRisk.length}</div><div class="cc-ng-card-delta">Monitor closely</div></div>
        <div class="cc-ng-card"><div class="cc-ng-card-label">Low Risk (&lt;25)</div><div class="cc-ng-card-value" style="color:#22c55e">${lowRisk.length}</div><div class="cc-ng-card-delta">Healthy</div></div>
        <div class="cc-ng-card"><div class="cc-ng-card-label">Avg Risk Score</div><div class="cc-ng-card-value">${Math.round(db.nodes.reduce((s,n)=>s+n.risk,0)/db.nodes.length)}</div></div>
      </div>
      <div class="cc-ng-section">
        <div class="cc-ng-section-title">🌡️ Risk-Color Network Graph</div>
        <div class="cc-ng-graph-wrap">
          ${renderGraphSVG('normal', 'risk')}
          <div class="cc-ng-legend">
            <span style="display:flex;align-items:center;gap:6px"><span class="cc-ng-legend-dot" style="background:#22c55e"></span> Low (&lt;25)</span>
            <span style="display:flex;align-items:center;gap:6px"><span class="cc-ng-legend-dot" style="background:#f59e0b"></span> Medium (25-39)</span>
            <span style="display:flex;align-items:center;gap:6px"><span class="cc-ng-legend-dot" style="background:#f97316"></span> Elevated (40-59)</span>
            <span style="display:flex;align-items:center;gap:6px"><span class="cc-ng-legend-dot" style="background:#ef4444"></span> High (≥60)</span>
          </div>
        </div>
      </div>
      <div class="cc-ng-section">
        <div class="cc-ng-section-title">🔥 Risk Heatmap</div>
        <div style="display:grid;grid-template-columns:repeat(${Math.ceil(Math.sqrt(db.nodes.length))},1fr);gap:4px">
          ${db.nodes.slice().sort((a,b)=>b.risk-a.risk).map(n => {
            const color = n.risk >= 60 ? '#ef4444' : n.risk >= 40 ? '#f97316' : n.risk >= 25 ? '#f59e0b' : '#22c55e';
            return `<div title="${n.name}: risk ${n.risk}" style="background:${color};opacity:${0.3 + (n.risk/maxRisk)*0.7};padding:10px 6px;border-radius:4px;text-align:center;font-size:9px;font-weight:700;color:#fff;cursor:pointer" onclick="window.__ccNG.goToDeps('${n.id}')">${n.name.split(' ')[0]}<br><span style="font-size:11px">${n.risk}</span></div>`;
          }).join('')}
        </div>
      </div>
      <div class="cc-ng-section">
        <div class="cc-ng-section-title">📋 Node Risk Table</div>
        <div class="cc-ng-scroll">
          <table class="cc-ng-table">
            <thead><tr><th>Node</th><th>Type</th><th>Country</th><th>Risk Score</th><th>Bar</th><th>Status</th><th>Importance</th></tr></thead>
            <tbody>
              ${db.nodes.slice().sort((a,b)=>b.risk-a.risk).map(n => {
                const st = n.risk >= 60 ? 'cc-ng-status-crit' : n.risk >= 40 ? 'cc-ng-status-high' : n.risk >= 25 ? 'cc-ng-status-med' : 'cc-ng-status-low';
                const label = n.risk >= 60 ? 'Critical' : n.risk >= 40 ? 'High' : n.risk >= 25 ? 'Medium' : 'Low';
                return `
                  <tr>
                    <td style="font-weight:700;color:#3b82f6">${n.name}</td>
                    <td>${TYPE_LABELS[n.type]}</td>
                    <td>${n.country}</td>
                    <td style="font-weight:700">${n.risk}</td>
                    <td><span class="cc-ng-bar-track"><span class="cc-ng-bar-fill" style="width:${n.risk}%;background:${n.risk>=60?'#ef4444':n.risk>=40?'#f97316':n.risk>=25?'#f59e0b':'#22c55e'}"></span></span></td>
                    <td><span class="cc-ng-status ${st}">${label}</span></td>
                    <td>${n.importance}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 3. CRITICAL NODES
  // ------------------------------------------------------------------
  function renderCritical(c) {
    const db = initDatabase();
    const maxBet = Math.max(...db.critical.map(x => x.betweenness));
    c.innerHTML = `
      <div class="cc-ng-header">
        <h2 class="cc-ng-page-title">⭐ Critical Nodes Analysis <span class="cc-ng-page-badge">CENTRALITY</span></h2>
      </div>
      <div class="cc-ng-section">
        <div class="cc-ng-section-title">🏆 Top 10 Critical Nodes by Betweenness Centrality</div>
        <div class="cc-ng-scroll">
          <table class="cc-ng-table">
            <thead><tr><th>Rank</th><th>Node ID</th><th>Name</th><th>Type</th><th>Betweenness</th><th>Degree</th><th>Eigenvector</th><th>Criticality</th></tr></thead>
            <tbody>
              ${db.critical.map((cr, i) => {
                const node = db.nodes.find(n => n.id === cr.id);
                const st = cr.criticality === 'Critical' ? 'cc-ng-status-crit' : cr.criticality === 'High' ? 'cc-ng-status-high' : 'cc-ng-status-med';
                return `
                  <tr>
                    <td style="font-weight:700">#${i+1}</td>
                    <td style="font-family:monospace;color:#06b6d4">${cr.id}</td>
                    <td style="font-weight:700;color:#3b82f6">${node ? node.name : cr.id}</td>
                    <td>${node ? TYPE_LABELS[node.type] : '-'}</td>
                    <td><span class="cc-ng-bar-track" style="width:80px"><span class="cc-ng-bar-fill" style="width:${(cr.betweenness/maxBet)*100}%"></span></span><strong>${cr.betweenness.toFixed(2)}</strong></td>
                    <td>${cr.degree}</td>
                    <td>${cr.eigenvector.toFixed(2)}</td>
                    <td><span class="cc-ng-status ${st}">${cr.criticality}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="cc-ng-section">
        <div class="cc-ng-section-title">📈 Betweenness Distribution</div>
        <div style="display:flex;align-items:flex-end;gap:10px;height:220px;padding:0 4px">
          ${db.critical.map(cr => {
            const pct = (cr.betweenness / maxBet) * 100;
            const color = cr.criticality === 'Critical' ? '#ef4444' : cr.criticality === 'High' ? '#f97316' : '#f59e0b';
            return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
                <div style="font-size:10px;font-weight:700;color:#e2e8f0">${cr.betweenness.toFixed(2)}</div>
                <div style="width:100%;max-width:50px;border-radius:4px 4px 0 0;min-height:4px;position:relative;cursor:pointer;background:${color};height:${pct}%" title="${cr.id}: betweenness ${cr.betweenness}"></div>
                <div style="font-size:9px;color:#94a3b8;max-width:60px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cr.id.split('-')[1] || cr.id}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="cc-ng-section">
        <div class="cc-ng-section-title">💡 Recommendations</div>
        <div class="cc-ng-grid-2">
          <div class="cc-ng-tile">
            <div class="cc-ng-tile-title">Diversify Port of Shanghai</div>
            <div class="cc-ng-tile-sub">Single point of failure</div>
            <div class="cc-ng-tile-desc">Highest betweenness (0.82) — 24,800 TEU/mo flows through this single node. Reroute 30% via Ningbo-Zhoushan to reduce concentration risk.</div>
          </div>
          <div class="cc-ng-tile">
            <div class="cc-ng-tile-title">Add backup for Bayou Chemical</div>
            <div class="cc-ng-tile-sub">Supplier criticality</div>
            <div class="cc-ng-tile-desc">Sole-source supplier with risk score 78. Qualify secondary supplier in Mexico within 90 days to ensure continuity.</div>
          </div>
          <div class="cc-ng-tile">
            <div class="cc-ng-tile-title">Memphis DC over-reliance</div>
            <div class="cc-ng-tile-sub">Warehouse centralization</div>
            <div class="cc-ng-tile-desc">Memphis handles 14,800 TEU inbound. Consider Atlanta secondary DC to handle 35% overflow during peak season.</div>
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 4. DEPENDENCIES
  // ------------------------------------------------------------------
  function renderDeps(c) {
    const db = initDatabase();
    const sel = selectedNodeId || db.nodes[0].id;
    const node = db.nodes.find(n => n.id === sel);
    const upstream = db.edges.filter(e => e.to === sel).map(e => ({...e, partner: db.nodes.find(n => n.id === e.from)}));
    const downstream = db.edges.filter(e => e.from === sel).map(e => ({...e, partner: db.nodes.find(n => n.id === e.to)}));
    c.innerHTML = `
      <div class="cc-ng-header">
        <h2 class="cc-ng-page-title">🔗 Dependency Inspector <span class="cc-ng-page-badge">CLICK A NODE</span></h2>
      </div>
      <div class="cc-ng-section">
        <div class="cc-ng-section-title">🌐 Network Graph (selected node highlighted)</div>
        <div class="cc-ng-graph-wrap">
          ${renderGraphSVG('selected', 'type')}
          <div class="cc-ng-legend">
            <span style="display:flex;align-items:center;gap:6px"><span class="cc-ng-legend-dot" style="background:#06b6d4"></span> Selected node + direct connections</span>
            <span style="color:#64748b">Other nodes dimmed</span>
          </div>
        </div>
      </div>
      <div class="cc-ng-row">
        <div class="cc-ng-section" style="margin-bottom:0">
          <div class="cc-ng-section-title">⬆️ Upstream (depends on)</div>
          ${upstream.length === 0 ? '<div style="color:#64748b;font-size:12px">No upstream dependencies — source node.</div>' : `
            <div class="cc-ng-scroll" style="max-height:300px">
              <table class="cc-ng-table">
                <thead><tr><th>Node</th><th>Type</th><th>Country</th><th>Flow In</th></tr></thead>
                <tbody>
                  ${upstream.map(e => `
                    <tr style="cursor:pointer" onclick="window.__ccNG.selectNode('${e.partner.id}')">
                      <td style="font-weight:700;color:#f59e0b">${e.partner.name}</td>
                      <td>${TYPE_LABELS[e.partner.type]}</td>
                      <td>${e.partner.country}</td>
                      <td style="font-weight:600">${e.volume.toLocaleString()} TEU</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
        <div class="cc-ng-section" style="margin-bottom:0">
          <div class="cc-ng-section-title">⬇️ Downstream (depended on by)</div>
          ${downstream.length === 0 ? '<div style="color:#64748b;font-size:12px">No downstream dependencies — terminal node.</div>' : `
            <div class="cc-ng-scroll" style="max-height:300px">
              <table class="cc-ng-table">
                <thead><tr><th>Node</th><th>Type</th><th>Country</th><th>Flow Out</th></tr></thead>
                <tbody>
                  ${downstream.map(e => `
                    <tr style="cursor:pointer" onclick="window.__ccNG.selectNode('${e.partner.id}')">
                      <td style="font-weight:700;color:#22c55e">${e.partner.name}</td>
                      <td>${TYPE_LABELS[e.partner.type]}</td>
                      <td>${e.partner.country}</td>
                      <td style="font-weight:600">${e.volume.toLocaleString()} TEU</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
      <div class="cc-ng-section" style="margin-top:16px">
        <div class="cc-ng-section-title">🔎 Selected Node Detail</div>
        <div class="cc-ng-detail-panel">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <div style="width:48px;height:48px;border-radius:12px;background:${TYPE_COLORS[node.type]};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;color:#fff">${node.country}</div>
            <div>
              <div style="font-size:16px;font-weight:800;color:#fff">${node.name}</div>
              <div style="font-size:11px;color:#94a3b8">${node.id} · ${TYPE_LABELS[node.type]}</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;font-size:12px">
            <div><div style="color:#64748b">Risk score</div><div style="font-weight:700;color:${node.risk>=60?'#ef4444':node.risk>=40?'#f97316':node.risk>=25?'#f59e0b':'#22c55e'}">${node.risk}</div></div>
            <div><div style="color:#64748b">Importance</div><div style="font-weight:700;color:#3b82f6">${node.importance}</div></div>
            <div><div style="color:#64748b">Inbound flows</div><div style="font-weight:700">${upstream.length}</div></div>
            <div><div style="color:#64748b">Outbound flows</div><div style="font-weight:700">${downstream.length}</div></div>
            <div><div style="color:#64748b">Total throughput</div><div style="font-weight:700;color:#06b6d4">${(upstream.concat(downstream).reduce((s,e)=>s+e.volume,0)).toLocaleString()} TEU</div></div>
            <div><div style="color:#64748b">Capacity</div><div style="font-weight:700">${node.capacity ? node.capacity.toLocaleString() : 'n/a'}</div></div>
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 5. WHAT-IF SIMULATOR
  // ------------------------------------------------------------------
  function renderWhatIf(c) {
    const db = initDatabase();
    const removed = whatIfRemovedId ? db.nodes.find(n => n.id === whatIfRemovedId) : null;
    const scenario = whatIfRemovedId ? db.scenarios.find(s => s.nodeId === whatIfRemovedId) : null;
    c.innerHTML = `
      <div class="cc-ng-header">
        <h2 class="cc-ng-page-title">🧪 What-If Simulator <span class="cc-ng-page-badge">CASCADE ANALYSIS</span></h2>
      </div>
      <div class="cc-ng-section">
        <div class="cc-ng-section-title">🎯 Select a node to simulate removal</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:16px">
          <select class="cc-ng-input" onchange="window.__ccNG.onWhatIfSelect(this.value)" style="min-width:260px">
            <option value="">— Select a node to remove —</option>
            ${db.nodes.map(n => `<option value="${n.id}" ${whatIfRemovedId===n.id?'selected':''}>${n.name} (${TYPE_LABELS[n.type]})</option>`).join('')}
          </select>
          ${whatIfRemovedId ? `<button class="cc-ng-btn cc-ng-btn-danger" onclick="window.__ccNG.onWhatIfSelect('')">↺ Reset</button>` : ''}
        </div>
        ${whatIfRemovedId ? `
          <div class="cc-ng-graph-wrap">
            ${renderGraphSVG('normal', 'whatif')}
            <div class="cc-ng-legend">
              <span style="display:flex;align-items:center;gap:6px"><span class="cc-ng-legend-dot" style="background:#475569"></span> Removed node (greyed)</span>
              <span style="color:#ef4444;font-weight:600">⚠️ ${removed.name} has been removed from the network</span>
            </div>
          </div>
        ` : `
          <div style="padding:40px;text-align:center;color:#64748b;font-size:13px">Select a node above to simulate its removal and view cascading impact.</div>
        `}
      </div>
      ${scenario ? `
        <div class="cc-ng-cards">
          <div class="cc-ng-card"><div class="cc-ng-card-label">Lost Flow</div><div class="cc-ng-card-value" style="color:#ef4444">${(scenario.lostFlow/1000).toFixed(1)}k TEU</div><div class="cc-ng-card-delta">per month</div></div>
          <div class="cc-ng-card"><div class="cc-ng-card-label">Downstream Affected</div><div class="cc-ng-card-value" style="color:#f97316">${scenario.affectedDownstream}</div><div class="cc-ng-card-delta">cascading nodes</div></div>
          <div class="cc-ng-card"><div class="cc-ng-card-label">Est. Cost Impact</div><div class="cc-ng-card-value">${formatCurrency(scenario.estCost)}</div><div class="cc-ng-card-delta">per month</div></div>
          <div class="cc-ng-card"><div class="cc-ng-card-label">Avg Delay</div><div class="cc-ng-card-value" style="color:#f59e0b">${scenario.daysDelay}d</div><div class="cc-ng-card-delta">${scenario.altRoutes} alternate routes</div></div>
        </div>
        <div class="cc-ng-section">
          <div class="cc-ng-section-title">📋 Cascading Impact Report</div>
          <div class="cc-ng-grid-2">
            <div class="cc-ng-tile">
              <div class="cc-ng-tile-title">Direct Impact</div>
              <div class="cc-ng-tile-sub">${removed.name}</div>
              <div class="cc-ng-tile-desc">All flows through this node are interrupted. ${(scenario.lostFlow).toLocaleString()} TEU/mo of cargo requires rerouting through alternate pathways.</div>
            </div>
            <div class="cc-ng-tile">
              <div class="cc-ng-tile-title">Cascading Nodes</div>
              <div class="cc-ng-tile-sub">${scenario.affectedDownstream} downstream nodes</div>
              <div class="cc-ng-tile-desc">An estimated ${scenario.affectedDownstream} downstream nodes lose inbound supply, triggering inventory drawdown and possible stockouts within 7-14 days.</div>
            </div>
            <div class="cc-ng-tile">
              <div class="cc-ng-tile-title">Cost Estimate</div>
              <div class="cc-ng-tile-sub">${formatCurrency(scenario.estCost)}/mo</div>
              <div class="cc-ng-tile-desc">Combined cost of expedited shipping, inventory carrying, lost sales penalties and customer compensation. Peak-season impact could be 2-3x higher.</div>
            </div>
            <div class="cc-ng-tile">
              <div class="cc-ng-tile-title">Recovery Time</div>
              <div class="cc-ng-tile-sub">${scenario.daysDelay} days</div>
              <div class="cc-ng-tile-desc">Estimated time to reroute via ${scenario.altRoutes} alternate pathways and restore normal throughput. Longer if alternate routes are at capacity.</div>
            </div>
          </div>
        </div>
        <div class="cc-ng-section">
          <div class="cc-ng-section-title">🛡️ Mitigation Recommendations</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${[
              `Activate ${scenario.altRoutes} pre-qualified alternate routes to absorb ${(scenario.lostFlow*0.7).toLocaleString()} TEU/mo (70% of lost flow)`,
              `Draw down safety stock at ${scenario.affectedDownstream} downstream DCs — projected 14-day coverage at current consumption`,
              `Engage backup supplier(s) within 7 days to fill the ${(scenario.lostFlow*0.3).toLocaleString()} TEU/mo residual gap`,
              `Notify top-10 customers of potential ${scenario.daysDelay}-day delay; offer premium-reroute for critical orders`,
              `Initiate repair/restoration of removed node — ETA ${Math.ceil(scenario.daysDelay*1.5)} days for full recovery`
            ].map(r => `<div style="padding:10px 14px;background:rgba(37,99,235,0.06);border-left:3px solid #06b6d4;border-radius:6px;font-size:12px;color:#cbd5e1">✓ ${r}</div>`).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-ng-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-ng-overlay');
    if (overlay) overlay.remove();
    // Reset what-if state on close
    hiddenNodes = new Set();
    whatIfRemovedId = null;
  }

  function setView(view) {
    currentView = view;
    renderContent();
  }

  function selectNode(id) {
    selectedNodeId = id;
    if (currentView === 'deps') renderContent();
    else setView('deps');
  }

  function goToDeps(id) {
    selectedNodeId = id;
    setView('deps');
  }

  function onWhatIfSelect(id) {
    whatIfRemovedId = id || null;
    hiddenNodes = new Set();
    if (id) hiddenNodes.add(id);
    const c = document.getElementById('cc-ng-content');
    if (c) renderWhatIf(c);
  }

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  function init() {
    injectStyles();
    window.__ccNG = { open, close, setView, selectNode, goToDeps, onWhatIfSelect };

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (document.getElementById('cc-ng-overlay')) close();
      }
    });
  }

  init();
})();
