// Car Scout Content Script
// Runs on Facebook Marketplace pages

console.log('Car Scout loaded');

const API_URL = 'http://localhost:9876';

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getListingCount') {
    const count = countListings();
    sendResponse({ count });
  } else if (request.action === 'ripListings') {
    ripListings().then(sendResponse);
    return true; // Keep channel open for async response
  }
});

function countListings() {
  return extractListings().length;
}

async function ripListings() {
  try {
    const listings = extractListings();

    if (listings.length === 0) {
      return { success: false, error: 'No listings found on page' };
    }

    // Send to backend - POST /import expects array directly
    const response = await fetch(`${API_URL}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listings)
    });

    if (!response.ok) {
      throw new Error('Failed to send to backend');
    }

    const result = await response.json();
    return { success: true, count: result.imported || listings.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Extract the search query from the current URL or page
 * @returns {string|null}
 */
function getSearchQuery() {
  const url = new URL(window.location.href);

  // Try query param first (e.g., /marketplace/search?query=honda+civic)
  const queryParam = url.searchParams.get('query');
  if (queryParam) return queryParam;

  // Try to extract from path (e.g., /marketplace/category/vehicles)
  const pathMatch = url.pathname.match(/\/marketplace\/([^/]+)/);
  if (pathMatch && pathMatch[1] !== 'item') {
    return pathMatch[1].replace(/-/g, ' ');
  }

  return null;
}

/**
 * Parse a price string to cents
 * Examples: "$1,234" -> 123400, "Free" -> 0, "$5,000" -> 500000
 * @param {string} priceStr
 * @returns {number|null}
 */
function parsePriceToCents(priceStr) {
  if (!priceStr) return null;

  const normalized = priceStr.toLowerCase().trim();

  if (normalized === 'free') return 0;

  // Remove currency symbols and commas, extract number
  const numericStr = priceStr.replace(/[^0-9.]/g, '');
  if (!numericStr) return null;

  const dollars = parseFloat(numericStr);
  if (isNaN(dollars)) return null;

  return Math.round(dollars * 100);
}

/**
 * Extract Facebook listing ID from a URL
 * @param {string} url
 * @returns {string|null}
 */
function extractFbId(url) {
  if (!url) return null;

  // Pattern: /marketplace/item/1234567890/
  const match = url.match(/\/marketplace\/item\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Find all listing cards on the page using multiple strategies
 * Facebook's DOM changes frequently, so we try multiple approaches
 * @returns {Element[]}
 */
function findListingCards() {
  const cards = [];

  // Strategy 1: Find links to marketplace items
  // The most reliable pattern - look for <a> tags linking to /marketplace/item/
  const itemLinks = document.querySelectorAll('a[href*="/marketplace/item/"]');

  // Group by parent card - multiple links might be in the same card
  const seenIds = new Set();

  for (const link of itemLinks) {
    const fbId = extractFbId(link.href);
    if (!fbId || seenIds.has(fbId)) continue;
    seenIds.add(fbId);

    // Walk up to find the card container
    // Cards are typically 3-6 levels up from the link
    let card = link;
    for (let i = 0; i < 6; i++) {
      if (!card.parentElement) break;
      card = card.parentElement;

      // Stop at a reasonable card boundary - look for common patterns
      // Cards often have multiple children (image, title, price, location)
      if (card.children.length >= 2) {
        const hasImage = card.querySelector('img');
        const hasText = card.innerText && card.innerText.length > 10;
        if (hasImage && hasText) break;
      }
    }

    cards.push({ element: card, link: link, fbId });
  }

  return cards;
}

/**
 * Extract a usable image URL from an element or its surroundings
 * Facebook uses various lazy-loading and image delivery strategies
 * @param {Element} element
 * @param {Element} link - The original link element (image might be inside it)
 * @returns {string|null}
 */
function extractImageUrl(element, link) {
  // Strategy 1: Check inside the link element first (FB often puts image inside the <a>)
  if (link) {
    const linkImg = link.querySelector('img');
    if (linkImg && linkImg.src && isValidImageUrl(linkImg.src)) {
      return linkImg.src;
    }
  }

  // Strategy 2: Check all images in the card element
  const imgs = element.querySelectorAll('img');

  for (const img of imgs) {
    // Try various attributes Facebook might use
    const candidates = [
      img.src,
      img.getAttribute('data-src'),
      img.getAttribute('data-srcset')?.split(',')[0]?.trim()?.split(' ')[0],
      img.srcset?.split(',')[0]?.trim()?.split(' ')[0]
    ];

    for (const url of candidates) {
      if (url && isValidImageUrl(url)) {
        return url;
      }
    }
  }

  // Strategy 3: Walk up from link to find nearby images (FB might have image as sibling)
  if (link) {
    let parent = link.parentElement;
    for (let i = 0; i < 8; i++) {
      if (!parent) break;
      const img = parent.querySelector('img[src*="fbcdn.net"], img[src*="facebook.com"]');
      if (img && img.src && isValidImageUrl(img.src)) {
        return img.src;
      }
      parent = parent.parentElement;
    }
  }

  // Strategy 4: CSS background images as fallback
  const bgElements = element.querySelectorAll('[style*="background"]');
  for (const el of bgElements) {
    const style = el.getAttribute('style') || '';
    const match = style.match(/url\(["']?([^"')]+)["']?\)/);
    if (match && isValidImageUrl(match[1])) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if a URL is a valid, externally-accessible image URL
 * @param {string} url
 * @returns {boolean}
 */
function isValidImageUrl(url) {
  if (!url) return false;

  // Skip blob URLs - these won't work outside the page
  if (url.startsWith('blob:')) return false;

  // Skip data URLs that are tiny placeholders
  if (url.startsWith('data:') && url.length < 200) return false;

  // Skip empty or javascript URLs
  if (url === '' || url.startsWith('javascript:')) return false;

  // Must be http/https or a valid data URL
  return url.startsWith('http://') ||
         url.startsWith('https://') ||
         (url.startsWith('data:image') && url.length > 200);
}

/**
 * Extract listing data from a card element
 * @param {Object} cardInfo - { element, link, fbId }
 * @returns {Object|null}
 */
function extractCardData(cardInfo) {
  const { element, link, fbId } = cardInfo;

  if (!element || !fbId) return null;

  const listing = {
    fbId: fbId,
    fbUrl: link.href.split('?')[0], // Clean URL without tracking params
    title: null,
    price: null,
    location: null,
    thumbnailUrl: null,
    rippedAt: new Date().toISOString(),
    searchQuery: getSearchQuery()
  };

  // Extract image - try multiple strategies
  // Facebook uses lazy loading and various image attributes
  listing.thumbnailUrl = extractImageUrl(element, link);

  // Get all text content for parsing
  const textContent = element.innerText || '';
  const lines = textContent.split('\n').map(l => l.trim()).filter(l => l);

  // Extract price - look for $ pattern
  const priceRegex = /^\$[\d,]+$/;
  for (const line of lines) {
    if (priceRegex.test(line)) {
      listing.price = line;
      break;
    }
  }
  // Also check for "Free" listings
  if (!listing.price && lines.some(l => l.toLowerCase() === 'free')) {
    listing.price = 'Free';
  }

  // Extract title - typically the longest meaningful text that's not price or location
  // Strategy: Find text that looks like a vehicle title (year + make/model pattern)
  // or just use the longest line that isn't the price
  const vehiclePattern = /\d{4}\s+\w+/; // Year followed by make

  for (const line of lines) {
    // Skip if it's a price
    if (priceRegex.test(line) || line.toLowerCase() === 'free') continue;

    // Skip very short lines (likely labels)
    if (line.length < 5) continue;

    // Skip lines that look like locations (contain city/state pattern)
    if (/,\s*[A-Z]{2}$/.test(line)) continue;

    // Prefer lines matching vehicle pattern
    if (vehiclePattern.test(line)) {
      listing.title = line;
      break;
    }

    // Otherwise, first reasonable line becomes the title
    if (!listing.title) {
      listing.title = line;
    }
  }

  // Extract location - look for "City, ST" pattern
  const locationPattern = /^[\w\s]+,\s*[A-Z]{2}$/;
  for (const line of lines) {
    if (locationPattern.test(line)) {
      listing.location = line;
      break;
    }
  }

  // Also try to find location in aria-label
  const ariaLabel = element.getAttribute('aria-label') || link.getAttribute('aria-label');
  if (ariaLabel && !listing.location) {
    const locMatch = ariaLabel.match(/([\w\s]+,\s*[A-Z]{2})/);
    if (locMatch) listing.location = locMatch[1];
  }

  return listing;
}

/**
 * Main extraction function - finds all listings on the current page
 * Exported globally for console testing
 * @returns {Object[]}
 */
function extractListings() {
  const cards = findListingCards();
  const listings = [];

  for (const card of cards) {
    const data = extractCardData(card);
    if (data && data.fbId) {
      listings.push(data);
    }
  }

  console.log(`[Car Scout] Extracted ${listings.length} listings`);
  return listings;
}

// Export for console testing
window.extractListings = extractListings;
window.parsePriceToCents = parsePriceToCents;
