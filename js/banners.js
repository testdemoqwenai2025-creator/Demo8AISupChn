// ====================================================================
// banners.js — Injects left/right vertical banners into every page
// ====================================================================
// Left banner:  Project Vision
// Right banner: Insightful Thoughts
// Banners are fixed-position, vertically centered, and responsive
// (hidden on screens narrower than 1400px to avoid overlapping content)
// ====================================================================
(function() {
  'use strict';

  // Only inject once
  if (document.getElementById('banner-vision-left')) return;

  // Detect if we're in a subdirectory (cc-app/) to adjust paths
  var inSubdir = window.location.pathname.indexOf('/cc-app') !== -1;
  var prefix = inSubdir ? '../' : '/Demo8AISupChn/';

  // Mark the body so CSS can hide banners on cc-app pages (full-screen
  // dashboard where fixed banners obstruct the sidebar and main content).
  if (inSubdir) {
    document.body.classList.add('cc-app-page');
  }

  // Banner configuration
  var banners = [
    {
      id: 'banner-vision-left',
      src: prefix + 'assets/banners/banner-vision-left.png',
      alt: 'Project Vision — AI-powered global supply chain intelligence',
      side: 'left',
      label: 'PROJECT VISION',
      caption: 'AI-Powered Global Supply Chain Intelligence'
    },
    {
      id: 'banner-insights-right',
      src: prefix + 'assets/banners/banner-insights-right.png',
      alt: 'Insightful Thoughts — Predictive analytics and risk intelligence',
      side: 'right',
      label: 'INSIGHTFUL THOUGHTS',
      caption: 'Predictive Analytics & Risk Intelligence'
    }
  ];

  // Inject CSS
  var style = document.createElement('style');
  style.textContent = [
    '.side-banner {',
    '  position: fixed;',
    '  top: 50%;',
    '  transform: translateY(-50%);',
    '  width: 120px;',
    '  height: 480px;',
    '  z-index: 9998;',
    '  pointer-events: auto;',
    '  border-radius: 8px;',
    '  overflow: hidden;',
    '  box-shadow: 0 4px 24px rgba(0,0,0,0.3);',
    '  transition: opacity 0.3s ease, transform 0.3s ease;',
    '}',
    '.side-banner img {',
    '  width: 100%;',
    '  height: 100%;',
    '  object-fit: cover;',
    '  display: block;',
    '}',
    '.side-banner .banner-label {',
    '  position: absolute;',
    '  bottom: 0;',
    '  left: 0;',
    '  right: 0;',
    '  padding: 8px 6px;',
    '  background: linear-gradient(transparent, rgba(0,0,0,0.85));',
    '  color: #fff;',
    '  font-size: 9px;',
    '  font-weight: 700;',
    '  letter-spacing: 1px;',
    '  text-transform: uppercase;',
    '  text-align: center;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '}',
    '.side-banner .banner-caption {',
    '  position: absolute;',
    '  top: 0;',
    '  left: 0;',
    '  right: 0;',
    '  padding: 10px 6px 8px;',
    '  background: linear-gradient(rgba(0,0,0,0.7), transparent);',
    '  color: #e2e8f0;',
    '  font-size: 8px;',
    '  font-weight: 600;',
    '  letter-spacing: 0.5px;',
    '  text-align: center;',
    '  line-height: 1.3;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '}',
    '.side-banner.left  { left: 12px; }',
    '.side-banner.right { right: 12px; }',
    '@media (max-width: 1399px) {',
    '  .side-banner { display: none; }',
    '}',
    '@media (min-width: 1400px) and (max-width: 1699px) {',
    '  .side-banner { width: 90px; height: 360px; }',
    '}',
    '@media (min-width: 1700px) {',
    '  .side-banner { width: 130px; height: 520px; }',
    '}',
    '.side-banner:hover {',
    '  opacity: 0.92;',
    '  transform: translateY(-50%) scale(1.02);',
    '}',
    '/* Hide banners on cc-app pages — it is a full-screen dashboard',
    '   where fixed banners obstruct the sidebar and main content. */',
    'body.cc-app-page .side-banner { display: none !important; }'
  ].join('\n');
  document.head.appendChild(style);

  // Inject banner elements
  banners.forEach(function(banner) {
    var div = document.createElement('div');
    div.className = 'side-banner ' + banner.side;
    div.id = banner.id;

    var img = document.createElement('img');
    img.src = banner.src;
    img.alt = banner.alt;
    img.loading = 'lazy';

    var caption = document.createElement('div');
    caption.className = 'banner-caption';
    caption.textContent = banner.caption;

    var label = document.createElement('div');
    label.className = 'banner-label';
    label.textContent = banner.label;

    div.appendChild(img);
    div.appendChild(caption);
    div.appendChild(label);
    document.body.appendChild(div);
  });

  console.log('[banners.js] Injected 2 vertical banners (vision-left, insights-right)');
})();
