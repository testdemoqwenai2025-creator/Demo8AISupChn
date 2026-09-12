// ====================================================================
// edge-iot.js — Edge Computing & IoT Integration Layer
// ====================================================================
// IoT device management and edge-computing telemetry module:
//   1. Overview: KPI cards (devices online, data points/sec, edge nodes, anomalies)
//   2. Device Map: SVG world map with IoT device locations (reefers, GPS, temp, weight)
//   3. Sensor Streams: real-time data feed from sensors (temp, humidity, GPS, weight, vibration)
//   4. Edge Nodes: list of edge computing nodes with status & capacity
//   5. Anomalies: IoT-detected anomalies (temp spike, GPS deviation, weight mismatch)
//
// Architecture: IIFE + modal + sidebar pattern. No floating button.
// CSS prefix: cc-ei-  ·  Global API: window.__ccEI.open()
// ====================================================================
(function() {
  'use strict';

  if (window.__edgeIoTLoaded) return;
  window.__edgeIoTLoaded = true;

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const DB_KEY = 'cc_edge_iot_db_v1';

  function formatDate(d) {
    return new Date(d).toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  }

  function formatCurrency(a) {
    if (a >= 1e6) return '$' + (a / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (a / 1e3).toFixed(0) + 'k';
    return '$' + a.toFixed(0);
  }

  // ------------------------------------------------------------------
  // DEVICE TYPES
  // ------------------------------------------------------------------
  const DEVICE_TYPES = {
    reefer: { label: 'Reefer Container', color: '#06b6d4', icon: '❄️' },
    gps: { label: 'GPS Tracker', color: '#10b981', icon: '📡' },
    temp: { label: 'Temp Logger', color: '#f59e0b', icon: '🌡️' },
    weight: { label: 'Weight Sensor', color: '#7c3aed', icon: '⚖️' },
    vibration: { label: 'Vibration Sensor', color: '#ec4899', icon: '📳' },
    humidity: { label: 'Humidity Sensor', color: '#3b82f6', icon: '💧' }
  };

  // World-map-projected positions (on a 1000x500 mercator-ish canvas)
  // x = longitude mapped -180..180 → 0..1000
  // y = latitude mapped 90..-60 → 0..500 (approx, with some squish for visual)
  function lonToX(lon) { return Math.round(((lon + 180) / 360) * 1000); }
  function latToY(lat) { return Math.round(((90 - lat) / 150) * 500); }

  const DEVICES = [
    { id: 'DEV-RF-001', type: 'reefer', name: 'MSC Iris Reefer 4218', lat: 51.95, lon: 4.07, status: 'online', battery: 84, signal: -62, lastPing: Date.now() - 42000 },
    { id: 'DEV-RF-002', type: 'reefer', name: 'Maersk Boxtown 8821', lat: 1.26, lon: 103.85, status: 'online', battery: 67, signal: -71, lastPing: Date.now() - 18000 },
    { id: 'DEV-RF-003', type: 'reefer', name: 'CMA CGM Antoine 1142', lat: 25.05, lon: 55.27, status: 'alert', battery: 42, signal: -84, lastPing: Date.now() - 92000 },
    { id: 'DEV-GPS-001', type: 'gps', name: 'Truck Fleet 8842-A', lat: 35.68, lon: 139.69, status: 'online', battery: 91, signal: -58, lastPing: Date.now() - 8000 },
    { id: 'DEV-GPS-002', type: 'gps', name: 'Truck Fleet 8842-B', lat: 40.71, lon: -74.00, status: 'online', battery: 76, signal: -65, lastPing: Date.now() - 12000 },
    { id: 'DEV-GPS-003', type: 'gps', name: 'Rail Wagon DB-440', lat: 52.52, lon: 13.40, status: 'online', battery: 88, signal: -60, lastPing: Date.now() - 5000 },
    { id: 'DEV-GPS-004', type: 'gps', name: 'Barge Rhine 7781', lat: 51.22, lon: 6.77, status: 'offline', battery: 0, signal: -100, lastPing: Date.now() - 1840000 },
    { id: 'DEV-TP-001', type: 'temp', name: 'Cold Storage Hamburg-A4', lat: 53.55, lon: 9.99, status: 'online', battery: 95, signal: -54, lastPing: Date.now() - 3000 },
    { id: 'DEV-TP-002', type: 'temp', name: 'Pharma Vault Memphis-12', lat: 35.15, lon: -90.05, status: 'alert', battery: 81, signal: -68, lastPing: Date.now() - 14000 },
    { id: 'DEV-TP-003', type: 'temp', name: 'Sushi Cold Chain Tokyo', lat: 35.68, lon: 139.69, status: 'online', battery: 72, signal: -73, lastPing: Date.now() - 9000 },
    { id: 'DEV-WT-001', type: 'weight', name: 'Silo weighing Rotterdam-3', lat: 51.95, lon: 4.07, status: 'online', battery: 88, signal: -62, lastPing: Date.now() - 11000 },
    { id: 'DEV-WT-002', type: 'weight', name: 'Bulk loader Santos-1', lat: -23.96, lon: -46.33, status: 'online', battery: 64, signal: -77, lastPing: Date.now() - 22000 },
    { id: 'DEV-VB-001', type: 'vibration', name: 'Conveyor Belt Shanghai-12', lat: 31.23, lon: 121.47, status: 'online', battery: 79, signal: -69, lastPing: Date.now() - 16000 },
    { id: 'DEV-VB-002', type: 'vibration', name: 'Crane Mumbai-Pier 4', lat: 19.07, lon: 72.87, status: 'alert', battery: 55, signal: -82, lastPing: Date.now() - 38000 },
    { id: 'DEV-HM-001', type: 'humidity', name: 'Pharma Vault Singapore-7', lat: 1.26, lon: 103.85, status: 'online', battery: 86, signal: -64, lastPing: Date.now() - 7000 },
    { id: 'DEV-HM-002', type: 'humidity', name: 'Tobacco Store Lagos-2', lat: 6.52, lon: 3.37, status: 'online', battery: 71, signal: -79, lastPing: Date.now() - 26000 }
  ];

  const EDGE_NODES = [
    { id: 'EDGE-RTM-01', name: 'Rotterdam Edge Cluster', country: 'NL', lat: 51.95, lon: 4.07, status: 'online', cpu: 42, mem: 58, gpu: 'NVIDIA A100 ×4', throughput: 124000, latency: 12, models: 18 },
    { id: 'EDGE-SHA-01', name: 'Shanghai Edge Hub', country: 'CN', lat: 31.23, lon: 121.47, status: 'online', cpu: 68, mem: 74, gpu: 'NVIDIA A100 ×8', throughput: 286000, latency: 18, models: 24 },
    { id: 'EDGE-LGB-01', name: 'Long Beach Edge Node', country: 'US', lat: 33.75, lon: -118.19, status: 'online', cpu: 51, mem: 62, gpu: 'NVIDIA L40S ×4', throughput: 184000, latency: 14, models: 16 },
    { id: 'EDGE-MEM-01', name: 'Memphis Mega-Edge', country: 'US', lat: 35.15, lon: -90.05, status: 'online', cpu: 73, mem: 81, gpu: 'NVIDIA H100 ×8', throughput: 348000, latency: 9, models: 31 },
    { id: 'EDGE-SIN-01', name: 'Singapore Pasir Edge', country: 'SG', lat: 1.26, lon: 103.85, status: 'online', cpu: 38, mem: 49, gpu: 'NVIDIA A100 ×4', throughput: 142000, latency: 11, models: 19 },
    { id: 'EDGE-HAM-01', name: 'Hamburg Edge Pod', country: 'DE', lat: 53.55, lon: 9.99, status: 'degraded', cpu: 89, mem: 92, gpu: 'NVIDIA T4 ×2', throughput: 64000, latency: 38, models: 9 },
    { id: 'EDGE-DXB-01', name: 'Dubai Edge Gateway', country: 'AE', lat: 25.20, lon: 55.27, status: 'online', cpu: 44, mem: 51, gpu: 'NVIDIA L40S ×4', throughput: 162000, latency: 16, models: 14 },
    { id: 'EDGE-TYO-01', name: 'Tokyo Edge Lab', country: 'JP', lat: 35.68, lon: 139.69, status: 'online', cpu: 56, mem: 63, gpu: 'NVIDIA H100 ×4', throughput: 224000, latency: 8, models: 22 },
    { id: 'EDGE-GRU-01', name: 'São Paulo Edge', country: 'BR', lat: -23.55, lon: -46.63, status: 'offline', cpu: 0, mem: 0, gpu: 'NVIDIA T4 ×2', throughput: 0, latency: 0, models: 6 },
    { id: 'EDGE-BOM-01', name: 'Mumbai Edge Mini', country: 'IN', lat: 19.07, lon: 72.87, status: 'online', cpu: 61, mem: 70, gpu: 'NVIDIA L4 ×4', throughput: 118000, latency: 22, models: 11 }
  ];

  const SENSOR_STREAMS = [
    { id: 'STR-RF-001', deviceId: 'DEV-RF-001', type: 'temp', value: -18.4, unit: '°C', min: -25, max: -15, ts: Date.now() - 2000, trend: 'stable' },
    { id: 'STR-RF-001-h', deviceId: 'DEV-RF-001', type: 'humidity', value: 64.2, unit: '%', min: 50, max: 75, ts: Date.now() - 2000, trend: 'up' },
    { id: 'STR-GPS-001', deviceId: 'DEV-GPS-001', type: 'gps', value: 35.6825, unit: 'lat,lon', min: 0, max: 0, ts: Date.now() - 1000, trend: 'moving', lon: 139.7530 },
    { id: 'STR-TP-001', deviceId: 'DEV-TP-001', type: 'temp', value: 2.1, unit: '°C', min: 0, max: 4, ts: Date.now() - 1500, trend: 'stable' },
    { id: 'STR-TP-002', deviceId: 'DEV-TP-002', type: 'temp', value: 7.8, unit: '°C', min: 2, max: 8, ts: Date.now() - 4000, trend: 'up', alert: true },
    { id: 'STR-WT-001', deviceId: 'DEV-WT-001', type: 'weight', value: 24680, unit: 'kg', min: 0, max: 40000, ts: Date.now() - 3500, trend: 'down' },
    { id: 'STR-VB-001', deviceId: 'DEV-VB-001', type: 'vibration', value: 4.2, unit: 'mm/s', min: 0, max: 12, ts: Date.now() - 1200, trend: 'stable' },
    { id: 'STR-VB-002', deviceId: 'DEV-VB-002', type: 'vibration', value: 11.8, unit: 'mm/s', min: 0, max: 12, ts: Date.now() - 2800, trend: 'up', alert: true },
    { id: 'STR-HM-001', deviceId: 'DEV-HM-001', type: 'humidity', value: 58.4, unit: '%', min: 30, max: 65, ts: Date.now() - 2200, trend: 'stable' },
    { id: 'STR-HM-002', deviceId: 'DEV-HM-002', type: 'humidity', value: 78.1, unit: '%', min: 50, max: 70, ts: Date.now() - 4800, trend: 'up', alert: true }
  ];

  const ANOMALIES = [
    { id: 'AN-2025-1142', deviceId: 'DEV-TP-002', type: 'Temp Spike', severity: 'High', desc: 'Pharma vault temperature exceeded 8°C threshold for 4 minutes', value: '7.8°C (max 8°C)', detected: Date.now() - 86400000 * 2, status: 'open' },
    { id: 'AN-2025-1141', deviceId: 'DEV-VB-002', type: 'Vibration Excess', severity: 'Critical', desc: 'Crane Mumbai Pier-4 vibration at 11.8 mm/s, approaching 12 mm/s safety limit', value: '11.8 mm/s', detected: Date.now() - 86400000 * 1, status: 'open' },
    { id: 'AN-2025-1140', deviceId: 'DEV-GPS-004', type: 'GPS Loss', severity: 'High', desc: 'Barge Rhine 7781 GPS signal lost for 32 minutes', value: 'No fix', detected: Date.now() - 86400000 * 1, status: 'investigating' },
    { id: 'AN-2025-1139', deviceId: 'DEV-RF-003', type: 'Reefer Temp Drift', severity: 'Medium', desc: 'CMA CGM Antoine reefer drifting from -18°C toward -15°C setpoint', value: '-15.2°C', detected: Date.now() - 86400000 * 3, status: 'open' },
    { id: 'AN-2025-1138', deviceId: 'DEV-WT-002', type: 'Weight Mismatch', severity: 'Medium', desc: 'Santos bulk loader reported 1,240 kg variance vs bill of lading', value: '1,240 kg delta', detected: Date.now() - 86400000 * 4, status: 'resolved' },
    { id: 'AN-2025-1137', deviceId: 'DEV-HM-002', type: 'Humidity High', severity: 'Low', desc: 'Lagos tobacco store humidity 78%, exceeds 70% threshold', value: '78.1%', detected: Date.now() - 86400000 * 5, status: 'open' },
    { id: 'AN-2025-1136', deviceId: 'DEV-RF-001', type: 'Battery Low', severity: 'Low', desc: 'MSC Iris reefer battery at 42%, schedule recharge within 48h', value: '42%', detected: Date.now() - 86400000 * 6, status: 'open' },
    { id: 'AN-2025-1135', deviceId: 'DEV-GPS-001', type: 'GPS Deviation', severity: 'Medium', desc: 'Truck Fleet 8842-A deviated 2.4 km from planned route', value: '2.4 km', detected: Date.now() - 86400000 * 7, status: 'resolved' }
  ];

  // ------------------------------------------------------------------
  // DB INIT
  // ------------------------------------------------------------------
  function initDatabase() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
    if (db && db.generated) return db;
    db = {
      devices: DEVICES,
      edgeNodes: EDGE_NODES,
      streams: SENSOR_STREAMS,
      anomalies: ANOMALIES,
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
  let deviceFilter = 'all';
  let streamFilter = 'all';
  let anomalyFilter = 'all';
  let liveTimer = null;

  // ------------------------------------------------------------------
  // STYLES
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('cc-ei-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-ei-styles';
    style.textContent = `
      .cc-ei-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10012; background: rgba(18,12,6,0.99); display: flex; overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
      .cc-ei-sidebar { width: 220px; flex-shrink: 0; background: rgba(36,24,12,0.6); border-right: 1px solid rgba(234,88,12,0.15); padding: 60px 0 20px; overflow-y: auto; display: flex; flex-direction: column; }
      .cc-ei-sidebar-brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(234,88,12,0.15); margin-bottom: 12px; }
      .cc-ei-sidebar-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0; background: linear-gradient(135deg, #ea580c, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .cc-ei-sidebar-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
      .cc-ei-nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; background: none; border-top: none; border-right: none; border-bottom: none; width: 100%; text-align: left; font-family: inherit; }
      .cc-ei-nav-item:hover { background: rgba(234,88,12,0.06); color: #e2e8f0; }
      .cc-ei-nav-item.active { background: rgba(234,88,12,0.1); color: #f97316; border-left-color: #f97316; }
      .cc-ei-nav-icon { font-size: 16px; width: 20px; text-align: center; }
      .cc-ei-main { flex: 1; overflow-y: auto; padding: 60px 24px 24px; }
      .cc-ei-close { position: fixed; top: 16px; right: 20px; z-index: 10013; width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
      .cc-ei-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
      .cc-ei-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(234,88,12,0.15); flex-wrap: wrap; gap: 12px; }
      .cc-ei-page-title { font-size: 22px; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #ea580c, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .cc-ei-page-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; background: linear-gradient(135deg, #ea580c, #f59e0b); color: #fff; font-weight: 600; -webkit-text-fill-color: #fff; }
      .cc-ei-live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #f97316; font-weight: 600; }
      .cc-ei-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #f97316; animation: cc-ei-pulse 1.5s ease-in-out infinite; }
      @keyframes cc-ei-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .cc-ei-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px; }
      .cc-ei-card { background: linear-gradient(135deg, rgba(234,88,12,0.06), rgba(245,158,11,0.06)); border: 1px solid rgba(234,88,12,0.22); border-radius: 12px; padding: 16px; }
      .cc-ei-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 6px; }
      .cc-ei-card-value { font-size: 24px; font-weight: 800; color: #fff; }
      .cc-ei-card-delta { font-size: 11px; margin-top: 4px; color: #94a3b8; }
      .cc-ei-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(234,88,12,0.15); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
      .cc-ei-section-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
      .cc-ei-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .cc-ei-table th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(234,88,12,0.18); }
      .cc-ei-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; vertical-align: middle; }
      .cc-ei-table tr:hover td { background: rgba(234,88,12,0.05); }
      .cc-ei-scroll { max-height: 520px; overflow-y: auto; border: 1px solid rgba(234,88,12,0.15); border-radius: 8px; scrollbar-width: thin; scrollbar-color: rgba(234,88,12,0.4) transparent; }
      .cc-ei-scroll::-webkit-scrollbar { width: 8px; }
      .cc-ei-scroll::-webkit-scrollbar-track { background: transparent; }
      .cc-ei-scroll::-webkit-scrollbar-thumb { background: rgba(234,88,12,0.3); border-radius: 4px; }
      .cc-ei-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
      .cc-ei-status-ok { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
      .cc-ei-status-warn { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
      .cc-ei-status-crit { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .cc-ei-status-off { background: rgba(100,116,139,0.15); color: #94a3b8; border: 1px solid rgba(100,116,139,0.3); }
      .cc-ei-status-deg { background: rgba(249,115,22,0.15); color: #f97316; border: 1px solid rgba(249,115,22,0.3); }
      .cc-ei-bar-track { display: inline-block; width: 80px; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; vertical-align: middle; margin-right: 6px; }
      .cc-ei-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #ea580c, #f59e0b); }
      .cc-ei-input { background: rgba(36,24,12,0.7); border: 1px solid rgba(234,88,12,0.25); color: #e2e8f0; border-radius: 8px; padding: 9px 12px; font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.2s; }
      .cc-ei-input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(234,88,12,0.2); }
      .cc-ei-btn { background: linear-gradient(135deg, #ea580c, #f59e0b); color: #fff; border: none; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: transform 0.15s, box-shadow 0.15s; }
      .cc-ei-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(234,88,12,0.35); }
      .cc-ei-map-wrap { background: linear-gradient(135deg, rgba(20,30,40,0.4), rgba(8,12,20,0.5)); border: 1px solid rgba(234,88,12,0.2); border-radius: 12px; padding: 12px; position: relative; overflow: hidden; }
      .cc-ei-map-svg { width: 100%; height: auto; display: block; }
      .cc-ei-legend { display: flex; gap: 14px; flex-wrap: wrap; padding: 8px 4px 0; font-size: 11px; color: #94a3b8; }
      .cc-ei-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
      .cc-ei-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
      .cc-ei-tile { background: linear-gradient(135deg, rgba(234,88,12,0.05), rgba(245,158,11,0.05)); border: 1px solid rgba(234,88,12,0.2); border-radius: 12px; padding: 16px; transition: border-color 0.2s, transform 0.2s; }
      .cc-ei-tile:hover { border-color: rgba(234,88,12,0.5); transform: translateY(-2px); }
      .cc-ei-tile-title { font-size: 14px; font-weight: 700; color: #fff; }
      .cc-ei-tile-sub { font-size: 11px; color: #f97316; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
      .cc-ei-tile-desc { font-size: 12px; color: #94a3b8; margin-top: 8px; line-height: 1.5; }
      .cc-ei-stream-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 12px; }
      .cc-ei-stream-row:hover { background: rgba(234,88,12,0.04); }
      .cc-ei-stream-icon { font-size: 18px; flex-shrink: 0; }
      .cc-ei-spark { display: inline-block; vertical-align: middle; }
      @media (max-width: 767px) {
        .cc-ei-modal { flex-direction: column; }
        .cc-ei-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 50px 0 8px; }
        .cc-ei-sidebar-brand { display: none; }
        .cc-ei-nav-item { padding: 8px 14px; white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
        .cc-ei-nav-item.active { border-bottom-color: #f97316; border-left-color: transparent; }
        .cc-ei-main { padding: 12px 12px 20px; }
        .cc-ei-cards { grid-template-columns: repeat(2, 1fr); }
      }
      html:not(.dark) .cc-ei-modal { background: rgba(253,247,240,0.99); color: #1e293b; }
      html:not(.dark) .cc-ei-sidebar { background: rgba(255,242,224,0.8); border-right-color: rgba(234,88,12,0.12); }
      html:not(.dark) .cc-ei-sidebar-title { background: linear-gradient(135deg, #c2410c, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      html:not(.dark) .cc-ei-nav-item { color: #64748b; }
      html:not(.dark) .cc-ei-nav-item:hover { background: rgba(234,88,12,0.06); color: #1e293b; }
      html:not(.dark) .cc-ei-nav-item.active { background: rgba(234,88,12,0.1); color: #c2410c; }
      html:not(.dark) .cc-ei-page-title { background: linear-gradient(135deg, #c2410c, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      html:not(.dark) .cc-ei-header { border-bottom-color: rgba(234,88,12,0.1); }
      html:not(.dark) .cc-ei-card { background: rgba(234,88,12,0.05); border-color: rgba(234,88,12,0.2); }
      html:not(.dark) .cc-ei-card-label { color: #64748b; }
      html:not(.dark) .cc-ei-card-value { color: #0f172a; }
      html:not(.dark) .cc-ei-card-delta { color: #64748b; }
      html:not(.dark) .cc-ei-section { background: rgba(0,0,0,0.02); border-color: rgba(234,88,12,0.15); }
      html:not(.dark) .cc-ei-section-title { color: #1e293b; }
      html:not(.dark) .cc-ei-table th { color: #64748b; border-bottom-color: rgba(0,0,0,0.08); }
      html:not(.dark) .cc-ei-table td { color: #334155; border-bottom-color: rgba(0,0,0,0.04); }
      html:not(.dark) .cc-ei-table tr:hover td { background: rgba(234,88,12,0.04); }
      html:not(.dark) .cc-ei-map-wrap { background: rgba(255,242,224,0.6); border-color: rgba(234,88,12,0.18); }
      html:not(.dark) .cc-ei-input { background: #fff; border-color: rgba(234,88,12,0.2); color: #1e293b; }
      html:not(.dark) .cc-ei-tile { background: rgba(234,88,12,0.04); border-color: rgba(234,88,12,0.18); }
      html:not(.dark) .cc-ei-tile-title { color: #0f172a; }
      html:not(.dark) .cc-ei-tile-desc { color: #64748b; }
      html:not(.dark) .cc-ei-stream-row:hover { background: rgba(234,88,12,0.04); }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // WORLD MAP (SVG) — simplified continent outlines
  // ------------------------------------------------------------------
  function renderWorldMapSVG() {
    // Simplified continent silhouettes (very rough, decorative)
    const continents = `
      <path d="M 150 110 Q 180 95 220 100 Q 260 90 290 110 Q 310 130 300 160 Q 280 200 240 200 Q 200 200 170 180 Q 150 150 150 110 Z" fill="rgba(148,163,184,0.06)" stroke="rgba(148,163,184,0.18)" stroke-width="1"/>
      <path d="M 260 230 Q 290 220 320 235 Q 340 270 330 310 Q 310 360 280 360 Q 260 340 250 300 Q 245 260 260 230 Z" fill="rgba(148,163,184,0.06)" stroke="rgba(148,163,184,0.18)" stroke-width="1"/>
      <path d="M 460 100 Q 510 90 560 110 Q 600 130 600 170 Q 580 200 540 200 Q 490 195 460 170 Q 445 140 460 100 Z" fill="rgba(148,163,184,0.06)" stroke="rgba(148,163,184,0.18)" stroke-width="1"/>
      <path d="M 490 210 Q 530 200 560 220 Q 580 260 570 320 Q 540 380 510 370 Q 480 340 480 290 Q 478 240 490 210 Z" fill="rgba(148,163,184,0.06)" stroke="rgba(148,163,184,0.18)" stroke-width="1"/>
      <path d="M 590 130 Q 660 110 730 120 Q 800 130 820 160 Q 815 200 770 210 Q 700 215 640 200 Q 600 180 590 130 Z" fill="rgba(148,163,184,0.06)" stroke="rgba(148,163,184,0.18)" stroke-width="1"/>
      <path d="M 700 230 Q 760 220 810 240 Q 850 280 840 340 Q 820 390 780 390 Q 730 370 700 320 Q 685 270 700 230 Z" fill="rgba(148,163,184,0.06)" stroke="rgba(148,163,184,0.18)" stroke-width="1"/>
      <path d="M 770 380 Q 820 375 850 400 Q 870 440 840 460 Q 800 460 780 430 Q 765 405 770 380 Z" fill="rgba(148,163,184,0.06)" stroke="rgba(148,163,184,0.18)" stroke-width="1"/>
    `;
    return continents;
  }

  function renderDeviceMap() {
    const db = initDatabase();
    let devices = db.devices;
    if (deviceFilter !== 'all') devices = devices.filter(d => d.type === deviceFilter);
    const onlineCount = devices.filter(d => d.status === 'online').length;
    const alertCount = devices.filter(d => d.status === 'alert').length;
    const offlineCount = devices.filter(d => d.status === 'offline').length;
    return `
      <svg class="cc-ei-map-svg" viewBox="0 0 1000 500">
        ${renderWorldMapSVG()}
        ${devices.map(d => {
          const x = lonToX(d.lon);
          const y = latToY(d.lat);
          const t = DEVICE_TYPES[d.type];
          const color = d.status === 'online' ? t.color : d.status === 'alert' ? '#ef4444' : '#64748b';
          const r = d.status === 'alert' ? 9 : 6;
          return `
            <g style="cursor:pointer" onclick="window.__ccEI.onDeviceClick('${d.id}')">
              ${d.status === 'alert' ? `<circle cx="${x}" cy="${y}" r="${r+6}" fill="${color}" fill-opacity="0.18"><animate attributeName="r" values="${r+4};${r+10};${r+4}" dur="1.6s" repeatCount="indefinite"/></circle>` : ''}
              <circle cx="${x}" cy="${y}" r="${r}" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2"/>
              <circle cx="${x}" cy="${y}" r="2" fill="${color}"/>
              <title>${t.icon} ${d.name} — ${d.status.toUpperCase()} (battery ${d.battery}%)</title>
            </g>
          `;
        }).join('')}
      </svg>
    `;
  }

  // ------------------------------------------------------------------
  // SPARKLINE (SVG) — small inline chart for stream values
  // ------------------------------------------------------------------
  function renderSparkline(values, color, w, h) {
    if (!values.length) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pts = values.map((v, i) => `${(i / (values.length-1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return `<svg class="cc-ei-spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
  }

  // ------------------------------------------------------------------
  // RENDER MODAL SHELL
  // ------------------------------------------------------------------
  function renderModal() {
    initDatabase();
    const overlay = document.createElement('div');
    overlay.id = 'cc-ei-overlay';
    overlay.className = 'cc-ei-modal';
    overlay.innerHTML = `
      <button class="cc-ei-close" onclick="window.__ccEI.close()" aria-label="Close">×</button>
      <div class="cc-ei-sidebar">
        <div class="cc-ei-sidebar-brand">
          <div class="cc-ei-sidebar-title">📡 Edge & IoT</div>
          <div class="cc-ei-sidebar-sub">Edge Computing & IoT Layer</div>
        </div>
        <button class="cc-ei-nav-item ${currentView==='overview'?'active':''}" onclick="window.__ccEI.setView('overview')"><span class="cc-ei-nav-icon">📊</span> Overview</button>
        <button class="cc-ei-nav-item ${currentView==='map'?'active':''}" onclick="window.__ccEI.setView('map')"><span class="cc-ei-nav-icon">🌍</span> Device Map</button>
        <button class="cc-ei-nav-item ${currentView==='streams'?'active':''}" onclick="window.__ccEI.setView('streams')"><span class="cc-ei-nav-icon">📈</span> Sensor Streams</button>
        <button class="cc-ei-nav-item ${currentView==='nodes'?'active':''}" onclick="window.__ccEI.setView('nodes')"><span class="cc-ei-nav-icon">💻</span> Edge Nodes</button>
        <button class="cc-ei-nav-item ${currentView==='anomalies'?'active':''}" onclick="window.__ccEI.setView('anomalies')"><span class="cc-ei-nav-icon">⚠️</span> Anomalies</button>
      </div>
      <div class="cc-ei-main" id="cc-ei-content"></div>
    `;
    return overlay;
  }

  function renderContent() {
    const container = document.getElementById('cc-ei-content');
    if (!container) return;
    if (currentView === 'overview') renderOverview(container);
    else if (currentView === 'map') renderMap(container);
    else if (currentView === 'streams') renderStreams(container);
    else if (currentView === 'nodes') renderNodes(container);
    else if (currentView === 'anomalies') renderAnomalies(container);
    document.querySelectorAll('.cc-ei-nav-item').forEach(item => {
      const oc = item.getAttribute('onclick') || '';
      item.classList.toggle('active', oc.indexOf("'" + currentView + "'") !== -1);
    });
  }

  // ------------------------------------------------------------------
  // 1. OVERVIEW
  // ------------------------------------------------------------------
  function renderOverview(c) {
    const db = initDatabase();
    const online = db.devices.filter(d => d.status === 'online').length;
    const totalThroughput = db.edgeNodes.reduce((s, n) => s + n.throughput, 0);
    const openAnoms = db.anomalies.filter(a => a.status === 'open').length;
    c.innerHTML = `
      <div class="cc-ei-header">
        <h2 class="cc-ei-page-title">📡 Edge & IoT Overview <span class="cc-ei-page-badge">LIVE</span></h2>
        <div class="cc-ei-live-indicator"><div class="cc-ei-live-dot"></div> Streaming telemetry</div>
      </div>
      <div class="cc-ei-cards">
        <div class="cc-ei-card"><div class="cc-ei-card-label">Devices Online</div><div class="cc-ei-card-value" style="color:#22c55e">${online}/${db.devices.length}</div><div class="cc-ei-card-delta">${db.devices.filter(d=>d.status==='alert').length} alerts · ${db.devices.filter(d=>d.status==='offline').length} offline</div></div>
        <div class="cc-ei-card"><div class="cc-ei-card-label">Data Points/sec</div><div class="cc-ei-card-value" style="color:#f97316">${(totalThroughput/1000).toFixed(0)}k</div><div class="cc-ei-card-delta">aggregate across edge nodes</div></div>
        <div class="cc-ei-card"><div class="cc-ei-card-label">Edge Nodes</div><div class="cc-ei-card-value">${db.edgeNodes.filter(n=>n.status==='online').length}/${db.edgeNodes.length}</div><div class="cc-ei-card-delta">1 degraded · 1 offline</div></div>
        <div class="cc-ei-card"><div class="cc-ei-card-label">Open Anomalies</div><div class="cc-ei-card-value" style="color:#ef4444">${openAnoms}</div><div class="cc-ei-card-delta">${db.anomalies.filter(a=>a.severity==='Critical').length} critical</div></div>
      </div>
      <div class="cc-ei-section">
        <div class="cc-ei-section-title">🌍 Global Device Distribution</div>
        <div class="cc-ei-map-wrap">
          ${renderDeviceMap()}
          <div class="cc-ei-legend">
            ${Object.keys(DEVICE_TYPES).map(t => `<span style="display:flex;align-items:center;gap:6px"><span class="cc-ei-legend-dot" style="background:${DEVICE_TYPES[t].color}"></span> ${DEVICE_TYPES[t].icon} ${DEVICE_TYPES[t].label}</span>`).join('')}
            <span style="display:flex;align-items:center;gap:6px"><span class="cc-ei-legend-dot" style="background:#ef4444"></span> Alert</span>
          </div>
        </div>
      </div>
      <div class="cc-ei-section">
        <div class="cc-ei-section-title">📊 Device Type Distribution</div>
        <div style="display:flex;align-items:flex-end;gap:12px;height:200px;padding:0 4px">
          ${Object.keys(DEVICE_TYPES).map(t => {
            const count = db.devices.filter(d => d.type === t).length;
            const pct = (count / db.devices.length) * 100;
            return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
                <div style="font-size:11px;font-weight:700;color:#e2e8f0">${count}</div>
                <div style="width:100%;max-width:60px;border-radius:4px 4px 0 0;min-height:4px;background:${DEVICE_TYPES[t].color};height:${Math.max(pct*2, 10)}%" title="${DEVICE_TYPES[t].label}: ${count} devices"></div>
                <div style="font-size:10px;color:#94a3b8;text-align:center">${DEVICE_TYPES[t].icon}<br>${DEVICE_TYPES[t].label.split(' ')[0]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="cc-ei-section">
        <div class="cc-ei-section-title">⚡ Recent Anomalies (last 5)</div>
        <div class="cc-ei-scroll" style="max-height:280px">
          <table class="cc-ei-table">
            <thead><tr><th>ID</th><th>Device</th><th>Type</th><th>Severity</th><th>Detected</th><th>Status</th></tr></thead>
            <tbody>
              ${db.anomalies.slice(0, 5).map(a => {
                const sev = a.severity === 'Critical' ? 'cc-ei-status-crit' : a.severity === 'High' ? 'cc-ei-status-warn' : 'cc-ei-status-ok';
                const st = a.status === 'open' ? 'cc-ei-status-crit' : a.status === 'investigating' ? 'cc-ei-status-warn' : 'cc-ei-status-ok';
                return `
                  <tr>
                    <td style="font-family:monospace;color:#f97316">${a.id}</td>
                    <td style="font-weight:600">${a.deviceId}</td>
                    <td>${a.type}</td>
                    <td><span class="cc-ei-status ${sev}">${a.severity}</span></td>
                    <td style="font-size:11px;color:#94a3b8">${formatDate(a.detected).substr(0,10)}</td>
                    <td><span class="cc-ei-status ${st}">${a.status}</span></td>
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
  // 2. DEVICE MAP
  // ------------------------------------------------------------------
  function renderMap(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-ei-header">
        <h2 class="cc-ei-page-title">🌍 IoT Device Map <span class="cc-ei-page-badge">${db.devices.length} DEVICES</span></h2>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <select class="cc-ei-input" onchange="window.__ccEI.onDeviceFilter(this.value)">
          <option value="all" ${deviceFilter==='all'?'selected':''}>All device types</option>
          ${Object.keys(DEVICE_TYPES).map(t => `<option value="${t}" ${deviceFilter===t?'selected':''}>${DEVICE_TYPES[t].icon} ${DEVICE_TYPES[t].label}</option>`).join('')}
        </select>
      </div>
      <div class="cc-ei-section">
        <div class="cc-ei-section-title">🗺️ Live Device Locations</div>
        <div class="cc-ei-map-wrap">
          ${renderDeviceMap()}
          <div class="cc-ei-legend">
            <span style="display:flex;align-items:center;gap:6px"><span class="cc-ei-legend-dot" style="background:#22c55e"></span> Online</span>
            <span style="display:flex;align-items:center;gap:6px"><span class="cc-ei-legend-dot" style="background:#ef4444"></span> Alert (pulsing)</span>
            <span style="display:flex;align-items:center;gap:6px"><span class="cc-ei-legend-dot" style="background:#64748b"></span> Offline</span>
          </div>
        </div>
      </div>
      <div class="cc-ei-section">
        <div class="cc-ei-section-title">📋 Device Inventory</div>
        <div class="cc-ei-scroll">
          <table class="cc-ei-table">
            <thead><tr><th>ID</th><th>Type</th><th>Name</th><th>Status</th><th>Battery</th><th>Signal (dBm)</th><th>Last Ping</th></tr></thead>
            <tbody>
              ${db.devices.filter(d => deviceFilter==='all' || d.type===deviceFilter).map(d => {
                const t = DEVICE_TYPES[d.type];
                const st = d.status === 'online' ? 'cc-ei-status-ok' : d.status === 'alert' ? 'cc-ei-status-crit' : 'cc-ei-status-off';
                const bat = d.battery < 30 ? '#ef4444' : d.battery < 60 ? '#f59e0b' : '#22c55e';
                const secsAgo = Math.floor((Date.now() - d.lastPing) / 1000);
                return `
                  <tr>
                    <td style="font-family:monospace;color:#f97316">${d.id}</td>
                    <td>${t.icon} ${t.label}</td>
                    <td style="font-weight:600">${d.name}</td>
                    <td><span class="cc-ei-status ${st}">${d.status}</span></td>
                    <td><span class="cc-ei-bar-track"><span class="cc-ei-bar-fill" style="width:${d.battery}%;background:${bat}"></span></span><span style="color:${bat};font-weight:700">${d.battery}%</span></td>
                    <td>${d.signal}</td>
                    <td style="font-size:11px;color:#94a3b8">${secsAgo < 60 ? secsAgo+'s ago' : Math.floor(secsAgo/60)+'m ago'}</td>
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
  // 3. SENSOR STREAMS
  // ------------------------------------------------------------------
  function renderStreams(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-ei-header">
        <h2 class="cc-ei-page-title">📈 Sensor Streams <span class="cc-ei-page-badge">REAL-TIME</span></h2>
        <div class="cc-ei-live-indicator"><div class="cc-ei-live-dot"></div> Updating every 3s</div>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <select class="cc-ei-input" onchange="window.__ccEI.onStreamFilter(this.value)">
          <option value="all" ${streamFilter==='all'?'selected':''}>All sensor types</option>
          <option value="temp" ${streamFilter==='temp'?'selected':''}>🌡️ Temperature</option>
          <option value="humidity" ${streamFilter==='humidity'?'selected':''}>💧 Humidity</option>
          <option value="gps" ${streamFilter==='gps'?'selected':''}>📡 GPS</option>
          <option value="weight" ${streamFilter==='weight'?'selected':''}>⚖️ Weight</option>
          <option value="vibration" ${streamFilter==='vibration'?'selected':''}>📳 Vibration</option>
        </select>
      </div>
      <div class="cc-ei-section">
        <div class="cc-ei-section-title">📡 Live Sensor Data Feed</div>
        <div id="cc-ei-stream-list">
          ${renderStreamList()}
        </div>
      </div>
    `;
  }

  function renderStreamList() {
    const db = initDatabase();
    let streams = db.streams;
    if (streamFilter !== 'all') streams = streams.filter(s => s.type === streamFilter);
    return streams.map(s => {
      const t = DEVICE_TYPES[s.type] || { icon: '📊', color: '#f97316' };
      // Build synthetic sparkline values
      const sparkVals = [];
      let v = s.value;
      for (let i = 0; i < 12; i++) {
        v = v + (Math.random() - 0.5) * (Math.abs(s.value) * 0.05 + 0.5);
        sparkVals.push(v);
      }
      sparkVals.push(s.value);
      const isAlert = s.alert;
      const trendIcon = s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : s.trend === 'moving' ? '→' : '—';
      const trendColor = s.trend === 'up' ? '#22c55e' : s.trend === 'down' ? '#ef4444' : '#94a3b8';
      const ageSec = Math.floor((Date.now() - s.ts) / 1000);
      return `
        <div class="cc-ei-stream-row" style="${isAlert ? 'background:rgba(239,68,68,0.06);border-left:3px solid #ef4444' : ''}">
          <span class="cc-ei-stream-icon">${t.icon}</span>
          <div style="flex:1;min-width:140px">
            <div style="font-weight:700;color:${isAlert ? '#ef4444' : '#fff'}">${s.deviceId}</div>
            <div style="font-size:11px;color:#94a3b8">${s.id} · ${ageSec}s ago</div>
          </div>
          <div style="flex:1;font-size:11px;color:#94a3b8;min-width:120px">
            <div>Range: ${s.min} – ${s.max} ${s.unit}</div>
            <div>Trend: <span style="color:${trendColor};font-weight:700">${trendIcon} ${s.trend}</span></div>
          </div>
          ${renderSparkline(sparkVals, t.color, 80, 28)}
          <div style="min-width:80px;text-align:right">
            <div style="font-size:18px;font-weight:800;color:${isAlert ? '#ef4444' : t.color}">${typeof s.value === 'number' ? s.value.toFixed(s.type === 'gps' ? 4 : 1) : s.value}</div>
            <div style="font-size:10px;color:#94a3b8">${s.unit}</div>
          </div>
          ${isAlert ? '<span class="cc-ei-status cc-ei-status-crit">ALERT</span>' : ''}
        </div>
      `;
    }).join('');
  }

  function refreshStreams() {
    const list = document.getElementById('cc-ei-stream-list');
    if (!list) return;
    const db = initDatabase();
    // Mutate values slightly to simulate live updates
    db.streams.forEach(s => {
      if (typeof s.value === 'number') {
        const jitter = (Math.random() - 0.5) * (Math.abs(s.value) * 0.04 + 0.2);
        s.value = +(s.value + jitter).toFixed(s.type === 'gps' ? 4 : 1);
        s.ts = Date.now();
      }
    });
    list.innerHTML = renderStreamList();
  }

  // ------------------------------------------------------------------
  // 4. EDGE NODES
  // ------------------------------------------------------------------
  function renderNodes(c) {
    const db = initDatabase();
    const totalCpu = db.edgeNodes.filter(n => n.status === 'online').reduce((s, n) => s + n.cpu, 0);
    const onlineNodes = db.edgeNodes.filter(n => n.status === 'online').length;
    const avgCpu = onlineNodes ? Math.round(totalCpu / onlineNodes) : 0;
    c.innerHTML = `
      <div class="cc-ei-header">
        <h2 class="cc-ei-page-title">💻 Edge Computing Nodes <span class="cc-ei-page-badge">${db.edgeNodes.length} NODES</span></h2>
      </div>
      <div class="cc-ei-cards">
        <div class="cc-ei-card"><div class="cc-ei-card-label">Online Nodes</div><div class="cc-ei-card-value" style="color:#22c55e">${onlineNodes}/${db.edgeNodes.length}</div><div class="cc-ei-card-delta">${db.edgeNodes.filter(n=>n.status==='degraded').length} degraded</div></div>
        <div class="cc-ei-card"><div class="cc-ei-card-label">Avg CPU Load</div><div class="cc-ei-card-value" style="color:${avgCpu > 70 ? '#ef4444' : '#f97316'}">${avgCpu}%</div><div class="cc-ei-card-delta">across online nodes</div></div>
        <div class="cc-ei-card"><div class="cc-ei-card-label">Total Throughput</div><div class="cc-ei-card-value">${(db.edgeNodes.reduce((s,n)=>s+n.throughput,0)/1000).toFixed(0)}k pts/s</div></div>
        <div class="cc-ei-card"><div class="cc-ei-card-label">Deployed Models</div><div class="cc-ei-card-value" style="color:#f97316">${db.edgeNodes.reduce((s,n)=>s+n.models,0)}</div></div>
      </div>
      <div class="cc-ei-section">
        <div class="cc-ei-section-title">🌐 Edge Node Map</div>
        <div class="cc-ei-map-wrap">
          <svg class="cc-ei-map-svg" viewBox="0 0 1000 500">
            ${renderWorldMapSVG()}
            ${db.edgeNodes.map(n => {
              const x = lonToX(n.lon);
              const y = latToY(n.lat);
              const color = n.status === 'online' ? '#22c55e' : n.status === 'degraded' ? '#f97316' : '#64748b';
              const r = 6 + (n.throughput / 60000);
              return `
                <g style="cursor:pointer">
                  <circle cx="${x}" cy="${y}" r="${r+4}" fill="${color}" fill-opacity="0.15"/>
                  <circle cx="${x}" cy="${y}" r="${r}" fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="2"/>
                  <text x="${x}" y="${y - r - 4}" text-anchor="middle" fill="${color}" font-size="10" font-weight="700">${n.name.split(' ')[0]}</text>
                  <title>${n.name} — ${n.status.toUpperCase()} · ${n.cpu}% CPU · ${n.throughput} pts/s</title>
                </g>
              `;
            }).join('')}
          </svg>
        </div>
      </div>
      <div class="cc-ei-section">
        <div class="cc-ei-section-title">📋 Edge Node Status</div>
        <div class="cc-ei-scroll">
          <table class="cc-ei-table">
            <thead><tr><th>ID</th><th>Name</th><th>Country</th><th>GPU</th><th>CPU</th><th>Memory</th><th>Throughput</th><th>Latency</th><th>Models</th><th>Status</th></tr></thead>
            <tbody>
              ${db.edgeNodes.map(n => {
                const st = n.status === 'online' ? 'cc-ei-status-ok' : n.status === 'degraded' ? 'cc-ei-status-deg' : 'cc-ei-status-off';
                const cpuColor = n.cpu > 80 ? '#ef4444' : n.cpu > 60 ? '#f59e0b' : '#22c55e';
                const memColor = n.mem > 80 ? '#ef4444' : n.mem > 60 ? '#f59e0b' : '#22c55e';
                return `
                  <tr>
                    <td style="font-family:monospace;color:#f97316">${n.id}</td>
                    <td style="font-weight:700">${n.name}</td>
                    <td>${n.country}</td>
                    <td style="font-size:11px">${n.gpu}</td>
                    <td><span class="cc-ei-bar-track"><span class="cc-ei-bar-fill" style="width:${n.cpu}%;background:${cpuColor}"></span></span><span style="color:${cpuColor};font-weight:700">${n.cpu}%</span></td>
                    <td><span class="cc-ei-bar-track"><span class="cc-ei-bar-fill" style="width:${n.mem}%;background:${memColor}"></span></span><span style="color:${memColor};font-weight:700">${n.mem}%</span></td>
                    <td>${n.throughput.toLocaleString()} pts/s</td>
                    <td>${n.latency}ms</td>
                    <td>${n.models}</td>
                    <td><span class="cc-ei-status ${st}">${n.status}</span></td>
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
  // 5. ANOMALIES
  // ------------------------------------------------------------------
  function renderAnomalies(c) {
    const db = initDatabase();
    c.innerHTML = `
      <div class="cc-ei-header">
        <h2 class="cc-ei-page-title">⚠️ IoT Anomaly Log <span class="cc-ei-page-badge">${db.anomalies.length} EVENTS</span></h2>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <select class="cc-ei-input" onchange="window.__ccEI.onAnomalyFilter(this.value)">
          <option value="all" ${anomalyFilter==='all'?'selected':''}>All severities</option>
          <option value="Critical" ${anomalyFilter==='Critical'?'selected':''}>Critical only</option>
          <option value="High" ${anomalyFilter==='High'?'selected':''}>High and above</option>
          <option value="Medium" ${anomalyFilter==='Medium'?'selected':''}>Medium and above</option>
          <option value="open" ${anomalyFilter==='open'?'selected':''}>Open only</option>
        </select>
      </div>
      <div class="cc-ei-cards">
        <div class="cc-ei-card"><div class="cc-ei-card-label">Critical</div><div class="cc-ei-card-value" style="color:#ef4444">${db.anomalies.filter(a=>a.severity==='Critical').length}</div></div>
        <div class="cc-ei-card"><div class="cc-ei-card-label">High</div><div class="cc-ei-card-value" style="color:#f97316">${db.anomalies.filter(a=>a.severity==='High').length}</div></div>
        <div class="cc-ei-card"><div class="cc-ei-card-label">Medium</div><div class="cc-ei-card-value" style="color:#f59e0b">${db.anomalies.filter(a=>a.severity==='Medium').length}</div></div>
        <div class="cc-ei-card"><div class="cc-ei-card-label">Open / Resolved</div><div class="cc-ei-card-value">${db.anomalies.filter(a=>a.status==='open').length} / ${db.anomalies.filter(a=>a.status==='resolved').length}</div></div>
      </div>
      <div class="cc-ei-section">
        <div class="cc-ei-section-title">📋 Anomaly Detail Log</div>
        <div class="cc-ei-scroll">
          <table class="cc-ei-table">
            <thead><tr><th>ID</th><th>Device</th><th>Type</th><th>Severity</th><th>Reading</th><th>Description</th><th>Detected</th><th>Status</th></tr></thead>
            <tbody>
              ${db.anomalies.filter(a => {
                if (anomalyFilter === 'all') return true;
                if (anomalyFilter === 'open') return a.status === 'open';
                const rank = { Low: 1, Medium: 2, High: 3, Critical: 4 };
                return rank[a.severity] >= rank[anomalyFilter];
              }).map(a => {
                const sev = a.severity === 'Critical' ? 'cc-ei-status-crit' : a.severity === 'High' ? 'cc-ei-status-warn' : a.severity === 'Medium' ? 'cc-ei-status-deg' : 'cc-ei-status-ok';
                const st = a.status === 'open' ? 'cc-ei-status-crit' : a.status === 'investigating' ? 'cc-ei-status-warn' : 'cc-ei-status-ok';
                return `
                  <tr>
                    <td style="font-family:monospace;color:#f97316">${a.id}</td>
                    <td style="font-weight:600">${a.deviceId}</td>
                    <td>${a.type}</td>
                    <td><span class="cc-ei-status ${sev}">${a.severity}</span></td>
                    <td style="font-family:monospace;font-size:11px">${a.value}</td>
                    <td style="font-size:11px;color:#cbd5e1;max-width:340px">${a.desc}</td>
                    <td style="font-size:11px;color:#94a3b8">${formatDate(a.detected).substr(0,10)}</td>
                    <td><span class="cc-ei-status ${st}">${a.status}</span></td>
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
  // API
  // ------------------------------------------------------------------
  function open() {
    if (document.getElementById('cc-ei-overlay')) return;
    const modal = renderModal();
    document.body.appendChild(modal);
    renderContent();
    // Live updates for sensor streams
    if (liveTimer) clearInterval(liveTimer);
    liveTimer = setInterval(() => {
      if (document.getElementById('cc-ei-overlay') && currentView === 'streams') {
        refreshStreams();
      }
    }, 3000);
  }

  function close() {
    const overlay = document.getElementById('cc-ei-overlay');
    if (overlay) overlay.remove();
    if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
  }

  function setView(view) {
    currentView = view;
    renderContent();
  }

  function onDeviceFilter(f) { deviceFilter = f; const c = document.getElementById('cc-ei-content'); if (c) renderMap(c); }
  function onStreamFilter(f) { streamFilter = f; const c = document.getElementById('cc-ei-content'); if (c) renderStreams(c); }
  function onAnomalyFilter(f) { anomalyFilter = f; const c = document.getElementById('cc-ei-content'); if (c) renderAnomalies(c); }
  function onDeviceClick(id) {
    // Switch to streams view filtered by that device — simple UX
    setView('streams');
  }

  // ------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------
  function init() {
    injectStyles();
    window.__ccEI = { open, close, setView, onDeviceFilter, onStreamFilter, onAnomalyFilter, onDeviceClick };

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (document.getElementById('cc-ei-overlay')) close();
      }
    });
  }

  init();
})();
