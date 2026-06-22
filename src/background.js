/**
 * Background Service Worker
 * Handles MT5 WebSocket connection and signal processing
 */

let mt5WebSocket = null;
let mt5Config = {
  enabled: false,
  host: 'localhost',
  port: 5555,
  autoTrade: true
};

// Load configuration from storage
chrome.storage.local.get(['mt5Config'], (result) => {
  if (result.mt5Config) {
    mt5Config = result.mt5Config;
  }
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateConfig') {
    mt5Config = request.config;
    chrome.storage.local.set({ mt5Config });
    sendResponse({ success: true, message: 'Configuration updated' });
    
    if (mt5Config.enabled) {
      connectToMT5();
    } else {
      disconnectMT5();
    }
  }
  
  if (request.action === 'getConfig') {
    sendResponse(mt5Config);
  }
  
  if (request.action === 'sendSignal') {
    // Forward signal from MT5 to content script on Quotex page
    broadcastSignal(request.signal);
    sendResponse({ success: true });
  }
});

/**
 * Connect to MT5 via WebSocket
 */
function connectToMT5() {
  if (mt5WebSocket) return; // Already connected
  
  try {
    const wsUrl = `ws://${mt5Config.host}:${mt5Config.port}`;
    console.log(`[MT5 Bot] Connecting to MT5 at ${wsUrl}`);
    
    mt5WebSocket = new WebSocket(wsUrl);
    
    mt5WebSocket.onopen = () => {
      console.log('[MT5 Bot] Connected to MT5');
      chrome.storage.local.set({ connectionStatus: 'connected' });
    };
    
    mt5WebSocket.onmessage = (event) => {
      handleMT5Signal(event.data);
    };
    
    mt5WebSocket.onerror = (error) => {
      console.error('[MT5 Bot] WebSocket error:', error);
      chrome.storage.local.set({ connectionStatus: 'error' });
    };
    
    mt5WebSocket.onclose = () => {
      console.log('[MT5 Bot] Disconnected from MT5');
      mt5WebSocket = null;
      chrome.storage.local.set({ connectionStatus: 'disconnected' });
      
      // Attempt to reconnect in 5 seconds
      if (mt5Config.enabled) {
        setTimeout(connectToMT5, 5000);
      }
    };
  } catch (error) {
    console.error('[MT5 Bot] Connection error:', error);
    chrome.storage.local.set({ connectionStatus: 'error' });
  }
}

/**
 * Disconnect from MT5
 */
function disconnectMT5() {
  if (mt5WebSocket) {
    mt5WebSocket.close();
    mt5WebSocket = null;
  }
}

/**
 * Handle signals from MT5
 */
function handleMT5Signal(data) {
  try {
    const signal = JSON.parse(data);
    console.log('[MT5 Bot] Signal received:', signal);
    
    // Validate signal format
    if (signal.type && (signal.type === 'PUT' || signal.type === 'CALL')) {
      if (mt5Config.autoTrade) {
        broadcastSignal(signal);
      }
    }
  } catch (error) {
    console.error('[MT5 Bot] Error parsing signal:', error);
  }
}

/**
 * Broadcast signal to all Quotex tabs
 */
function broadcastSignal(signal) {
  chrome.tabs.query({ url: '*://quotex.io/*' }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'executeSignal',
        signal: signal
      }).catch(err => console.log('Tab not ready:', err));
    });
  });
}

// Connect on startup if enabled
chrome.runtime.onStartup.addListener(() => {
  if (mt5Config.enabled) {
    connectToMT5();
  }
});
