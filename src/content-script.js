/**
 * Content Script
 * Executes on Quotex page to interact with trading interface
 */

const BotConfig = {
  putButtonSelectors: [
    'button[class*="put"]',
    'button[data-action="put"]',
    '[aria-label*="Put"]',
    '.put-btn',
    '#putBtn'
  ],
  callButtonSelectors: [
    'button[class*="call"]',
    'button[data-action="call"]',
    '[aria-label*="Call"]',
    '.call-btn',
    '#callBtn'
  ],
  tradeDelayMs: 100,
  retryAttempts: 3
};

console.log('[Quotex Bot] Content script loaded');

// Listen for signals from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'executeSignal') {
    console.log('[Quotex Bot] Signal received:', request.signal);
    executeTradeSignal(request.signal);
    sendResponse({ success: true });
  }
});

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
 * Click PUT or CALL button
 */
async function clickTradeButton(tradeType) {
  const selectors = tradeType.toUpperCase() === 'CALL' 
    ? BotConfig.callButtonSelectors 
    : BotConfig.putButtonSelectors;
  
  for (let attempt = 0; attempt < BotConfig.retryAttempts; attempt++) {
    for (const selector of selectors) {
      const button = document.querySelector(selector);
      
      if (button && isVisible(button)) {
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
    }
    
    // Wait before retry
    await sleep(100);
  }
  
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
  
  chrome.storage.local.get(['tradeLogs'], (result) => {
    let logs = result.tradeLogs || [];
    logs.push(log);
    // Keep only last 100 trades
    logs = logs.slice(-100);
    chrome.storage.local.set({ tradeLogs: logs });
  });
}
