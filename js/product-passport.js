// ====================================================================
// product-passport.js — Digital Product Passport (DPP)
// ====================================================================
// EU ESPR-aligned digital product passport module:
//   1. Overview: KPI cards (products tracked, passports issued, compliance, blockchain)
//   2. Product Registry: table of products with passport ID, name, origin, journey, ESG
//   3. Traceability: timeline view of a product's journey (raw → mfg → transport → storage → delivery)
//   4. Compliance: EU ESPR readiness, DPP format compliance, data completeness
//   5. QR Scanner: simulated QR scan interface showing passport data when "scanned"
//
// Architecture: IIFE + modal + sidebar pattern. No floating button.
// CSS prefix: cc-pp-  ·  Global API: window.__ccPP.open()
// ====================================================================
(function() {
  'use strict';

  if (window.__productPassportLoaded) return;
  window.__productPassportLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_product_passport_db_v1';

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
  const PRODUCTS = [
    { id: 'DPP-2025-0001', name: 'Organic Cotton T-Shirt', category: 'Apparel', origin: 'Tirupur, India', mfg: '2025-08-14', stages: 6, esg: 88, blockchain: true, compliance: 96 },
    { id: 'DPP-2025-0002', name: 'Aluminium Bike Frame Pro', category: 'Sporting', origin: 'Osaka, Japan', mfg: '2025-09-02', stages: 7, esg: 92, blockchain: true, compliance: 98 },
    { id: 'DPP-2025-0003', name: 'Stainless Steel Water Bottle', category: 'Homeware', origin: 'Shanghai, China', mfg: '2025-07-22', stages: 5, esg: 76, blockchain: true, compliance: 88 },
    { id: 'DPP-2025-0004', name: 'Recycled PET Backpack', category: 'Accessories', origin: 'Ho Chi Minh, Vietnam', mfg: '2025-09-19', stages: 6, esg: 94, blockchain: true, compliance: 99 },
    { id: 'DPP-2025-0005', name: 'Bamboo Kitchen Utensil Set', category: 'Homeware', origin: 'Bali, Indonesia', mfg: '2025-10-04', stages: 4, esg: 96, blockchain: false, compliance: 84 },
    { id: 'DPP-2025-0006', name: 'Leather Wallet Premium', category: 'Accessories', origin: 'Florence, Italy', mfg: '2025-09-25', stages: 6, esg: 72, blockchain: true, compliance: 82 },
    { id: 'DPP-2025-0007', name: 'Glass Storage Container', category: 'Homeware', origin: 'Istanbul, Turkey', mfg: '2025-12-22', stages: 5, esg: 80, blockchain: true, compliance: 91 },
    { id: 'DPP-2025-0008', name: 'Hemp Canvas Tote Bag', category: 'Accessories', origin: 'Porto, Portugal', mfg: '2025-11-08', stages: 4, esg: 95, blockchain: true, compliance: 97 },
    { id: 'DPP-2025-0009', name: 'Ceramic Coffee Mug', category: 'Homeware', origin: 'Jingdezhen, China', mfg: '2025-08-30', stages: 5, esg: 78, blockchain: false, compliance: 86 },
    { id: 'DPP-2025-0010', name: 'Wooden Toy Train Set', category: 'Toys', origin: 'Erzgebirge, Germany', mfg: '2025-09-02', stages: 5, esg: 91, blockchain: true, compliance: 95 },
    { id: 'DPP-2025-0011', name: 'Silicone Food Wrap Reusable', category: 'Homeware', origin: 'Bangkok, Thailand', mfg: '2025-10-14', stages: 4, esg: 86, blockchain: true, compliance: 92 },
    { id: 'DPP-2025-0012', name: 'Wool Sweater Premium', category: 'Apparel', origin: 'Patagonia, Argentina', mfg: '2025-07-15', stages: 6, esg: 84, blockchain: true, compliance: 90 }
  ];

  // Journey stages for each product (traceability timeline)
  const STAGES_TEMPLATE = [
    { stage: 'Raw Material Extraction', icon: '⛏️', location: 'Origin', verified: true, duration: '14 days', co2: 4.2, transactions: 3 },
    { stage: 'Raw Material Processing', icon: '🔄', location: 'Regional Hub', verified: true, duration: '7 days', co2: 6.8, transactions: 4 },
    { stage: 'Manufacturing', icon: '🏭', location: 'Origin Factory', verified: true, duration: '3 days', co2: 12.4, transactions: 6 },
    { stage: 'Quality Inspection', icon: '🔍', location: 'Origin QC Lab', verified: true, duration: '1 day', co2: 0.8, transactions: 2 },
    { stage: 'Transport (Ocean/Air)', icon: '🚢', location: 'International', verified: true, duration: '18 days', co2: 24.6, transactions: 8 },
    { stage: 'Distribution Center', icon: '🏬', location: 'Destination DC', verified: true, duration: '4 days', co2: 3.2, transactions: 3 },
    { stage: 'Retail / Delivery', icon: '📦', location: 'Customer', verified: false, duration: '2 days', co2: 1.8, transactions: 2 }
  ];

  const COMPLIANCE_CHECKS = [
    { id: 'espr', name: 'EU ESPR Readiness', desc: 'Eco-design for Sustainable Products Regulation (in force 2024)', status: 'Compliant', score: 92, due: '2027-07-01', products: 11 },
    { id: 'dpp-format', name: 'DPP Format Compliance', desc: 'EU DPP data model & GS1/EPCIS alignment', status: 'Compliant', score: 95, due: '2026-12-31', products: 12 },
    { id: 'data-complete', name: 'Data Completeness', desc: 'Mandatory fields: origin, materials, repair, recyclability', status: 'Compliant', score: 88, due: '2026-12-31', products: 10 },
    { id: 'blockchain-verify', name: 'Blockchain Verification', desc: 'Immutable trail on Polygon PoS ledger', status: 'Compliant', score: 91, due: 'Continuous', products: 10 },
    { id: 'iso-14001', name: 'ISO 14001 Environmental', desc: 'Environmental management system certification', status: 'Compliant', score: 90, due: '2026-06-30', products: 12 },
    { id: 'gs1-epcis', name: 'GS1 EPCIS 2.0', desc: 'Electronic Product Code Information Services standard', status: 'In Progress', score: 74, due: '2026-09-30', products: 9 },
    { id: 'repair-score', name: 'Repairability Score', desc: 'France AGEM law — repair index per product', status: 'In Progress', score: 68, due: '2026-03-31', products: 8 },
    { id: 'recyclability', name: 'Recyclability Declaration', desc: '% recyclable material & end-of-life pathway', status: 'In Progress', score: 72, due: '2026-12-31', products: 7 }
  ];

  // ------------------------------------------------------------------
  // DB INIT
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.generated) return db;
    // Build journey stages per product (synthesise dates relative to mfg)
    const passports = PRODUCTS.map((p, idx) => {
      const startDate = new Date(p.mfg).getTime() - 30 * 86400000; // start 30 days before mfg
      const stages = STAGES_TEMPLATE.map((s, i) => {
        const dayOffset = parseInt(s.duration) * i;
        return { ...s, ts: startDate + dayOffset * 86400000, hash: '0x' + (idx*7 + i*31).toString(16).padStart(8, '0') + Math.random().toString(16).substr(2, 32) };
      });
      return { ...p, stages };
    });
    db = {
      products: PRODUCTS,
      passports,
      compliance: COMPLIANCE_CHECKS,
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
  let selectedProductId = null;
  let productSearch = '';
  let productFilter = 'all';
  let qrScanned = false;

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-pp-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-pp-styles';
    style.textContent = `
      .cc-pp-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10012; background: rgba(22,8,16,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-pp-sidebar { width: 220px; flex-shrink: 0; background: rgba(40,16,28,0.6); border-right: 1px solid rgba(190,24,93,0.18); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-pp-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(190,24,93,0.18); margin-bottom: 12px; }
      .cc-pp-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; background: linear-gradient(135deg, #be185d, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .cc-pp-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-pp-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; font-family: inherit; }
      .cc-pp-nav-item:hover { background: rgba(190,24,93,0.06); color: #e2e8f0; }
      .cc-pp-nav-item.active { background: rgba(190,24,93,0.1); color: #ec4899; border-left-color: #ec4899; }
      .cc-pp-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-pp-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-pp-close { position: fixed; top: 16px; right: 20px; z-index: 10013; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-pp-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-pp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(190,24,93,0.18); flex-wrap: wrap; gap: 12px; }
      .cc-pp-page-title { font-size: 22px; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #be185d, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .cc-pp-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #be185d, #ec4899); color: #fff; font-weight: 600; -webkit-text-fill-color: #fff; }
      .cc-pp-live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #ec4899; font-weight: 600; }
      .cc-pp-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #ec4899; animation: cc-pp-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-pp-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .cc-pp-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-pp-card { background: linear-gradient(135deg, rgba(190,24,93,0.06), rgba(236,72,153,0.06)); border: 1px solid rgba(190,24,93,0.22); border-radius: 12px; padding: 16px; }
      .cc-pp-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 6px; }
      .cc-pp-card-value { font-size: 24px; font-weight: 800; color: #fff; }
      .cc-pp-card-delta { font-size: 11px; margin-top: 4px; color: #94a3b8; }
      .cc-pp-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(190,24,93,0.18); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
      .cc-pp-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
      .cc-pp-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-pp-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(190,24,93,0.2); }
      .cc-pp-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; vertical-align: middle; }
      .cc-pp-table tr:hover td { background: rgba(190,24,93,0.05); }
      .cc-pp-scroll { max-height: 520px; overflow-y: auto; border: 1px solid rgba(190,24,93,0.18); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(190,24,93,0.4) transparent; }
      .cc-pp-scroll::-webkit-scrollbar { width: 8px; }
      .cc-pp-scroll::-webkit-scrollbar-track { background: transparent; }
      .cc-pp-scroll::-webkit-scrollbar-thumb { background: rgba(190,24,93,0.3); border-radius: 4px; }
      .cc-pp-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
      .cc-pp-status-ok { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-pp-status-warn { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-pp-status-prog { background: rgba(236,72,153,0.15); color: #ec4899; border: 1px solid rgba(236,72,153,0.3); }
      .cc-pp-status-info { background: rgba(6,182,212,0.15); color: #06b6d4; border: 1px solid rgba(6,182,212,0.3); }
      .cc-pp-bar-track { display: inline-block; width: 80px; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; vertical-align: middle; margin-right: 6px; }
      .cc-pp-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #be185d, #ec4899); }
      .cc-pp-input { background: rgba(40,16,28,0.7); border: 1px solid rgba(190,24,93,0.25); color: #e2e8f0; border-radius: 8px; padding: 9px 12px; font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.2s; }
      .cc-pp-input:focus { border-color: #ec4899; box-shadow: 0 0 0 3px rgba(190,24,93,0.2); }
      .cc-pp-btn { background: linear-gradient(135deg, #be185d, #ec4899); color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: transform 0.15s, box-shadow 0.15s; }
      .cc-pp-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(190,24,93,0.4); }
      .cc-pp-btn-ghost { background: transparent; color: #ec4899; border: 1px solid rgba(190,24,93,0.4); }
      .cc-pp-btn-ghost:hover { background: rgba(190,24,93,0.08); box-shadow: none; }
      .cc-pp-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
      .cc-pp-tile { background: linear-gradient(135deg, rgba(190,24,93,0.05), rgba(236,72,153,0.05)); border: 1px solid rgba(190,24,93,0.22); border-radius: 12px; padding: 16px; transition: border-color 0.2s, transform 0.2s; cursor: pointer; }
      .cc-pp-tile:hover { border-color: rgba(190,24,93,0.5); transform: translateY(-2px); }
      .cc-pp-tile-title { font-size: 14px; font-weight: 700; color: #fff; }
      .cc-pp-tile-sub { font-size: 11px; color: #ec4899; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
      .cc-pp-tile-desc { font-size: 12px; color: #94a3b8; margin-top: 8px; line-height: 1.5; }
      .cc-pp-timeline { position: relative; padding-left: 36px; }
      .cc-pp-timeline::before { content: ''; position: absolute; left: 18px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, #be185d, #ec4899); }
      .cc-pp-timeline-item { position: relative; padding: 14px 0 14px 28px; }
      .cc-pp-timeline-item::before { content: ''; position: absolute; left: -22px; top: 20px; width: 16px; height: 16px; border-radius: 50%; background: linear-gradient(135deg, #be185d, #ec4899); box-shadow: 0 0 0 4px rgba(190,24,93,0.2); }
      .cc-pp-timeline-item.pending::before { background: rgba(100,116,139,0.4); box-shadow: 0 0 0 4px rgba(100,116,139,0.15); }
      .cc-pp-timeline-stage { font-size: 11px; color: #ec4899; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
      .cc-pp-timeline-icon { font-size: 18px; margin-right: 6px; }
      .cc-pp-timeline-title { font-size: 14px; font-weight: 700; color: #fff; margin-top: 4px; }
      .cc-pp-timeline-meta { font-size: 11px; color: #94a3b8; margin-top: 6px; display: flex; gap: 14px; flex-wrap: wrap; }
      .cc-pp-timeline-hash { font-family: monospace; font-size: 10px; color: #64748b; margin-top: 6px; word-break: break-all; }
      .cc-pp-qr-wrap { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
      .cc-pp-qr-box { width: 240px; height: 240px; background: #fff; border-radius: 16px; padding: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; position: relative; }
      .cc-pp-qr-scan-line { position: absolute; left: 16px; right: 16px; height: 3px; background: linear-gradient(90deg, transparent, #ec4899, transparent); box-shadow: 0 0 12px #ec4899; animation: cc-pp-scan 1.6s ease-in-out infinite; }
      @keyframes cc-pp-scan { 0%,100% { top: 16px; } 50% { top: 220px; } }
      .cc-pp-detail-panel { background: rgba(190,24,93,0.06); border: 1px solid rgba(190,24,93,0.25); border-radius: 12px; padding: 18px; }
      @media (max-width: 767px) {
        .cc-pp-modal { flex-direction: column; }
        .cc-pp-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-pp-sidebar-brand { display: none; }
        .cc-pp-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-pp-nav-item.active { border-bottom-color: #ec4899; border-left-color: transparent; }
        .cc-pp-main { padding: 12px 12px 20px; }
        .cc-pp-cards { grid-template-columns: repeat(2, 1fr); }
        .cc-pp-qr-box { width: 180px; height: 180px; }
      }
      html:not(.dark) .cc-pp-modal { background: rgba(253,247,250,0.99); color: #1e293b; }
      html:not(.dark) .cc-pp-sidebar { background: rgba(252,236,243,0.8); border-right-color: rgba(190,24,93,0.12); }
      html:not(.dark) .cc-pp-sidebar-title { background: linear-gradient(135deg, #9d174d, #db2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      html:not(.dark) .cc-pp-nav-item { color: #64748b; }
      html:not(.dark) .cc-pp-nav-item:hover { background: rgba(190,24,93,0.06); color: #1e293b; }
      html:not(.dark) .cc-pp-nav-item.active { background: rgba(190,24,93,0.1); color: #9d174d; }
      html:not(.dark) .cc-pp-page-title { background: linear-gradient(135deg, #9d174d, #db2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      html:not(.dark) .cc-pp-header { border-bottom-color: rgba(190,24,93,0.1); }
      html:not(.dark) .cc-pp-card { background: rgba(190,24,93,0.05); border-color: rgba(190,24,93,0.2); }
      html:not(.dark) .cc-pp-card-label { color: #64748b; }
      html:not(.dark) .cc-pp-card-value { color: #0f172a; }
      html:not(.dark) .cc-pp-card-delta { color: #64748b; }
      html:not(.dark) .cc-pp-section { background: rgba(0,0,0,0.02); border-color: rgba(190,24,93,0.15); }
      html:not(.dark) .cc-pp-section-title { color: #1e293b; }
      html:not(.dark) .cc-pp-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-pp-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-pp-table tr:hover td { background: rgba(190,24,93,0.04); }
      html:not(.dark) .cc-pp-input { background: #fff; border-color: rgba(190,24,93,0.2); color: #1e293b; }
      html:not(.dark) .cc-pp-tile { background: rgba(190,24,93,0.04); border-color: rgba(190,24,93,0.18); }
      html:not(.dark) .cc-pp-tile-title { color: #0f172a; }
      html:not(.dark) .cc-pp-tile-desc { color: #64748b; }
      html:not(.dark) .cc-pp-timeline-title { color: #0f172a; }
      html:not(.dark) .cc-pp-timeline-meta { color: #64748b; }
      html:not(.dark) .cc-pp-detail-panel { background: rgba(190,24,93,0.06); border-color: rgba(190,24,93,0.2); }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // QR CODE SVG (synthetic — decorative matrix pattern)
  // ------------------------------------------------------------------
  function renderQRSVG(seed) {
    const size = 21;
    const cells = [];
    // Deterministic pseudo-random based on seed
    let s = 0;
    for (let i = 0; i < (seed || 'DPP').length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    function rand() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Position detection patterns (corners)
        const inCorner = (x < 7 && y < 7) || (x >= size-7 && y < 7) || (x < 7 && y >= size-7);
        if (inCorner) {
          const lx = x < 7 ? x : x - (size-7);
          const ly = y < 7 ? y : y - (size-7);
          const isEdge = lx === 0 || lx === 6 || ly === 0 || ly === 6;
          const isInner = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
          if (isEdge || isInner) cells.push(`<rect x="${x*10}" y="${y*10}" width="10" height="10" fill="#0f172a"/>`);
        } else if (rand() > 0.55) {
          cells.push(`<rect x="${x*10}" y="${y*10}" width="10" height="10" fill="#0f172a"/>`);
        }
      }
    }
    return `
      <svg viewBox="0 0 210 210" width="100%" height="100%" style="display:block">
        <rect width="210" height="210" fill="#fff"/>
        ${cells.join('')}
      </svg>
    `;
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    initDatabase();
    const overlay = document.createElement('div');
    overlay.id = 'cc-pp-overlay';
    overlay.className = 'cc-pp-modal';
    overlay.innerHTML = `
      <button class="cc-pp-close" onclick="window.__ccPP.close()" aria-label="Close">×</button>
      <div class="cc-pp-sidebar">
        <div class="cc-pp-sidebar-brand">
          <div class="cc-pp-sidebar-title">🛰️ Product Passport</div>
          <div class="cc-pp-sidebar-sub">Digital Product Passport (DPP)</div>
        </div>
        <button class="cc-pp-nav-item ${currentView==='overview'?'active':''}" onclick="window.__ccPP.setView('overview')"><span class="cc-pp-nav-icon">📊</span> Overview</button>
        <button class="cc-pp-nav-item ${currentView==='registry'?'active':''}" onclick="window.__ccPP.setView('registry')"><span class="cc-pp-nav-icon">📚</span> Product Registry</button>
        <button class="cc-pp-nav-item ${currentView==='trace'?'active':''}" onclick="window.__ccPP.setView('trace')"><span class="cc-pp-nav-icon">🛰️</span> Traceability</button>
        <button class="cc-pp-nav-item ${currentView==='compliance'?'active':''}" onclick="window.__ccPP.setView('compliance')"><span class="cc-pp-nav-icon">📋</span> Compliance</button>
        <button class="cc-pp-nav-item ${currentView==='qr'?'active':''}" onclick="window.__ccPP.setView('qr')"><span class="cc-pp-nav-icon">📷</span> QR Scanner</button>
      </div>
      <div class="cc-pp-main" id="cc-pp-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const container = document.getElementById('cc-pp-content');
    if (!container) return;
    if (currentView === 'overview') renderOverview(container);
    else if (currentView === 'registry') renderRegistry(container);
    else if (currentView === 'trace') renderTrace(container);
    else if (currentView === 'compliance') renderCompliance(container);
    else if (currentView === 'qr') renderQR(container);
    document.querySelectorAll('.cc-pp-nav-item').forEach(item => {
      const oc = item.getAttribute('onclick') || '';
      item.classList.toggle('active', oc.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // 1. OVERVIEW
  // ------------------------------------------------------------------
  function renderOverview(c) {
    const db = initDatabase();
    const totalProducts = db.products.length;
    const bcVerified = db.products.filter(p => p.blockchain).length;
    const avgCompliance = Math.round(db.products.reduce((s, p) => s + p.compliance, 0) / db.products.length);
    const compliantChecks = db.compliance.filter(x => x.status === 'Compliant').length;
    c.innerHTML = `
      <div class="cc-pp-header">
        <h2 class="cc-pp-page-title">🛰️ Digital Product Passport Overview <span class="cc-pp-page-badge">EU ESPR READY</span></h2>
        <div class="cc-pp-live-indicator"><div class="cc-pp-live-dot"></div> Blockchain synced</div>
      </div>
      <div class="cc-pp-cards">
        <div class="cc-pp-card"><div class="cc-pp-card-label">Products Tracked</div><div class="cc-pp-card-value">${totalProducts}</div><div class="cc-pp-card-delta">across ${new Set(db.products.map(p=>p.category)).size} categories</div></div>
        <div class="cc-pp-card"><div class="cc-pp-card-label">Passports Issued</div><div class="cc-pp-card-value" style="color:#ec4899">${totalProducts}</div><div class="cc-pp-card-delta">100% passport coverage</div></div>
        <div class="cc-pp-card"><div class="cc-pp-card-label">Compliance Rate</div><div class="cc-pp-card-value" style="color:#22c55e">${avgCompliance}%</div><div class="cc-pp-card-delta">avg across all products</div></div>
        <div class="cc-pp-card"><div class="cc-pp-card-label">Blockchain Verified</div><div class="cc-pp-card-value" style="color:#ec4899">${bcVerified}/${totalProducts}</div><div class="cc-pp-card-delta">${Math.round(bcVerified/totalProducts*100)}% on Polygon PoS</div></div>
      </div>
      <div class="cc-pp-section">
        <div class="cc-pp-section-title">📊 Product Compliance Distribution</div>
        <div style="display:flex;align-items:flex-end;gap:10px;height:220px;padding:0 4px">
          ${db.products.map(p => {
            const pct = p.compliance;
            const color = p.compliance >= 90 ? '#22c55e' : p.compliance >= 80 ? '#ec4899' : '#f59e0b';
            return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
                <div style="font-size:10px;font-weight:700;color:${color}">${p.compliance}%</div>
                <div style="width:100%;max-width:42px;border-radius:4px 4px 0 0;min-height:4px;background:${color};height:${pct}%;cursor:pointer;transition:opacity 0.2s" title="${p.name}: ${p.compliance}% compliance"></div>
                <div style="font-size:9px;color:#94a3b8;text-align:center;max-width:55px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name.split(' ')[0]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="cc-pp-section">
        <div class="cc-pp-section-title">🌍 Origin Distribution</div>
        <div class="cc-pp-grid-2">
          ${(() => {
            const byCountry = {};
            db.products.forEach(p => {
              const country = p.origin.split(',').pop().trim();
              byCountry[country] = (byCountry[country] || 0) + 1;
            });
            const max = Math.max(...Object.values(byCountry));
            return Object.keys(byCountry).sort((a,b)=>byCountry[b]-byCountry[a]).map(c => `
              <div class="cc-pp-tile" onclick="window.__ccPP.setView('registry')">
                <div class="cc-pp-tile-title">${c}</div>
                <div class="cc-pp-tile-sub">${byCountry[c]} product${byCountry[c]>1?'s':''}</div>
                <div class="cc-pp-tile-desc">${Math.round((byCountry[c]/db.products.length)*100)}% of total portfolio</div>
                <div style="margin-top:10px"><span class="cc-pp-bar-track" style="width:100%"><span class="cc-pp-bar-fill" style="width:${(byCountry[c]/max)*100}%"></span></span></div>
              </div>
            `).join('');
          })()}
        </div>
      </div>
      <div class="cc-pp-section">
        <div class="cc-pp-section-title">🏆 Compliance Highlights</div>
        <div class="cc-pp-grid-2">
          <div class="cc-pp-tile">
            <div class="cc-pp-tile-title">${compliantChecks}/${db.compliance.length} checks compliant</div>
            <div class="cc-pp-tile-sub">Regulatory status</div>
            <div class="cc-pp-tile-desc">EU ESPR, DPP format, data completeness, blockchain verification & ISO 14001 all compliant. GS1 EPCIS, repair score and recyclability declaration in progress.</div>
          </div>
          <div class="cc-pp-tile">
            <div class="cc-pp-tile-title">${db.passports.reduce((s,p)=>s+p.stages.length,0)} journey events on-chain</div>
            <div class="cc-pp-tile-sub">Blockchain trail</div>
            <div class="cc-pp-tile-desc">Every product has ${STAGES_TEMPLATE.length} traceable stages from raw material extraction through retail delivery, with each event hashed and anchored to Polygon PoS.</div>
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 2. PRODUCT REGISTRY
  // ------------------------------------------------------------------
  function renderRegistry(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-pp-header">
        <h2 class="cc-pp-page-title">📚 Product Registry <span class="cc-pp-page-badge">${db.products.length} PRODUCTS</span></h2>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <input class="cc-pp-input" placeholder="Search by name, ID or origin..." style="flex:1;min-width:240px" value="${productSearch}" oninput="window.__ccPP.onSearch(this.value)"/>
        <select class="cc-pp-input" onchange="window.__ccPP.onFilter(this.value)">
          <option value="all" ${productFilter==='all'?'selected':''}>All categories</option>
          ${[...new Set(db.products.map(p=>p.category))].map(cat => `<option value="${cat}" ${productFilter===cat?'selected':''}>${cat}</option>`).join('')}
        </select>
      </div>
      <div class="cc-pp-section">
        <div class="cc-pp-section-title">📋 Passport Registry</div>
        <div class="cc-pp-scroll">
          <table class="cc-pp-table">
            <thead><tr><th>Passport ID</th><th>Product</th><th>Category</th><th>Origin</th><th>Mfg Date</th><th>Stages</th><th>ESG</th><th>Compliance</th><th>Blockchain</th><th>Action</th></tr></thead>
            <tbody>
              ${getFilteredProducts(db).map(p => {
                const bcSt = p.blockchain ? 'cc-pp-status-ok' : 'cc-pp-status-warn';
                const compColor = p.compliance >= 90 ? '#22c55e' : p.compliance >= 80 ? '#ec4899' : '#f59e0b';
                return `
                  <tr>
                    <td style="font-family:monospace;color:#ec4899;font-weight:700">${p.id}</td>
                    <td style="font-weight:700">${p.name}</td>
                    <td>${p.category}</td>
                    <td style="font-size:11px">${p.origin}</td>
                    <td style="font-size:11px;color:#94a3b8">${formatDate(p.mfg).substr(0,10)}</td>
                    <td>${p.stages}</td>
                    <td style="font-weight:700;color:#ec4899">${p.esg}</td>
                    <td><span class="cc-pp-bar-track" style="width:50px"><span class="cc-pp-bar-fill" style="width:${p.compliance}%;background:${compColor}"></span></span><strong style="color:${compColor}">${p.compliance}%</strong></td>
                    <td><span class="cc-pp-status ${bcSt}">${p.blockchain ? 'Verified' : 'Pending'}</span></td>
                    <td><button class="cc-pp-btn cc-pp-btn-ghost" onclick="window.__ccPP.viewTrace('${p.id}')">Trace</button></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function getFilteredProducts(db) {
    let list = db.products;
    if (productFilter !== 'all') list = list.filter(p => p.category === productFilter);
    if (productSearch) {
      const q = productSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().indexOf(q) !== -1 || p.id.toLowerCase().indexOf(q) !== -1 || p.origin.toLowerCase().indexOf(q) !== -1);
    }
    return list;
  }

  // ------------------------------------------------------------------
  // 3. TRACEABILITY
  // ------------------------------------------------------------------
  function renderTrace(c) {
    const db = initDatabase();
    const sel = selectedProductId || db.passports[0].id;
    const passport = db.passports.find(p => p.id === sel);
    c.innerHTML = `
      <div class="cc-pp-header">
        <h2 class="cc-pp-page-title">🛰️ Traceability Timeline <span class="cc-pp-page-badge">${passport.id}</span></h2>
      </div>
      <div style="margin-bottom:16px">
        <select class="cc-pp-input" onchange="window.__ccPP.selectProduct(this.value)" style="min-width:280px">
          ${db.passports.map(p => `<option value="${p.id}" ${sel===p.id?'selected':''}>${p.id} — ${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="cc-pp-section">
        <div class="cc-pp-section-title">📦 Product Summary</div>
        <div class="cc-pp-detail-panel">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <div>
              <div style="font-size:18px;font-weight:800;color:#fff">${passport.name}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:4px">Origin: ${passport.origin} · Mfg: ${formatDate(passport.mfg).substr(0,10)} · Category: ${passport.category}</div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <span class="cc-pp-status cc-pp-status-info">ESG ${passport.esg}/100</span>
              <span class="cc-pp-status ${passport.compliance>=90?'cc-pp-status-ok':'cc-pp-status-warn'}">Compliance ${passport.compliance}%</span>
              <span class="cc-pp-status ${passport.blockchain?'cc-pp-status-ok':'cc-pp-status-warn'}">${passport.blockchain?'⛓️ On-chain':'⏳ Pending'}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="cc-pp-section">
        <div class="cc-pp-section-title">🛰️ End-to-End Journey — ${passport.stages.length} stages</div>
        <div class="cc-pp-timeline">
          ${passport.stages.map(s => `
            <div class="cc-pp-timeline-item ${s.verified ? '' : 'pending'}">
              <div class="cc-pp-timeline-stage"><span class="cc-pp-timeline-icon">${s.icon}</span>${s.stage}</div>
              <div class="cc-pp-timeline-title">${s.location} · ${formatDate(s.ts).substr(0,10)}</div>
              <div class="cc-pp-timeline-meta">
                <span>⏱️ Duration: ${s.duration}</span>
                <span style="color:#22c55e">🌱 CO2: ${s.co2} kg</span>
                <span>⛓️ ${s.transactions} tx</span>
                <span>${s.verified ? '✅ Verified' : '⏳ Pending verification'}</span>
              </div>
              <div class="cc-pp-timeline-hash">⛓️ ${s.hash}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="cc-pp-section">
        <div class="cc-pp-section-title">📊 Carbon Footprint by Stage</div>
        <div style="display:flex;align-items:flex-end;gap:10px;height:200px;padding:0 4px">
          ${passport.stages.map(s => {
            const max = Math.max(...passport.stages.map(x=>x.co2));
            const pct = (s.co2 / max) * 100;
            return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
                <div style="font-size:10px;font-weight:700;color:#22c55e">${s.co2}</div>
                <div style="width:100%;max-width:50px;border-radius:4px 4px 0 0;min-height:4px;background:linear-gradient(180deg, #22c55e, #14b8a6);height:${pct}%;cursor:pointer;transition:opacity 0.2s" title="${s.stage}: ${s.co2} kg CO2"></div>
                <div style="font-size:9px;color:#94a3b8;text-align:center;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.stage.split(' ')[0]}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top:8px;text-align:center;font-size:11px;color:#94a3b8">Total carbon footprint: <strong style="color:#22c55e">${passport.stages.reduce((s,x)=>s+x.co2,0).toFixed(1)} kg CO2e</strong></div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 4. COMPLIANCE
  // ------------------------------------------------------------------
  function renderCompliance(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-pp-header">
        <h2 class="cc-pp-page-title">📋 Compliance Status <span class="cc-pp-page-badge">${db.compliance.length} CHECKS</span></h2>
      </div>
      <div class="cc-pp-cards">
        <div class="cc-pp-card"><div class="cc-pp-card-label">Compliant</div><div class="cc-pp-card-value" style="color:#22c55e">${db.compliance.filter(x=>x.status==='Compliant').length}</div></div>
        <div class="cc-pp-card"><div class="cc-pp-card-label">In Progress</div><div class="cc-pp-card-value" style="color:#ec4899">${db.compliance.filter(x=>x.status==='In Progress').length}</div></div>
        <div class="cc-pp-card"><div class="cc-pp-card-label">Avg Score</div><div class="cc-pp-card-value">${Math.round(db.compliance.reduce((s,x)=>s+x.score,0)/db.compliance.length)}</div></div>
        <div class="cc-pp-card"><div class="cc-pp-card-label">Products Covered</div><div class="cc-pp-card-value" style="color:#ec4899">${db.products.length}</div></div>
      </div>
      <div class="cc-pp-section">
        <div class="cc-pp-section-title">🌐 Regulatory Compliance Tracker</div>
        <div class="cc-pp-scroll">
          <table class="cc-pp-table">
            <thead><tr><th>ID</th><th>Check</th><th>Description</th><th>Score</th><th>Products</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              ${db.compliance.map(ch => {
                const st = ch.status === 'Compliant' ? 'cc-pp-status-ok' : 'cc-pp-status-prog';
                const scColor = ch.score >= 90 ? '#22c55e' : ch.score >= 75 ? '#ec4899' : '#f59e0b';
                return `
                  <tr>
                    <td style="font-family:monospace;color:#ec4899;font-weight:700">${ch.id}</td>
                    <td style="font-weight:700">${ch.name}</td>
                    <td style="font-size:11px;color:#94a3b8;max-width:340px">${ch.desc}</td>
                    <td><span class="cc-pp-bar-track" style="width:50px"><span class="cc-pp-bar-fill" style="width:${ch.score}%;background:${scColor}"></span></span><strong style="color:${scColor}">${ch.score}</strong></td>
                    <td>${ch.products}/${db.products.length}</td>
                    <td style="font-size:11px;color:#94a3b8">${ch.due}</td>
                    <td><span class="cc-pp-status ${st}">${ch.status}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="cc-pp-section">
        <div class="cc-pp-section-title">📈 Compliance Score Distribution</div>
        <div style="display:flex;align-items:flex-end;gap:14px;height:220px;padding:0 4px">
          ${db.compliance.map(ch => {
            const color = ch.score >= 90 ? '#22c55e' : ch.score >= 75 ? '#ec4899' : '#f59e0b';
            return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
                <div style="font-size:11px;font-weight:800;color:${color}">${ch.score}</div>
                <div style="width:100%;max-width:60px;border-radius:4px 4px 0 0;min-height:4px;background:${color};height:${ch.score}%;cursor:pointer;transition:opacity 0.2s" title="${ch.name}: ${ch.score}"></div>
                <div style="font-size:9px;color:#94a3b8;text-align:center;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ch.id}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 5. QR SCANNER
  // ------------------------------------------------------------------
  function renderQR(c) {
    const db = initDatabase();
    const sel = selectedProductId || db.passports[0].id;
    const passport = db.passports.find(p => p.id === sel);
    c.innerHTML = `
      <div class="cc-pp-header">
        <h2 class="cc-pp-page-title">📷 QR Scanner <span class="cc-pp-page-badge">SIMULATED</span></h2>
        <div class="cc-pp-live-indicator"><div class="cc-pp-live-dot"></div> Scanner ready</div>
      </div>
      <div class="cc-pp-section">
        <div class="cc-pp-section-title">📷 Simulated QR Scan</div>
        <div class="cc-pp-qr-wrap">
          <div class="cc-pp-qr-box">
            ${renderQRSVG(passport.id)}
            ${!qrScanned ? '<div class="cc-pp-qr-scan-line"></div>' : ''}
          </div>
          <div style="flex:1;min-width:240px">
            <div style="font-size:11px;color:#94a3b8;margin-bottom:8px">Selected product:</div>
            <select class="cc-pp-input" onchange="window.__ccPP.onQrSelect(this.value)" style="width:100%;margin-bottom:12px">
              ${db.passports.map(p => `<option value="${p.id}" ${sel===p.id?'selected':''}>${p.id} — ${p.name}</option>`).join('')}
            </select>
            ${qrScanned ? `
              <div class="cc-pp-detail-panel">
                <div style="font-size:11px;color:#22c55e;font-weight:700;margin-bottom:8px">✅ PASSPORT VERIFIED ON BLOCKCHAIN</div>
                <div style="font-size:18px;font-weight:800;color:#fff">${passport.name}</div>
                <div style="font-family:monospace;font-size:11px;color:#ec4899;margin-top:4px">${passport.id}</div>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px;font-size:11px">
                  <div><div style="color:#64748b">Origin</div><div style="font-weight:700">${passport.origin}</div></div>
                  <div><div style="color:#64748b">Category</div><div style="font-weight:700">${passport.category}</div></div>
                  <div><div style="color:#64748b">Mfg Date</div><div style="font-weight:700">${formatDate(passport.mfg).substr(0,10)}</div></div>
                  <div><div style="color:#64748b">Journey Stages</div><div style="font-weight:700">${passport.stages.length}</div></div>
                  <div><div style="color:#64748b">ESG Score</div><div style="font-weight:700;color:#ec4899">${passport.esg}/100</div></div>
                  <div><div style="color:#64748b">Compliance</div><div style="font-weight:700;color:${passport.compliance>=90?'#22c55e':'#f59e0b'}">${passport.compliance}%</div></div>
                  <div><div style="color:#64748b">Blockchain</div><div style="font-weight:700;color:${passport.blockchain?'#22c55e':'#f59e0b'}">${passport.blockchain?'Verified':'Pending'}</div></div>
                  <div><div style="color:#64748b">Total CO2</div><div style="font-weight:700;color:#22c55e">${passport.stages.reduce((s,x)=>s+x.co2,0).toFixed(1)} kg</div></div>
                </div>
                <button class="cc-pp-btn" style="margin-top:14px;width:100%" onclick="window.__ccPP.viewTrace('${passport.id}')">View Full Traceability →</button>
              </div>
            ` : `
              <div style="text-align:center;padding:30px 12px;color:#94a3b8;font-size:13px">
                <div style="font-size:36px;margin-bottom:12px">📷</div>
                <div>Point the scanner at any product QR code, or click "Simulate Scan" to verify a passport.</div>
                <button class="cc-pp-btn" style="margin-top:16px" onclick="window.__ccPP.simulateScan()">▶ Simulate Scan</button>
              </div>
            `}
          </div>
        </div>
      </div>
      <div class="cc-pp-section">
        <div class="cc-pp-section-title">ℹ️ How DPP QR Codes Work</div>
        <div class="cc-pp-grid-2">
          <div class="cc-pp-tile">
            <div class="cc-pp-tile-title">1. Scan the QR code</div>
            <div class="cc-pp-tile-sub">Customer / Inspector</div>
            <div class="cc-pp-tile-desc">Any consumer, customs officer or auditor can scan the QR code printed on the product label using a smartphone camera.</div>
          </div>
          <div class="cc-pp-tile">
            <div class="cc-pp-tile-title">2. Resolve DPP URL</div>
            <div class="cc-pp-tile-sub">Cloud resolver</div>
            <div class="cc-pp-tile-desc">QR code resolves to a GS1 Digital Link URL that fetches the product's passport JSON from the cloud resolver service.</div>
          </div>
          <div class="cc-pp-tile">
            <div class="cc-pp-tile-title">3. Verify on blockchain</div>
            <div class="cc-pp-tile-sub">Polygon PoS</div>
            <div class="cc-pp-tile-desc">Each stage's hash is checked against the on-chain record to ensure the journey hasn't been tampered with.</div>
          </div>
          <div class="cc-pp-tile">
            <div class="cc-pp-tile-title">4. Display passport</div>
            <div class="cc-pp-tile-sub">End-user UI</div>
            <div class="cc-pp-tile-desc">Full product passport is rendered: origin, materials, journey timeline, ESG score, compliance status and end-of-life instructions.</div>
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-pp-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-pp-overlay');
    if (overlay) overlay.remove();
    qrScanned = false;
  }

  function setView(view) {
    currentView = view;
    renderContent();
  }

  function onSearch(q) { productSearch = q; renderRegistry(document.getElementById('cc-pp-content')); }
  function onFilter(f) { productFilter = f; renderRegistry(document.getElementById('cc-pp-content')); }
  function selectProduct(id) { selectedProductId = id; renderTrace(document.getElementById('cc-pp-content')); }
  function viewTrace(id) { selectedProductId = id; qrScanned = false; setView('trace'); }
  function onQrSelect(id) { selectedProductId = id; qrScanned = false; renderQR(document.getElementById('cc-pp-content')); }
  function simulateScan() {
    qrScanned = true;
    renderQR(document.getElementById('cc-pp-content'));
  }

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  function init() {
    injectStyles();
    window.__ccPP = { open, close, setView, onSearch, onFilter, selectProduct, viewTrace, onQrSelect, simulateScan };

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (document.getElementById('cc-pp-overlay')) close();
      }
    });
  }

  init();
})();
