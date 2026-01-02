const statusEl = document.getElementById('status');
const statusText = document.getElementById('status-text');
const pageInfo = document.getElementById('page-info');
const listingCount = document.getElementById('listing-count');
const ripBtn = document.getElementById('rip-btn');
const resultEl = document.getElementById('result');

const API_URL = 'http://localhost:9876';

async function checkStatus() {
  // Check if we're on Facebook Marketplace
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isMarketplace = tab?.url?.includes('facebook.com/marketplace');

  if (!isMarketplace) {
    statusEl.className = 'status disconnected';
    statusText.textContent = 'Not on Marketplace';
    ripBtn.disabled = true;
    return;
  }

  // Check if backend is running
  try {
    const response = await fetch(`${API_URL}/api/health`);
    if (response.ok) {
      statusEl.className = 'status on-marketplace';
      statusText.textContent = 'Ready to rip';
      pageInfo.classList.remove('hidden');
      ripBtn.disabled = false;

      // Ask content script for listing count
      requestListingCount(tab.id);
    } else {
      throw new Error('Backend not responding');
    }
  } catch (err) {
    statusEl.className = 'status disconnected';
    statusText.textContent = 'Backend offline';
    ripBtn.disabled = true;
  }
}

async function requestListingCount(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'getListingCount' });
    if (response?.count !== undefined) {
      listingCount.textContent = `${response.count} listing${response.count !== 1 ? 's' : ''} detected`;
    }
  } catch (err) {
    listingCount.textContent = 'Scanning page...';
  }
}

async function ripListings() {
  ripBtn.disabled = true;
  ripBtn.textContent = 'Ripping...';
  resultEl.classList.add('hidden');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'ripListings' });

    if (response?.success) {
      resultEl.className = 'result success';
      resultEl.textContent = `Sent ${response.count} listing${response.count !== 1 ? 's' : ''} to Car Scout`;
      resultEl.classList.remove('hidden');
    } else {
      throw new Error(response?.error || 'Failed to rip listings');
    }
  } catch (err) {
    resultEl.className = 'result error';
    resultEl.textContent = err.message;
    resultEl.classList.remove('hidden');
  } finally {
    ripBtn.disabled = false;
    ripBtn.textContent = 'Rip Listings';
  }
}

ripBtn.addEventListener('click', ripListings);
checkStatus();
