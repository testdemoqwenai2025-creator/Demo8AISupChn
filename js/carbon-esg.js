// ====================================================================
// carbon-esg.js — Carbon Intelligence & ESG Dashboard
// ====================================================================
// Carbon footprint and ESG management module:
//   1. Overview: KPI cards (total CO2, carbon intensity, ESG score, offsets)
//   2. Emissions: Scope 1/2/3 breakdown (bars + donut), per-shipment, per-warehouse
//   3. Suppliers ESG: A-F rated suppliers, scorecards, sustainability metrics
//   4. Carbon Offsets: purchased offsets, verified projects, retirement certificates
//   5. Net-Zero Planner: target year slider, reduction trajectory, gap analysis
//   6. Compliance: CSRD, SBTi, TCFD, CDP status per regulation
//
// Architecture: IIFE + modal + sidebar pattern. No floating button.
// CSS prefix: cc-ce-  ·  Global API: window.__ccCE.open()
// ====================================================================
(function() {
  'use strict';

  if (window.__carbonEsgLoaded) return;
  window.__carbonEsgLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_carbon_esg_db_v1';

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
  const SCOPE_DATA = [
    { scope: 'Scope 1', label: 'Direct emissions', co2: 18420, color: '#ef4444', desc: 'Company-owned vehicles, on-site fuel combustion, refrigerant leaks' },
    { scope: 'Scope 2', label: 'Purchased energy', co2: 24680, color: '#f59e0b', desc: 'Electricity for warehouses, offices and DC facilities' },
    { scope: 'Scope 3', label: 'Value chain', co2: 142500, color: '#10b981', desc: 'Supplier manufacturing, upstream transport, end-of-life disposal' }
  ];

  const EMISSIONS_BY_MONTH = [
    { m: 'Jan', scope1: 1620, scope2: 2180, scope3: 12200 },
    { m: 'Feb', scope1: 1540, scope2: 2050, scope3: 11800 },
    { m: 'Mar', scope1: 1710, scope2: 2240, scope3: 13100 },
    { m: 'Apr', scope1: 1580, scope2: 2090, scope3: 12500 },
    { m: 'May', scope1: 1490, scope2: 1980, scope3: 11900 },
    { m: 'Jun', scope1: 1380, scope2: 1880, scope3: 11200 },
    { m: 'Jul', scope1: 1320, scope2: 1820, scope3: 10800 },
    { m: 'Aug', scope1: 1410, scope2: 1920, scope3: 11400 },
    { m: 'Sep', scope1: 1520, scope2: 2010, scope3: 12100 },
    { m: 'Oct', scope1: 1640, scope2: 2140, scope3: 12900 },
    { m: 'Nov', scope1: 1720, scope2: 2230, scope3: 13300 },
    { m: 'Dec', scope1: 1490, scope2: 2140, scope3: 14300 }
  ];

  const PER_SHIPMENT = [
    { mode: 'Air Freight', co2: 850, shipments: 1840, color: '#ef4444' },
    { mode: 'Road LTL', co2: 92, shipments: 18420, color: '#f59e0b' },
    { mode: 'Road FTL', co2: 68, shipments: 9210, color: '#f97316' },
    { mode: 'Rail', co2: 22, shipments: 4180, color: '#10b981' },
    { mode: 'Ocean FCL', co2: 12, shipments: 6240, color: '#06b6d4' },
    { mode: 'Ocean LCL', co2: 18, shipments: 3120, color: '#0ea5e9' },
    { mode: 'Last-mile EV', co2: 4, shipments: 24800, color: '#22c55e' }
  ];

  const PER_WAREHOUSE = [
    { wh: 'Rotterdam DC-1', country: 'NL', co2: 3240, intensity: 18.2, area: 42000 },
    { wh: 'Shanghai Hub', country: 'CN', co2: 6120, intensity: 32.4, area: 78000 },
    { wh: 'Memphis Mega-DC', country: 'US', co2: 4820, intensity: 24.6, area: 95000 },
    { wh: 'São Paulo South', country: 'BR', co2: 2480, intensity: 21.8, area: 38000 },
    { wh: 'Dubai Free Zone', country: 'AE', co2: 3920, intensity: 28.1, area: 52000 },
    { wh: 'Singapore Pasir Panjang', country: 'SG', co2: 4180, intensity: 22.0, area: 61000 },
    { wh: 'Hamburg Cold Storage', country: 'DE', co2: 5120, intensity: 38.4, area: 28000 },
    { wh: 'Mumbai Bhiwandi', country: 'IN', co2: 2940, intensity: 26.5, area: 44000 }
  ];

  const SUPPLIERS_ESG = [
    { id: 'SUP-001', name: 'Nordic Pulp & Paper AB', country: 'Sweden', rating: 'A', esg: 92, env: 94, soc: 88, gov: 94, scope3: 4200, renewable: 100, water: 78 },
    { id: 'SUP-002', name: 'Bayou Chemical Co', country: 'USA', rating: 'D', esg: 48, env: 32, soc: 56, gov: 55, scope3: 18400, renewable: 18, water: 42 },
    { id: 'SUP-003', name: 'Osaka Precision Manufacturing', country: 'Japan', rating: 'A', esg: 89, env: 90, soc: 86, gov: 92, scope3: 6800, renewable: 64, water: 88 },
    { id: 'SUP-004', name: 'Lagos Textile Mills', country: 'Nigeria', rating: 'E', esg: 38, env: 28, soc: 46, gov: 40, scope3: 12200, renewable: 8, water: 24 },
    { id: 'SUP-005', name: 'Patagonia Steel Works', country: 'Chile', rating: 'B', esg: 78, env: 80, soc: 76, gov: 78, scope3: 9400, renewable: 72, water: 64 },
    { id: 'SUP-006', name: 'Berlin GreenPack GmbH', country: 'Germany', rating: 'A', esg: 95, env: 96, soc: 92, gov: 98, scope3: 2400, renewable: 100, water: 92 },
    { id: 'SUP-007', name: 'Vietnam Electronics Co', country: 'Vietnam', rating: 'C', esg: 62, env: 54, soc: 68, gov: 64, scope3: 10800, renewable: 32, water: 58 },
    { id: 'SUP-008', name: 'Mumbai Steel Forgings', country: 'India', rating: 'C', esg: 58, env: 48, soc: 64, gov: 62, scope3: 14200, renewable: 22, water: 38 },
    { id: 'SUP-009', name: 'Tromsø Seafood AS', country: 'Norway', rating: 'A', esg: 91, env: 93, soc: 89, gov: 90, scope3: 3800, renewable: 88, water: 95 },
    { id: 'SUP-010', name: 'Houston Plastics Inc', country: 'USA', rating: 'D', esg: 44, env: 30, soc: 52, gov: 50, scope3: 16400, renewable: 14, water: 30 },
    { id: 'SUP-011', name: 'Queensland Mining Co', country: 'Australia', rating: 'F', esg: 31, env: 22, soc: 38, gov: 32, scope3: 24800, renewable: 6, water: 18 },
    { id: 'SUP-012', name: 'Copenhagen Logistics', country: 'Denmark', rating: 'B', esg: 82, env: 84, soc: 80, gov: 82, scope3: 5200, renewable: 78, water: 70 }
  ];

  const OFFSETS = [
    { id: 'OFF-2025-001', project: 'Kasigau Wildlife Corridor REDD+', country: 'Kenya', type: 'Avoided Deforestation', vintage: 2024, credits: 48000, price: 14.20, status: 'Retired', verifier: 'VCS', cert: 'VCU-4820-2024' },
    { id: 'OFF-2025-002', project: 'Sichuan Household Biogas', country: 'China', type: 'Methane Capture', vintage: 2024, credits: 28000, price: 11.80, status: 'Retired', verifier: 'Gold Standard', cert: 'GS-11824-2024' },
    { id: 'OFF-2025-003', project: 'Andean Hydroelectric Portfolio', country: 'Peru', type: 'Renewable Energy', vintage: 2023, credits: 62000, price: 8.40, status: 'Retired', verifier: 'VCS', cert: 'VCU-3011-2023' },
    { id: 'OFF-2025-004', project: 'Ganges Afforestation Program', country: 'India', type: 'Afforestation', vintage: 2024, credits: 38000, price: 13.10, status: 'Active', verifier: 'Gold Standard', cert: 'GS-13920-2024' },
    { id: 'OFF-2025-005', project: 'Borneo Peatland Restoration', country: 'Indonesia', type: 'Wetland Restoration', vintage: 2024, credits: 51000, price: 16.80, status: 'Active', verifier: 'VCS', cert: 'VCU-5502-2024' },
    { id: 'OFF-2025-006', project: 'Patagonia Wind Farm Cluster', country: 'Chile', type: 'Renewable Energy', vintage: 2024, credits: 74000, price: 7.20, status: 'Active', verifier: 'VCS', cert: 'VCU-6120-2024' }
  ];

  const TRAJECTORY = [
    { year: 2024, baseline: 185500, projected: 185500, target: 185500 },
    { year: 2025, baseline: 185500, projected: 168000, target: 167000 },
    { year: 2026, baseline: 185500, projected: 152000, target: 148400 },
    { year: 2027, baseline: 185500, projected: 138000, target: 130000 },
    { year: 2028, baseline: 185500, projected: 121000, target: 111300 },
    { year: 2029, baseline: 185500, projected: 102000, target: 92800 },
    { year: 2030, baseline: 185500, projected: 82000, target: 74200 },
    { year: 2031, baseline: 185500, projected: 58000, target: 55700 },
    { year: 2032, baseline: 185500, projected: 32000, target: 37100 },
    { year: 2033, baseline: 185500, projected: 8000, target: 18600 },
    { year: 2034, baseline: 185500, projected: 0, target: 0 }
  ];

  const COMPLIANCE = [
    { reg: 'CSRD', full: 'Corporate Sustainability Reporting Directive', region: 'EU', status: 'Compliant', score: 94, due: '2026-06-30', notes: 'Double materiality assessment complete; assurance obtained' },
    { reg: 'SBTi', full: 'Science Based Targets initiative', region: 'Global', status: 'Compliant', score: 88, due: '2025-12-31', notes: '1.5°C aligned targets approved; annual progress reported' },
    { reg: 'TCFD', full: 'Task Force on Climate-related Financial Disclosures', region: 'Global', status: 'Compliant', score: 91, due: '2026-03-31', notes: 'Governance, strategy, risk management & metrics disclosed' },
    { reg: 'CDP', full: 'Carbon Disclosure Project', region: 'Global', status: 'Compliant', score: 'A-', due: '2025-09-29', notes: 'Climate Change A- rating; supply chain engagement program' },
    { reg: 'ESPR', full: 'Eco-design for Sustainable Products Regulation', region: 'EU', status: 'In Progress', score: 62, due: '2027-07-01', notes: 'Digital Product Passport pilot live; full rollout by 2027' },
    { reg: 'CBAM', full: 'Carbon Border Adjustment Mechanism', region: 'EU', status: 'In Progress', score: 71, due: '2026-01-31', notes: 'Transitional reporting active; embedded emissions tracked' },
    { reg: 'SEC Climate Rule', full: 'SEC Climate Disclosure Rule', region: 'USA', status: 'At Risk', score: 48, due: '2026-05-31', notes: 'Rule vacated 2024; voluntary reporting continues' },
    { reg: 'ISSB IFRS S2', full: 'IFRS Sustainability Disclosure S2', region: 'Global', status: 'In Progress', score: 76, due: '2026-12-31', notes: 'Scope 1-3 mapping complete; gap analysis underway' }
  ];

  // ------------------------------------------------------------------
  // DATABASE INIT
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.generated) return db;
    db = {
      scopes: SCOPE_DATA,
      monthly: EMISSIONS_BY_MONTH,
      perShipment: PER_SHIPMENT,
      perWarehouse: PER_WAREHOUSE,
      suppliers: SUPPLIERS_ESG,
      offsets: OFFSETS,
      trajectory: TRAJECTORY,
      compliance: COMPLIANCE,
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
  let netZeroYear = 2034;
  let supplierSearch = '';
  let supplierFilter = 'all';

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-ce-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-ce-styles';
    style.textContent = `
      .cc-ce-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10012; background: rgba(6,16,12,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-ce-sidebar { width: 220px; flex-shrink: 0; background: rgba(8,28,20,0.6); border-right: 1px solid rgba(16,185,129,0.12); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-ce-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(16,185,129,0.12); margin-bottom: 12px; }
      .cc-ce-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; background: linear-gradient(135deg, #059669, #10b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .cc-ce-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-ce-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; text-decoration: none; font-family: inherit; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; }
      .cc-ce-nav-item:hover { background: rgba(16,185,129,0.05); color: #e2e8f0; }
      .cc-ce-nav-item.active { background: rgba(16,185,129,0.08); color: #10b8a6; border-left-color: #10b8a6; }
      .cc-ce-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-ce-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-ce-close { position: fixed; top: 16px; right: 20px; z-index: 10013; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-ce-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-ce-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(16,185,129,0.12); flex-wrap: wrap; gap: 12px; }
      .cc-ce-page-title { font-size: 22px; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #059669, #10b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .cc-ce-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #059669, #10b8a6); color: #fff; font-weight: 600; letter-spacing: 0.03em; -webkit-text-fill-color: #fff; }
      .cc-ce-live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #10b8a6; font-weight: 600; }
      .cc-ce-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b8a6; animation: cc-ce-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-ce-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .cc-ce-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-ce-card { background: linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.06)); border: 1px solid rgba(16,185,129,0.22); border-radius: 12px; padding: 16px; }
      .cc-ce-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 6px; }
      .cc-ce-card-value { font-size: 26px; font-weight: 800; color: #fff; }
      .cc-ce-card-delta { font-size: 11px; margin-top: 4px; color: #94a3b8; }
      .cc-ce-card-delta.up { color: #22c55e; }
      .cc-ce-card-delta.down { color: #ef4444; }
      .cc-ce-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(16,185,129,0.15); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
      .cc-ce-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
      .cc-ce-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-ce-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(16,185,129,0.18); }
      .cc-ce-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; vertical-align: middle; }
      .cc-ce-table tr:hover td { background: rgba(16,185,129,0.04); }
      .cc-ce-scroll { max-height: 520px; overflow-y: auto; border: 1px solid rgba(16,185,129,0.15); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(16,185,129,0.4) transparent; }
      .cc-ce-scroll::-webkit-scrollbar { width: 8px; }
      .cc-ce-scroll::-webkit-scrollbar-track { background: transparent; }
      .cc-ce-scroll::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.3); border-radius: 4px; }
      .cc-ce-bar-track { display: inline-block; width: 100px; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; vertical-align: middle; margin-right: 6px; }
      .cc-ce-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #059669, #10b8a6); }
      .cc-ce-bars { display: flex; align-items: flex-end; gap: 8px; height: 220px; padding: 0 4px; }
      .cc-ce-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
      .cc-ce-bar { width: 100%; max-width: 50px; border-radius: 4px 4px 0 0; min-height: 4px; position: relative; cursor: pointer; transition: opacity 0.2s; background: linear-gradient(180deg, #10b8a6, #059669); }
      .cc-ce-bar:hover { opacity: 0.85; }
      .cc-ce-bar-label { font-size: 9px; color: #94a3b8; text-align: center; }
      .cc-ce-bar-value { font-size: 10px; font-weight: 700; color: #e2e8f0; }
      .cc-ce-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
      .cc-ce-status-ok { background: rgba(16,185,129,0.15); color: #10b8a6; border: 1px solid rgba(16,185,129,0.3); }
      .cc-ce-status-warn { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-ce-status-risk { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .cc-ce-status-prog { background: rgba(6,182,212,0.15); color: #06b6d4; border: 1px solid rgba(6,182,212,0.3); }
      .cc-ce-rating { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; font-weight: 800; font-size: 13px; }
      .cc-ce-rating-A { background: rgba(16,185,129,0.2); color: #10b8a6; border: 1px solid rgba(16,185,129,0.4); }
      .cc-ce-rating-B { background: rgba(34,197,94,0.2); color: #22c55e; border: 1px solid rgba(34,197,94,0.4); }
      .cc-ce-rating-C { background: rgba(245,158,11,0.2); color: #f59e0b; border: 1px solid rgba(245,158,11,0.4); }
      .cc-ce-rating-D { background: rgba(249,115,22,0.2); color: #f97316; border: 1px solid rgba(249,115,22,0.4); }
      .cc-ce-rating-E { background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.4); }
      .cc-ce-rating-F { background: rgba(220,38,38,0.25); color: #fca5a5; border: 1px solid rgba(239,68,68,0.5); }
      .cc-ce-donut-wrap { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
      .cc-ce-donut { width: 220px; height: 220px; flex-shrink: 0; }
      .cc-ce-donut-legend { flex: 1; min-width: 220px; }
      .cc-ce-legend-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 12px; }
      .cc-ce-legend-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
      .cc-ce-input { background: rgba(15,28,22,0.7); border: 1px solid rgba(16,185,129,0.25); color: #e2e8f0; border-radius: 8px; padding: 9px 12px; font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.2s; }
      .cc-ce-input:focus { border-color: #10b8a6; box-shadow: 0 0 0 3px rgba(16,185,129,0.18); }
      .cc-ce-btn { background: linear-gradient(135deg, #059669, #10b8a6); color: #fff; border: none; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: transform 0.15s, box-shadow 0.15s; }
      .cc-ce-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16,185,129,0.35); }
      .cc-ce-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 3px; background: linear-gradient(90deg, rgba(16,185,129,0.2), rgba(239,68,68,0.2)); outline: none; }
      .cc-ce-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #10b8a6; cursor: pointer; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.4); }
      .cc-ce-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #10b8a6; cursor: pointer; border: 2px solid #fff; }
      .cc-ce-timeline { position: relative; padding-left: 32px; }
      .cc-ce-timeline::before { content: ''; position: absolute; left: 14px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, #059669, #10b8a6); }
      .cc-ce-timeline-item { position: relative; padding: 12px 0 12px 24px; }
      .cc-ce-timeline-item::before { content: ''; position: absolute; left: -22px; top: 18px; width: 14px; height: 14px; border-radius: 50%; background: linear-gradient(135deg, #059669, #10b8a6); box-shadow: 0 0 0 4px rgba(16,185,129,0.2); }
      .cc-ce-timeline-year { font-size: 14px; font-weight: 800; color: #10b8a6; }
      .cc-ce-timeline-title { font-size: 13px; font-weight: 700; color: #fff; margin-top: 2px; }
      .cc-ce-timeline-desc { font-size: 11px; color: #94a3b8; margin-top: 4px; line-height: 1.5; }
      .cc-ce-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
      .cc-ce-tile { background: linear-gradient(135deg, rgba(16,185,129,0.04), rgba(5,150,105,0.04)); border: 1px solid rgba(16,185,129,0.18); border-radius: 12px; padding: 16px; transition: border-color 0.2s, transform 0.2s; }
      .cc-ce-tile:hover { border-color: rgba(16,185,129,0.45); transform: translateY(-2px); }
      .cc-ce-tile-title { font-size: 14px; font-weight: 700; color: #fff; }
      .cc-ce-tile-sub { font-size: 11px; color: #10b8a6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
      .cc-ce-tile-desc { font-size: 12px; color: #94a3b8; margin-top: 8px; line-height: 1.5; }
      .cc-ce-progress { width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; margin-top: 8px; }
      .cc-ce-progress-fill { height: 100%; background: linear-gradient(90deg, #059669, #10b8a6); border-radius: 3px; transition: width 0.4s; }
      .cc-ce-row { display: flex; gap: 16px; flex-wrap: wrap; }
      .cc-ce-row > * { flex: 1; min-width: 200px; }
      @media (max-width: 767px) {
        .cc-ce-modal { flex-direction: column; }
        .cc-ce-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-ce-sidebar-brand { display: none; }
        .cc-ce-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-ce-nav-item.active { border-bottom-color: #10b8a6; border-left-color: transparent; }
        .cc-ce-main { padding: 12px 12px 20px; }
        .cc-ce-cards { grid-template-columns: repeat(2, 1fr); }
        .cc-ce-donut { width: 180px; height: 180px; }
      }
      /* Light mode overrides */
      html:not(.dark) .cc-ce-modal { background: rgba(245,250,247,0.99); color: #1e293b; }
      html:not(.dark) .cc-ce-sidebar { background: rgba(232,250,242,0.8); border-right-color: rgba(5,150,105,0.12); }
      html:not(.dark) .cc-ce-sidebar-title { background: linear-gradient(135deg, #047857, #0d9488); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      html:not(.dark) .cc-ce-nav-item { color: #64748b; }
      html:not(.dark) .cc-ce-nav-item:hover { background: rgba(16,185,129,0.06); color: #1e293b; }
      html:not(.dark) .cc-ce-nav-item.active { background: rgba(16,185,129,0.1); color: #047857; }
      html:not(.dark) .cc-ce-page-title { background: linear-gradient(135deg, #047857, #0d9488); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      html:not(.dark) .cc-ce-header { border-bottom-color: rgba(5,150,105,0.1); }
      html:not(.dark) .cc-ce-card { background: rgba(16,185,129,0.05); border-color: rgba(16,185,129,0.2); }
      html:not(.dark) .cc-ce-card-label { color: #64748b; }
      html:not(.dark) .cc-ce-card-value { color: #0f172a; }
      html:not(.dark) .cc-ce-card-delta { color: #64748b; }
      html:not(.dark) .cc-ce-section { background: rgba(0,0,0,0.02); border-color: rgba(16,185,129,0.15); }
      html:not(.dark) .cc-ce-section-title { color: #1e293b; }
      html:not(.dark) .cc-ce-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-ce-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-ce-table tr:hover td { background: rgba(16,185,129,0.04); }
      html:not(.dark) .cc-ce-bar-label { color: #64748b; }
      html:not(.dark) .cc-ce-bar-value { color: #1e293b; }
      html:not(.dark) .cc-ce-input { background: #fff; border-color: rgba(5,150,105,0.2); color: #1e293b; }
      html:not(.dark) .cc-ce-tile { background: rgba(16,185,129,0.04); border-color: rgba(16,185,129,0.18); }
      html:not(.dark) .cc-ce-tile-title { color: #0f172a; }
      html:not(.dark) .cc-ce-tile-desc { color: #64748b; }
      html:not(.dark) .cc-ce-timeline-title { color: #0f172a; }
      html:not(.dark) .cc-ce-timeline-desc { color: #64748b; }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // DONUT CHART (SVG)
  // ------------------------------------------------------------------
  function renderDonut(data) {
    const total = data.reduce((s, d) => s + d.co2, 0);
    const cx = 110, cy = 110, r = 80, sw = 28;
    let angle = -Math.PI / 2;
    const segs = data.map(d => {
      const pct = d.co2 / total;
      const a2 = angle + pct * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(a2);
      const y2 = cy + r * Math.sin(a2);
      const large = pct > 0.5 ? 1 : 0;
      const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
      angle = a2;
      return { path, color: d.color, label: d.scope, value: d.co2, pct: (pct * 100).toFixed(1) };
    });
    return `
      <svg class="cc-ce-donut" viewBox="0 0 220 220">
        ${segs.map(s => `<path d="${s.path}" fill="none" stroke="${s.color}" stroke-width="${sw}" stroke-linecap="butt"><title>${s.label}: ${s.value.toLocaleString()} tCO2e (${s.pct}%)</title></path>`).join('')}
        <circle cx="${cx}" cy="${cy}" r="${r - sw/2 - 4}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
        <text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="#fff" font-size="11" font-weight="600" opacity="0.7">TOTAL</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="#10b8a6" font-size="22" font-weight="800">${(total/1000).toFixed(1)}k</text>
        <text x="${cx}" y="${cy + 32}" text-anchor="middle" fill="#94a3b8" font-size="10">tCO2e / yr</text>
      </svg>
      <div class="cc-ce-donut-legend">
        ${segs.map(s => `
          <div class="cc-ce-legend-item">
            <span class="cc-ce-legend-dot" style="background:${s.color}"></span>
            <span style="font-weight:700">${s.label}</span>
            <span style="margin-left:auto;color:#94a3b8">${s.value.toLocaleString()} tCO2e · ${s.pct}%</span>
          </div>
          <div style="font-size:11px;color:#94a3b8;padding-left:20px;padding-bottom:6px">${data.find(x=>x.scope===s.label).desc}</div>
        `).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    initDatabase();
    const overlay = document.createElement('div');
    overlay.id = 'cc-ce-overlay';
    overlay.className = 'cc-ce-modal';
    overlay.innerHTML = `
      <button class="cc-ce-close" onclick="window.__ccCE.close()" aria-label="Close">×</button>
      <div class="cc-ce-sidebar">
        <div class="cc-ce-sidebar-brand">
          <div class="cc-ce-sidebar-title">🌍 Carbon & ESG</div>
          <div class="cc-ce-sidebar-sub">Carbon Intelligence Dashboard</div>
        </div>
        <button class="cc-ce-nav-item ${currentView==='overview'?'active':''}" onclick="window.__ccCE.setView('overview')"><span class="cc-ce-nav-icon">📊</span> Overview</button>
        <button class="cc-ce-nav-item ${currentView==='emissions'?'active':''}" onclick="window.__ccCE.setView('emissions')"><span class="cc-ce-nav-icon">🏭</span> Emissions</button>
        <button class="cc-ce-nav-item ${currentView==='suppliers'?'active':''}" onclick="window.__ccCE.setView('suppliers')"><span class="cc-ce-nav-icon">🌱</span> Suppliers ESG</button>
        <button class="cc-ce-nav-item ${currentView==='offsets'?'active':''}" onclick="window.__ccCE.setView('offsets')"><span class="cc-ce-nav-icon">♻️</span> Carbon Offsets</button>
        <button class="cc-ce-nav-item ${currentView==='netzero'?'active':''}" onclick="window.__ccCE.setView('netzero')"><span class="cc-ce-nav-icon">🎯</span> Net-Zero Planner</button>
        <button class="cc-ce-nav-item ${currentView==='compliance'?'active':''}" onclick="window.__ccCE.setView('compliance')"><span class="cc-ce-nav-icon">📋</span> Compliance</button>
      </div>
      <div class="cc-ce-main" id="cc-ce-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const container = document.getElementById('cc-ce-content');
    if (!container) return;
    if (currentView === 'overview') renderOverview(container);
    else if (currentView === 'emissions') renderEmissions(container);
    else if (currentView === 'suppliers') renderSuppliers(container);
    else if (currentView === 'offsets') renderOffsets(container);
    else if (currentView === 'netzero') renderNetZero(container);
    else if (currentView === 'compliance') renderCompliance(container);
    document.querySelectorAll('.cc-ce-nav-item').forEach(item => {
      const oc = item.getAttribute('onclick') || '';
      item.classList.toggle('active', oc.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // 1. OVERVIEW
  // ------------------------------------------------------------------
  function renderOverview(c) {
    const db = initDatabase();
    const totalCO2 = db.scopes.reduce((s, x) => s + x.co2, 0);
    const offsetCredits = db.offsets.reduce((s, o) => s + o.credits, 0);
    const offsetCoverage = ((offsetCredits / totalCO2) * 100).toFixed(1);
    const avgEsg = (db.suppliers.reduce((s, x) => s + x.esg, 0) / db.suppliers.length).toFixed(0);
    const compliant = db.compliance.filter(x => x.status === 'Compliant').length;
    c.innerHTML = `
      <div class="cc-ce-header">
        <h2 class="cc-ce-page-title">🌍 Carbon Intelligence Overview <span class="cc-ce-page-badge">ESG 2025</span></h2>
        <div class="cc-ce-live-indicator"><div class="cc-ce-live-dot"></div> Live ESG telemetry</div>
      </div>
      <div class="cc-ce-cards">
        <div class="cc-ce-card"><div class="cc-ce-card-label">Total CO2 (annual)</div><div class="cc-ce-card-value">${(totalCO2/1000).toFixed(1)}k t</div><div class="cc-ce-card-delta down">↓ 12.4% vs 2023 baseline</div></div>
        <div class="cc-ce-card"><div class="cc-ce-card-label">Carbon Intensity</div><div class="cc-ce-card-value" style="color:#10b8a6">24.6 g/t·km</div><div class="cc-ce-card-delta down">↓ 18% YoY</div></div>
        <div class="cc-ce-card"><div class="cc-ce-card-label">Avg ESG Score</div><div class="cc-ce-card-value" style="color:#10b8a6">${avgEsg}/100</div><div class="cc-ce-card-delta up">↑ 4 points vs last year</div></div>
        <div class="cc-ce-card"><div class="cc-ce-card-label">Offset Coverage</div><div class="cc-ce-card-value" style="color:#10b8a6">${offsetCoverage}%</div><div class="cc-ce-card-delta">${offsetCredits.toLocaleString()} credits retired</div></div>
      </div>
      <div class="cc-ce-row">
        <div class="cc-ce-section">
          <div class="cc-ce-section-title">🏭 Emissions by Scope</div>
          <div class="cc-ce-donut-wrap">${renderDonut(db.scopes)}</div>
        </div>
        <div class="cc-ce-section">
          <div class="cc-ce-section-title">📅 Monthly Emissions Trend</div>
          <div class="cc-ce-bars">
            ${db.monthly.map(m => {
              const total = m.scope1 + m.scope2 + m.scope3;
              const pct = (total / 28000) * 100;
              return `
                <div class="cc-ce-bar-wrap">
                  <div class="cc-ce-bar-value">${(total/1000).toFixed(1)}k</div>
                  <div class="cc-ce-bar" style="height:${pct}%" title="${m.m}: ${total.toLocaleString()} tCO2e">
                    <div style="position:absolute;bottom:0;left:0;right:0;height:${(m.scope3/total)*100}%;background:#10b981;border-radius:4px 4px 0 0"></div>
                    <div style="position:absolute;bottom:${(m.scope3/total)*100}%;left:0;right:0;height:${(m.scope2/total)*100}%;background:#f59e0b"></div>
                    <div style="position:absolute;bottom:${((m.scope2+m.scope3)/total)*100}%;left:0;right:0;height:${(m.scope1/total)*100}%;background:#ef4444;border-radius:4px 4px 0 0"></div>
                  </div>
                  <div class="cc-ce-bar-label">${m.m}</div>
                </div>
              `;
            }).join('')}
          </div>
          <div style="margin-top:12px;display:flex;gap:16px;font-size:11px;color:#94a3b8;flex-wrap:wrap">
            <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:#ef4444;border-radius:2px"></span> Scope 1</span>
            <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:#f59e0b;border-radius:2px"></span> Scope 2</span>
            <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:#10b981;border-radius:2px"></span> Scope 3</span>
          </div>
        </div>
      </div>
      <div class="cc-ce-section">
        <div class="cc-ce-section-title">🏆 ESG Highlights</div>
        <div class="cc-ce-grid-2">
          <div class="cc-ce-tile">
            <div class="cc-ce-tile-title">${compliant}/${db.compliance.length} Regulations Compliant</div>
            <div class="cc-ce-tile-sub">Regulatory Status</div>
            <div class="cc-ce-tile-desc">CSRD, SBTi, TCFD and CDP all reporting compliant. ESPR and CBAM in progress.</div>
            <div class="cc-ce-progress"><div class="cc-ce-progress-fill" style="width:${(compliant/db.compliance.length)*100}%"></div></div>
          </div>
          <div class="cc-ce-tile">
            <div class="cc-ce-tile-title">${db.suppliers.filter(s=>s.rating==='A').length} A-rated suppliers</div>
            <div class="cc-ce-tile-sub">Supplier ESG</div>
            <div class="cc-ce-tile-desc">Top-tier suppliers include Berlin GreenPack, Nordic Pulp, Tromsø Seafood and Osaka Precision.</div>
            <div class="cc-ce-progress"><div class="cc-ce-progress-fill" style="width:${(db.suppliers.filter(s=>s.rating==='A').length/db.suppliers.length)*100}%"></div></div>
          </div>
          <div class="cc-ce-tile">
            <div class="cc-ce-tile-title">Net-Zero target: 2034</div>
            <div class="cc-ce-tile-sub">Trajectory</div>
            <div class="cc-ce-tile-desc">On track to net-zero by 2034, ahead of SBTi 2050 baseline. Year-on-year reduction of 12.4%.</div>
            <div class="cc-ce-progress"><div class="cc-ce-progress-fill" style="width:34%"></div></div>
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 2. EMISSIONS
  // ------------------------------------------------------------------
  function renderEmissions(c) {
    const db = initDatabase();
    const maxShip = Math.max(...db.perShipment.map(x => x.co2));
    const maxWh = Math.max(...db.perWarehouse.map(x => x.co2));
    c.innerHTML = `
      <div class="cc-ce-header">
        <h2 class="cc-ce-page-title">🏭 Emissions Breakdown <span class="cc-ce-page-badge">SCOPE 1-2-3</span></h2>
      </div>
      <div class="cc-ce-section">
        <div class="cc-ce-section-title">🥧 Scope 1 / 2 / 3 Distribution</div>
        <div class="cc-ce-donut-wrap">${renderDonut(db.scopes)}</div>
      </div>
      <div class="cc-ce-section">
        <div class="cc-ce-section-title">📦 Per-Shipment Carbon by Mode</div>
        <div class="cc-ce-scroll">
          <table class="cc-ce-table">
            <thead><tr><th>Mode</th><th>Shipments</th><th>kg CO2 / shipment</th><th>Intensity bar</th><th>Relative</th></tr></thead>
            <tbody>
              ${db.perShipment.map(s => `
                <tr>
                  <td style="font-weight:700;color:${s.color}">${s.mode}</td>
                  <td>${s.shipments.toLocaleString()}</td>
                  <td style="font-weight:700">${s.co2} kg</td>
                  <td><span class="cc-ce-bar-track"><span class="cc-ce-bar-fill" style="width:${(s.co2/maxShip)*100}%;background:${s.color}"></span></span></td>
                  <td>${(s.co2 / maxShip * 100).toFixed(0)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="cc-ce-section">
        <div class="cc-ce-section-title">🏬 Per-Warehouse Carbon Footprint</div>
        <div class="cc-ce-bars">
          ${db.perWarehouse.map(w => {
            const pct = (w.co2 / maxWh) * 100;
            return `
              <div class="cc-ce-bar-wrap">
                <div class="cc-ce-bar-value">${w.co2.toLocaleString()}</div>
                <div class="cc-ce-bar" style="height:${pct}%" title="${w.wh}: ${w.co2} tCO2e · ${w.intensity} kg/m²">
                  <div style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-size:9px;color:#94a3b8">${w.country}</div>
                </div>
                <div class="cc-ce-bar-label" style="max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${w.wh.split(' ')[0]}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="cc-ce-scroll" style="margin-top:16px">
          <table class="cc-ce-table">
            <thead><tr><th>Warehouse</th><th>Country</th><th>CO2 (t/yr)</th><th>Intensity (kg/m²)</th><th>Area (m²)</th><th>Efficiency</th></tr></thead>
            <tbody>
              ${db.perWarehouse.map(w => {
                const eff = w.intensity < 25 ? 'cc-ce-status-ok' : w.intensity < 32 ? 'cc-ce-status-warn' : 'cc-ce-status-risk';
                return `
                  <tr>
                    <td style="font-weight:700;color:#10b8a6">${w.wh}</td>
                    <td>${w.country}</td>
                    <td style="font-weight:600">${w.co2.toLocaleString()}</td>
                    <td>${w.intensity}</td>
                    <td>${w.area.toLocaleString()}</td>
                    <td><span class="cc-ce-status ${eff}">${w.intensity < 25 ? 'Efficient' : w.intensity < 32 ? 'Average' : 'High'}</span></td>
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
  // 3. SUPPLIERS ESG
  // ------------------------------------------------------------------
  function renderSuppliers(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-ce-header">
        <h2 class="cc-ce-page-title">🌱 Suppliers ESG Scorecards <span class="cc-ce-page-badge">${db.suppliers.length} SUPPLIERS</span></h2>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <input class="cc-ce-input" placeholder="Search suppliers by name or country..." style="flex:1;min-width:240px" value="${supplierSearch}" oninput="window.__ccCE.onSearch(this.value)"/>
        <select class="cc-ce-input" onchange="window.__ccCE.onFilter(this.value)">
          <option value="all" ${supplierFilter==='all'?'selected':''}>All ratings</option>
          <option value="A" ${supplierFilter==='A'?'selected':''}>A only</option>
          <option value="B" ${supplierFilter==='B'?'selected':''}>B and above</option>
          <option value="C" ${supplierFilter==='C'?'selected':''}>C and above</option>
          <option value="D" ${supplierFilter==='D'?'selected':''}>D and below</option>
        </select>
      </div>
      <div id="cc-ce-supplier-list"></div>
    `;
    renderSupplierList();
  }

  function renderSupplierList() {
    const db = initDatabase();
    const el = document.getElementById('cc-ce-supplier-list');
    if (!el) return;
    const rank = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6 };
    let list = db.suppliers.filter(s => {
      if (supplierFilter === 'all') return true;
      if (supplierFilter === 'D') return rank[s.rating] >= 4;
      return rank[s.rating] <= rank[supplierFilter];
    });
    if (supplierSearch) {
      const q = supplierSearch.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().indexOf(q) !== -1 || s.country.toLowerCase().indexOf(q) !== -1);
    }
    if (list.length === 0) {
      el.innerHTML = '<div class="cc-ce-section">No suppliers match the current filter.</div>';
      return;
    }
    el.innerHTML = `
      <div class="cc-ce-scroll" style="margin-bottom:20px">
        <table class="cc-ce-table">
          <thead><tr><th>Rating</th><th>Supplier</th><th>Country</th><th>ESG</th><th>Env</th><th>Soc</th><th>Gov</th><th>Scope 3 (t)</th><th>Renewable %</th><th>Water recycle %</th></tr></thead>
          <tbody>
            ${list.map(s => `
              <tr>
                <td><span class="cc-ce-rating cc-ce-rating-${s.rating}">${s.rating}</span></td>
                <td style="font-weight:700;color:#10b8a6">${s.name}</td>
                <td>${s.country}</td>
                <td style="font-weight:700">${s.esg}</td>
                <td>${s.env}</td>
                <td>${s.soc}</td>
                <td>${s.gov}</td>
                <td>${s.scope3.toLocaleString()}</td>
                <td><span class="cc-ce-bar-track" style="width:60px"><span class="cc-ce-bar-fill" style="width:${s.renewable}%"></span></span>${s.renewable}%</td>
                <td>${s.water}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="cc-ce-grid-2">
        ${list.slice(0, 6).map(s => `
          <div class="cc-ce-tile">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div>
                <div class="cc-ce-tile-title">${s.name}</div>
                <div class="cc-ce-tile-sub">${s.country} · ${s.id}</div>
              </div>
              <span class="cc-ce-rating cc-ce-rating-${s.rating}" style="width:36px;height:36px;font-size:18px">${s.rating}</span>
            </div>
            <div style="margin-top:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:11px">
              <div><div style="color:#64748b">Environment</div><div style="font-weight:700;color:#10b8a6">${s.env}</div></div>
              <div><div style="color:#64748b">Social</div><div style="font-weight:700;color:#10b8a6">${s.soc}</div></div>
              <div><div style="color:#64748b">Governance</div><div style="font-weight:700;color:#10b8a6">${s.gov}</div></div>
            </div>
            <div style="margin-top:10px;font-size:11px;color:#94a3b8">Overall ESG Score</div>
            <div class="cc-ce-progress"><div class="cc-ce-progress-fill" style="width:${s.esg}%"></div></div>
            <div style="margin-top:10px;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8">
              <span>Scope 3: ${s.scope3.toLocaleString()} t</span>
              <span>Renewable: ${s.renewable}%</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 4. CARBON OFFSETS
  // ------------------------------------------------------------------
  function renderOffsets(c) {
    const db = initDatabase();
    const totalCredits = db.offsets.reduce((s, o) => s + o.credits, 0);
    const totalCost = db.offsets.reduce((s, o) => s + o.credits * o.price, 0);
    const retired = db.offsets.filter(o => o.status === 'Retired').reduce((s, o) => s + o.credits, 0);
    const active = db.offsets.filter(o => o.status === 'Active').reduce((s, o) => s + o.credits, 0);
    c.innerHTML = `
      <div class="cc-ce-header">
        <h2 class="cc-ce-page-title">♻️ Carbon Offsets Portfolio <span class="cc-ce-page-badge">${db.offsets.length} PROJECTS</span></h2>
      </div>
      <div class="cc-ce-cards">
        <div class="cc-ce-card"><div class="cc-ce-card-label">Total Credits</div><div class="cc-ce-card-value">${(totalCredits/1000).toFixed(0)}k tCO2e</div><div class="cc-ce-card-delta">${db.offsets.length} projects across 6 countries</div></div>
        <div class="cc-ce-card"><div class="cc-ce-card-label">Retired</div><div class="cc-ce-card-value" style="color:#10b8a6">${(retired/1000).toFixed(0)}k</div><div class="cc-ce-card-delta">${((retired/totalCredits)*100).toFixed(0)}% of portfolio</div></div>
        <div class="cc-ce-card"><div class="cc-ce-card-label">Active (held)</div><div class="cc-ce-card-value" style="color:#f59e0b">${(active/1000).toFixed(0)}k</div><div class="cc-ce-card-delta">Available for future retirement</div></div>
        <div class="cc-ce-card"><div class="cc-ce-card-label">Total Spend</div><div class="cc-ce-card-value">${formatCurrency(totalCost)}</div><div class="cc-ce-card-delta">avg $${(totalCost/totalCredits).toFixed(2)}/credit</div></div>
      </div>
      <div class="cc-ce-section">
        <div class="cc-ce-section-title">🌍 Verified Offset Projects</div>
        <div class="cc-ce-scroll">
          <table class="cc-ce-table">
            <thead><tr><th>ID</th><th>Project</th><th>Country</th><th>Type</th><th>Vintage</th><th>Credits (tCO2e)</th><th>Price $</th><th>Value</th><th>Verifier</th><th>Cert #</th><th>Status</th></tr></thead>
            <tbody>
              ${db.offsets.map(o => {
                const st = o.status === 'Retired' ? 'cc-ce-status-ok' : 'cc-ce-status-prog';
                return `
                  <tr>
                    <td style="font-weight:700;color:#10b8a6">${o.id}</td>
                    <td style="font-weight:600">${o.project}</td>
                    <td>${o.country}</td>
                    <td>${o.type}</td>
                    <td>${o.vintage}</td>
                    <td>${o.credits.toLocaleString()}</td>
                    <td>$${o.price.toFixed(2)}</td>
                    <td style="font-weight:600">${formatCurrency(o.credits * o.price)}</td>
                    <td>${o.verifier}</td>
                    <td style="font-family:monospace;font-size:10px">${o.cert}</td>
                    <td><span class="cc-ce-status ${st}">${o.status}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="cc-ce-section">
        <div class="cc-ce-section-title">📊 Credits by Project Type</div>
        <div class="cc-ce-bars">
          ${(() => {
            const types = {};
            db.offsets.forEach(o => { types[o.type] = (types[o.type] || 0) + o.credits; });
            const max = Math.max(...Object.values(types));
            const colors = ['#10b981', '#06b6d4', '#f59e0b', '#22c55e', '#0ea5e9', '#14b8a6'];
            return Object.keys(types).map((t, i) => {
              const pct = (types[t] / max) * 100;
              return `
                <div class="cc-ce-bar-wrap">
                  <div class="cc-ce-bar-value">${(types[t]/1000).toFixed(1)}k</div>
                  <div class="cc-ce-bar" style="height:${pct}%;background:${colors[i]}" title="${t}: ${types[t].toLocaleString()} tCO2e"></div>
                  <div class="cc-ce-bar-label" style="max-width:80px">${t}</div>
                </div>
              `;
            }).join('');
          })()}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 5. NET-ZERO PLANNER
  // ------------------------------------------------------------------
  function renderNetZero(c) {
    const db = initDatabase();
    const baseline = 185500;
    const yearData = db.trajectory.find(t => t.year === netZeroYear) || db.trajectory[db.trajectory.length-1];
    const projectedReduction = ((baseline - yearData.projected) / baseline * 100).toFixed(1);
    const targetReduction = ((baseline - yearData.target) / baseline * 100).toFixed(1);
    const gap = yearData.projected - yearData.target;
    c.innerHTML = `
      <div class="cc-ce-header">
        <h2 class="cc-ce-page-title">🎯 Net-Zero Planner <span class="cc-ce-page-badge">TARGET ${netZeroYear}</span></h2>
      </div>
      <div class="cc-ce-section">
        <div class="cc-ce-section-title">📅 Net-Zero Target Year</div>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:8px">
          <span style="font-size:14px;color:#94a3b8">2025</span>
          <input type="range" min="2030" max="2040" value="${netZeroYear}" class="cc-ce-slider" oninput="window.__ccCE.onYearChange(this.value)" style="flex:1"/>
          <span style="font-size:14px;color:#94a3b8">2040</span>
        </div>
        <div style="text-align:center;font-size:28px;font-weight:800;color:#10b8a6">${netZeroYear}</div>
        <div style="text-align:center;font-size:12px;color:#94a3b8;margin-top:4px">Target net-zero achievement year</div>
        <div class="cc-ce-cards" style="margin-top:20px;margin-bottom:0">
          <div class="cc-ce-card"><div class="cc-ce-card-label">Baseline (2024)</div><div class="cc-ce-card-value">${(baseline/1000).toFixed(1)}k t</div></div>
          <div class="cc-ce-card"><div class="cc-ce-card-label">Projected ${netZeroYear}</div><div class="cc-ce-card-value" style="color:${gap>0?'#f59e0b':'#10b8a6'}">${(yearData.projected/1000).toFixed(1)}k t</div><div class="cc-ce-card-delta">${projectedReduction}% reduction</div></div>
          <div class="cc-ce-card"><div class="cc-ce-card-label">Target ${netZeroYear}</div><div class="cc-ce-card-value" style="color:#10b8a6">${(yearData.target/1000).toFixed(1)}k t</div><div class="cc-ce-card-delta">${targetReduction}% required</div></div>
          <div class="cc-ce-card"><div class="cc-ce-card-label">Gap to target</div><div class="cc-ce-card-value" style="color:${gap>0?'#ef4444':'#10b8a6'}">${gap>0?'−':''}${Math.abs(gap).toLocaleString()} t</div><div class="cc-ce-card-delta">${gap>0?'Behind schedule — accelerate':'On track'}</div></div>
        </div>
      </div>
      <div class="cc-ce-section">
        <div class="cc-ce-section-title">📉 Reduction Trajectory</div>
        <svg viewBox="0 0 720 280" style="width:100%;height:auto;font-family:inherit">
          ${(() => {
            const w = 720, h = 280, pad = 50;
            const yrs = db.trajectory.map(t => t.year);
            const minY = 0, maxY = baseline * 1.05;
            const x = yr => pad + ((yr - yrs[0]) / (yrs[yrs.length-1] - yrs[0])) * (w - pad*2);
            const y = v => h - pad - (v / maxY) * (h - pad*2);
            const gridLines = [0, 50000, 100000, 150000, 185500].map(v => `
              <line x1="${pad}" y1="${y(v)}" x2="${w-pad}" y2="${y(v)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
              <text x="${pad-8}" y="${y(v)+4}" text-anchor="end" fill="#64748b" font-size="10">${(v/1000).toFixed(0)}k</text>
            `).join('');
            const baselineLine = `<line x1="${pad}" y1="${y(baseline)}" x2="${w-pad}" y2="${y(baseline)}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/><text x="${w-pad}" y="${y(baseline)-6}" text-anchor="end" fill="#f59e0b" font-size="10">Baseline</text>`;
            const projPath = 'M ' + db.trajectory.map(t => `${x(t.year)},${y(t.projected)}`).join(' L ');
            const targetPath = 'M ' + db.trajectory.map(t => `${x(t.year)},${y(t.target)}`).join(' L ');
            const yearLabel = yrs.map(yr => `<text x="${x(yr)}" y="${h-pad+18}" text-anchor="middle" fill="#64748b" font-size="10">${yr}</text>`).join('');
            const targetYearMark = netZeroYear >= yrs[0] && netZeroYear <= yrs[yrs.length-1]
              ? `<line x1="${x(netZeroYear)}" y1="${pad}" x2="${x(netZeroYear)}" y2="${h-pad}" stroke="#10b8a6" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.7"/><text x="${x(netZeroYear)}" y="${pad-4}" text-anchor="middle" fill="#10b8a6" font-size="11" font-weight="700">Target ${netZeroYear}</text>`
              : '';
            return gridLines + baselineLine +
              `<path d="${projPath}" fill="none" stroke="#f59e0b" stroke-width="2.5"/>` +
              `<path d="${targetPath}" fill="none" stroke="#10b8a6" stroke-width="2.5" stroke-dasharray="6 3"/>` +
              db.trajectory.map(t => `<circle cx="${x(t.year)}" cy="${y(t.projected)}" r="3" fill="#f59e0b"><title>${t.year} projected: ${t.projected.toLocaleString()} t</title></circle>`).join('') +
              db.trajectory.map(t => `<circle cx="${x(t.year)}" cy="${y(t.target)}" r="3" fill="#10b8a6"><title>${t.year} target: ${t.target.toLocaleString()} t</title></circle>`).join('') +
              yearLabel + targetYearMark;
          })()}
        </svg>
        <div style="margin-top:12px;display:flex;gap:16px;font-size:11px;color:#94a3b8;flex-wrap:wrap">
          <span style="display:flex;align-items:center;gap:6px"><span style="width:18px;height:3px;background:#f59e0b"></span> Projected trajectory (current initiatives)</span>
          <span style="display:flex;align-items:center;gap:6px"><span style="width:18px;height:3px;background:#10b8a6;border-top:1px dashed #10b8a6"></span> SBTi 1.5°C target path</span>
        </div>
      </div>
      <div class="cc-ce-section">
        <div class="cc-ce-section-title">🛠️ Gap Analysis — Required Initiatives</div>
        <div class="cc-ce-grid-2">
          ${[
            { name: 'Fleet electrification', reduction: 4200, cost: 2400000, status: 'In Progress' },
            { name: 'Renewable PPA expansion', reduction: 8400, cost: 1800000, status: 'Committed' },
            { name: 'Supplier engagement program', reduction: 28000, cost: 620000, status: 'In Progress' },
            { name: 'Modal shift road→rail', reduction: 6800, cost: 380000, status: 'Planned' },
            { name: 'Warehouse LED retrofit', reduction: 1200, cost: 240000, status: 'Completed' },
            { name: 'Residual offset purchases', reduction: 8000, cost: 920000, status: 'In Progress' }
          ].map(i => `
            <div class="cc-ce-tile">
              <div class="cc-ce-tile-title">${i.name}</div>
              <div class="cc-ce-tile-sub">${i.status}</div>
              <div class="cc-ce-tile-desc">Reduction potential: <strong style="color:#10b8a6">${i.reduction.toLocaleString()} tCO2e/yr</strong> · Cost: ${formatCurrency(i.cost)}</div>
              <div class="cc-ce-progress"><div class="cc-ce-progress-fill" style="width:${(i.reduction/28000)*100}%"></div></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 6. COMPLIANCE
  // ------------------------------------------------------------------
  function renderCompliance(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-ce-header">
        <h2 class="cc-ce-page-title">📋 Compliance Status <span class="cc-ce-page-badge">${db.compliance.length} REGULATIONS</span></h2>
      </div>
      <div class="cc-ce-cards">
        <div class="cc-ce-card"><div class="cc-ce-card-label">Compliant</div><div class="cc-ce-card-value" style="color:#10b8a6">${db.compliance.filter(r=>r.status==='Compliant').length}</div></div>
        <div class="cc-ce-card"><div class="cc-ce-card-label">In Progress</div><div class="cc-ce-card-value" style="color:#06b6d4">${db.compliance.filter(r=>r.status==='In Progress').length}</div></div>
        <div class="cc-ce-card"><div class="cc-ce-card-label">At Risk</div><div class="cc-ce-card-value" style="color:#ef4444">${db.compliance.filter(r=>r.status==='At Risk').length}</div></div>
        <div class="cc-ce-card"><div class="cc-ce-card-label">Avg Score</div><div class="cc-ce-card-value">${Math.round(db.compliance.reduce((s,r)=>s+(typeof r.score==='number'?r.score:80),0)/db.compliance.length)}</div></div>
      </div>
      <div class="cc-ce-section">
        <div class="cc-ce-section-title">🌐 Regulatory Framework Tracker</div>
        <div class="cc-ce-scroll">
          <table class="cc-ce-table">
            <thead><tr><th>Regulation</th><th>Full Name</th><th>Region</th><th>Status</th><th>Score</th><th>Next Due</th><th>Notes</th></tr></thead>
            <tbody>
              ${db.compliance.map(r => {
                const st = r.status === 'Compliant' ? 'cc-ce-status-ok' : r.status === 'In Progress' ? 'cc-ce-status-prog' : 'cc-ce-status-risk';
                const scoreDisplay = typeof r.score === 'number' ? r.score : r.score;
                const scoreColor = (typeof r.score === 'number' ? r.score : 80) >= 80 ? '#10b8a6' : (typeof r.score === 'number' ? r.score : 80) >= 60 ? '#f59e0b' : '#ef4444';
                return `
                  <tr>
                    <td style="font-weight:700;color:#10b8a6">${r.reg}</td>
                    <td style="font-size:11px">${r.full}</td>
                    <td>${r.region}</td>
                    <td><span class="cc-ce-status ${st}">${r.status}</span></td>
                    <td style="font-weight:700;color:${scoreColor}">${scoreDisplay}</td>
                    <td style="font-size:11px">${formatDate(r.due).substr(0,10)}</td>
                    <td style="font-size:11px;color:#94a3b8;max-width:280px">${r.notes}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="cc-ce-section">
        <div class="cc-ce-section-title">📅 Upcoming Compliance Milestones</div>
        <div class="cc-ce-timeline">
          ${db.compliance.slice().sort((a,b) => new Date(a.due) - new Date(b.due)).map(r => `
            <div class="cc-ce-timeline-item">
              <div class="cc-ce-timeline-year">${formatDate(r.due).substr(0,10)}</div>
              <div class="cc-ce-timeline-title">${r.reg} — ${r.full}</div>
              <div class="cc-ce-timeline-desc">${r.notes}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-ce-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
  }

  function close() {
    const overlay = document.getElementById('cc-ce-overlay');
    if (overlay) overlay.remove();
  }

  function setView(view) {
    currentView = view;
    renderContent();
  }

  function onSearch(q) {
    supplierSearch = q;
    renderSupplierList();
  }

  function onFilter(f) {
    supplierFilter = f;
    renderSupplierList();
  }

  function onYearChange(y) {
    netZeroYear = parseInt(y, 10);
    const c = document.getElementById('cc-ce-content');
    if (c) renderNetZero(c);
  }

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  function init() {
    injectStyles();
    window.__ccCE = { open, close, setView, onSearch, onFilter, onYearChange };

    // ESC to close (works standalone)
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (document.getElementById('cc-ce-overlay')) close();
      }
    });
  }

  init();
})();
