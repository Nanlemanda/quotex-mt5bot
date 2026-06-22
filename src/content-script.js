/**
 * Content Script
 * Executes on Quotex page to interact with trading interface
 */

console.log('[Quotex Bot] Content script STARTING...');

// Check if we have access to chrome API
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('[Quotex Bot] ✅ Chrome API available');
} else {
  console.log('[Quotex Bot] ⚠️ Chrome API NOT available - content script may not be injected');
}

const BotConfig = {
  // UP/CALL button: contains <span class="oQ4Z4">Up</span>
  upButtonSelectors: [
    'button.KtjVk.JQZcs._5qIw.LzVPu',
    'button:has(> span.oQ4Z4:contains("Up"))',
    'button.JQZcs:first-of-type'
  ],
  // DOWN/PUT button: contains <span class="oQ4Z4">Down</span>
  downButtonSelectors: [
    'button.KtjVk.twQq3._5qIw.LzVPu',
    'button:has(> span.oQ4Z4:contains("Down"))',
    'button.twQq3:first-of-type'
  ],
  tradeDelayMs: 100,
  retryAttempts: 3
};

console.log('[Quotex Bot] Content script loaded');

// Helper function to find button by text content
function findButtonByText(text) {
  const buttons = document.querySelectorAll('button');
  for (let btn of buttons) {
    const spans = btn.querySelectorAll('span.oQ4Z4');
    for (let span of spans) {
      if (span.textContent.trim() === text) {
        return btn;
      }
    }
  }
  return null;
}

// Log all buttons on the page for debugging
console.log('[Quotex Bot] Debugging: Found', document.querySelectorAll('button').length, 'total buttons');

// Try to find UP and DOWN buttons by text
const upBtn = findButtonByText('Up');
const downBtn = findButtonByText('Down');
console.log('[Quotex Bot] UP button found by text:', upBtn ? '✅ YES' : '❌ NO');
console.log('[Quotex Bot] DOWN button found by text:', downBtn ? '✅ YES' : '❌ NO');

// Listen for signals from background script
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'executeSignal') {
      console.log('[Quotex Bot] Signal received:', request.signal);
      executeTradeSignal(request.signal);
      sendResponse({ success: true });
    }
  });
  console.log('[Quotex Bot] Message listener registered');
} else {
  console.log('[Quotex Bot] ❌ Could not register message listener - chrome.runtime unavailable');
}

/**
 * Execute trade signal on Quotex
 */
async function executeTradeSignal(signal) {
  try {
    const { type, asset, duration, amount } = signal;
    
    console.log(`[Quotex Bot] Executing ${type} trade for ${asset}`);
    
    // Click the appropriate button
    const success = await clickTradeButton(type);
    
    if (success) {
      console.log(`[Quotex Bot] ${type} button clicked successfully`);
      logTradeExecution(signal);
    } else {
      console.warn(`[Quotex Bot] Failed to click ${type} button`);
    }
  } catch (error) {
    console.error('[Quotex Bot] Error executing signal:', error);
  }
}

/**
 * Click UP or DOWN button
 */
async function clickTradeButton(tradeType) {
  const isCall = tradeType.toUpperCase() === 'CALL' || tradeType.toUpperCase() === 'UP';
  const targetText = isCall ? 'Up' : 'Down';
  
  console.log(`[Quotex Bot] Looking for button with text: "${targetText}"`);
  
  for (let attempt = 0; attempt < BotConfig.retryAttempts; attempt++) {
    // Try to find button by text content (most reliable)
    const button = findButtonByText(targetText);
    
    if (button && isVisible(button)) {
      console.log(`[Quotex Bot] Found ${targetText} button by text search`);
      
      // Simulate user click
      button.click();
      
      // Also dispatch mouse events for better compatibility
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      
      await sleep(BotConfig.tradeDelayMs);
      return true;
    }
    
    // Wait before retry
    if (attempt < BotConfig.retryAttempts - 1) {
      console.log(`[Quotex Bot] Attempt ${attempt + 1} failed, retrying...`);
      await sleep(100);
    }
  }
  
  console.warn(`[Quotex Bot] Could not find ${targetText} button after ${BotConfig.retryAttempts} attempts`);
  return false;
}

/**
 * Check if element is visible
 */
function isVisible(element) {
  return element.offsetParent !== null && 
         element.offsetHeight !== 0 && 
         element.offsetWidth !== 0 &&
         window.getComputedStyle(element).display !== 'none';
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Log trade execution for debugging
 */
function logTradeExecution(signal) {
  const timestamp = new Date().toISOString();
  const log = {
    timestamp,
    type: signal.type,
    asset: signal.asset,
    duration: signal.duration,
    status: 'executed'
  };
  
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['tradeLogs'], (result) => {
      let logs = result.tradeLogs || [];
      logs.push(log);
      // Keep only last 100 trades
      logs = logs.slice(-100);
      chrome.storage.local.set({ tradeLogs: logs });
    });
  }
}

// Make global functions available for manual testing
window.botTestCall = () => executeTradeSignal({ type: 'CALL' });
window.botTestPut = () => executeTradeSignal({ type: 'PUT' });
window.botFindUpButton = () => findButtonByText('Up');
window.botFindDownButton = () => findButtonByText('Down');
console.log('[Quotex Bot] Test functions available:');
console.log('  - window.botTestCall() : Execute CALL signal');
console.log('  - window.botTestPut() : Execute PUT signal');
console.log('  - window.botFindUpButton() : Find UP button');
console.log('  - window.botFindDownButton() : Find DOWN button');
