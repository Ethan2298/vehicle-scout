/**
 * Extension scaffold verification tests
 * Run with: node extension.test.js
 */

const fs = require('fs');
const path = require('path');

const EXT_DIR = __dirname;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

async function runTests() {
  const results = [];

  console.log('\n🧪 Running extension scaffold tests...\n');

  // ============ manifest.json tests ============

  let manifest;
  try {
    const content = fs.readFileSync(path.join(EXT_DIR, 'manifest.json'), 'utf8');
    manifest = JSON.parse(content);
    results.push({
      name: 'manifest.json is valid JSON',
      passed: true,
      detail: 'Parsed successfully'
    });
  } catch (err) {
    results.push({
      name: 'manifest.json is valid JSON',
      passed: false,
      detail: err.message
    });
    printResults(results);
    return;
  }

  // Manifest V3
  results.push({
    name: 'Manifest uses version 3',
    passed: manifest.manifest_version === 3,
    detail: `manifest_version: ${manifest.manifest_version}`
  });

  // Required metadata
  const hasName = manifest.name === 'Car Scout';
  const hasVersion = /^\d+\.\d+\.\d+$/.test(manifest.version);
  const hasDescription = !!manifest.description;
  results.push({
    name: 'Manifest has required metadata',
    passed: hasName && hasVersion && hasDescription,
    detail: `name: ${manifest.name}, version: ${manifest.version}`
  });

  // activeTab permission
  const hasActiveTab = manifest.permissions?.includes('activeTab');
  results.push({
    name: 'Has activeTab permission',
    passed: hasActiveTab,
    detail: `permissions: ${JSON.stringify(manifest.permissions)}`
  });

  // Host permissions
  const hostPerms = manifest.host_permissions || [];
  const hasFbPerm = hostPerms.some(p => p.includes('facebook.com/marketplace'));
  const hasLocalPerm = hostPerms.some(p => p.includes('localhost:9876'));
  results.push({
    name: 'Has host permissions for Facebook and localhost',
    passed: hasFbPerm && hasLocalPerm,
    detail: `Facebook: ${hasFbPerm}, localhost: ${hasLocalPerm}`
  });

  // Popup action
  const hasPopup = manifest.action?.default_popup === 'popup.html';
  results.push({
    name: 'Defines popup action',
    passed: hasPopup,
    detail: `default_popup: ${manifest.action?.default_popup}`
  });

  // Content script
  const cs = manifest.content_scripts?.[0];
  const csMatchesFb = cs?.matches?.some(m => m.includes('facebook.com/marketplace'));
  const csHasContentJs = cs?.js?.includes('content.js');
  results.push({
    name: 'Content script targets Marketplace',
    passed: csMatchesFb && csHasContentJs,
    detail: `matches FB: ${csMatchesFb}, has content.js: ${csHasContentJs}`
  });

  // Icons defined
  const hasIcons = manifest.icons?.['16'] && manifest.icons?.['48'] && manifest.icons?.['128'];
  results.push({
    name: 'Defines icons in three sizes',
    passed: hasIcons,
    detail: `16: ${!!manifest.icons?.['16']}, 48: ${!!manifest.icons?.['48']}, 128: ${!!manifest.icons?.['128']}`
  });

  // ============ File structure tests ============

  const requiredFiles = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'popup.css',
    'content.js',
    'icons/icon16.png',
    'icons/icon48.png',
    'icons/icon128.png'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(EXT_DIR, file);
    const exists = fs.existsSync(filePath);
    results.push({
      name: `File exists: ${file}`,
      passed: exists,
      detail: exists ? 'Found' : 'Missing'
    });
  }

  // ============ Icon validity tests ============

  for (const size of [16, 48, 128]) {
    const iconPath = path.join(EXT_DIR, 'icons', `icon${size}.png`);
    try {
      const buffer = fs.readFileSync(iconPath);
      const validPng = buffer.slice(0, 8).equals(PNG_SIGNATURE);
      results.push({
        name: `icon${size}.png is valid PNG`,
        passed: validPng,
        detail: validPng ? `${buffer.length} bytes` : 'Invalid PNG signature'
      });
    } catch (err) {
      results.push({
        name: `icon${size}.png is valid PNG`,
        passed: false,
        detail: err.message
      });
    }
  }

  // ============ popup.html tests ============

  try {
    const html = fs.readFileSync(path.join(EXT_DIR, 'popup.html'), 'utf8');

    results.push({
      name: 'popup.html references popup.css',
      passed: /href=["']popup\.css["']/.test(html),
      detail: 'Stylesheet link'
    });

    results.push({
      name: 'popup.html references popup.js',
      passed: /src=["']popup\.js["']/.test(html),
      detail: 'Script reference'
    });

    results.push({
      name: 'popup.html has rip button',
      passed: /id=["']rip-btn["']/.test(html),
      detail: 'Button element'
    });

    results.push({
      name: 'popup.html has status display',
      passed: /id=["']status["']/.test(html),
      detail: 'Status element'
    });
  } catch (err) {
    results.push({
      name: 'popup.html readable',
      passed: false,
      detail: err.message
    });
  }

  // ============ popup.js tests ============

  try {
    const js = fs.readFileSync(path.join(EXT_DIR, 'popup.js'), 'utf8');

    results.push({
      name: 'popup.js defines API_URL',
      passed: /API_URL.*localhost:9876/.test(js),
      detail: 'Backend URL configured'
    });

    results.push({
      name: 'popup.js has checkStatus function',
      passed: /async function checkStatus/.test(js),
      detail: 'Status check logic'
    });

    results.push({
      name: 'popup.js has ripListings function',
      passed: /async function ripListings/.test(js),
      detail: 'Rip logic'
    });

    results.push({
      name: 'popup.js uses chrome.tabs API',
      passed: /chrome\.tabs\.query/.test(js) && /chrome\.tabs\.sendMessage/.test(js),
      detail: 'Tab communication'
    });
  } catch (err) {
    results.push({
      name: 'popup.js readable',
      passed: false,
      detail: err.message
    });
  }

  // ============ content.js tests ============

  try {
    const js = fs.readFileSync(path.join(EXT_DIR, 'content.js'), 'utf8');

    results.push({
      name: 'content.js logs "Car Scout loaded"',
      passed: /console\.log.*Car Scout loaded/.test(js),
      detail: 'Load indicator'
    });

    results.push({
      name: 'content.js defines API_URL',
      passed: /API_URL.*localhost:9876/.test(js),
      detail: 'Backend URL configured'
    });

    results.push({
      name: 'content.js listens for messages',
      passed: /chrome\.runtime\.onMessage\.addListener/.test(js),
      detail: 'Message listener'
    });

    results.push({
      name: 'content.js handles getListingCount',
      passed: /getListingCount/.test(js),
      detail: 'Count action'
    });

    results.push({
      name: 'content.js handles ripListings',
      passed: /ripListings/.test(js),
      detail: 'Rip action'
    });

    results.push({
      name: 'content.js has extractListings function',
      passed: /function extractListings/.test(js),
      detail: 'DOM parser'
    });

    results.push({
      name: 'content.js has parsePriceToCents function',
      passed: /function parsePriceToCents/.test(js),
      detail: 'Price parser'
    });

    results.push({
      name: 'content.js has extractFbId function',
      passed: /function extractFbId/.test(js),
      detail: 'ID extractor'
    });

    results.push({
      name: 'content.js POSTs to /import',
      passed: /fetch\(`\${API_URL}\/import`/.test(js),
      detail: 'Import endpoint'
    });

    results.push({
      name: 'content.js exports extractListings to window',
      passed: /window\.extractListings\s*=/.test(js),
      detail: 'Console access'
    });
  } catch (err) {
    results.push({
      name: 'content.js readable',
      passed: false,
      detail: err.message
    });
  }

  printResults(results);
}

function printResults(results) {
  console.log('─'.repeat(50));
  let passCount = 0;
  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    passCount += result.passed ? 1 : 0;
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.detail}`);
  }
  console.log('─'.repeat(50));
  console.log(`\n${passCount}/${results.length} tests passed\n`);

  process.exit(passCount === results.length ? 0 : 1);
}

runTests();
