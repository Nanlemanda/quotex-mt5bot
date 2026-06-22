/**
 * Popup Script
 * Handles UI interactions and configuration
 */

const elements = {
  hostInput: document.getElementById('hostInput'),
  portInput: document.getElementById('portInput'),
  enableToggle: document.getElementById('enableToggle'),
  autoTradeToggle: document.getElementById('autoTradeToggle'),
  connectBtn: document.getElementById('connectBtn'),
  connectionStatus: document.getElementById('connectionStatus'),
  statusIndicator: document.getElementById('statusIndicator'),
  tradesList: document.getElementById('tradesList')
};

let currentConfig = {};

// Load configuration on popup open
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  updateTradesList();
  watchConnectionStatus();
});

/**
 * Load configuration from storage
 */
function loadConfig() {
  chrome.storage.local.get(['mt5Config'], (result) => {
    if (result.mt5Config) {
      currentConfig = result.mt5Config;
      elements.hostInput.value = currentConfig.host || 'localhost';
      elements.portInput.value = currentConfig.port || 5555;
      elements.enableToggle.checked = currentConfig.enabled || false;
      elements.autoTradeToggle.checked = currentConfig.autoTrade !== false;
    }
  });
}

/**
 * Save configuration and connect
 */
elements.connectBtn.addEventListener('click', () => {
  const config = {
    host: elements.hostInput.value,
    port: parseInt(elements.portInput.value),
    enabled: elements.enableToggle.checked,
    autoTrade: elements.autoTradeToggle.checked
  };

  chrome.runtime.sendMessage(
    { action: 'updateConfig', config },
    (response) => {
      if (response.success) {
        showStatus('Configuration saved!', 'success');
        currentConfig = config;
      }
    }
  );
});

/**
 * Watch connection status
 */
function watchConnectionStatus() {
  setInterval(() => {
    chrome.storage.local.get(['connectionStatus'], (result) => {
      const status = result.connectionStatus || 'disconnected';
      updateStatusUI(status);
    });
  }, 1000);
}

/**
 * Update status indicator
 */
function updateStatusUI(status) {
  elements.statusIndicator.className = 'status-indicator ' + status;
  elements.connectionStatus.textContent = `Status: ${status.toUpperCase()}`;
}

/**
 * Show status message
 */
function showStatus(message, type) {
  elements.connectionStatus.textContent = message;
  elements.connectionStatus.className = 'status-text ' + type;
  
  setTimeout(() => {
    elements.connectionStatus.textContent = '';
    elements.connectionStatus.className = 'status-text';
  }, 3000);
}

/**
 * Update trades list
 */
function updateTradesList() {
  chrome.storage.local.get(['tradeLogs'], (result) => {
    const logs = result.tradeLogs || [];
    const recentTrades = logs.slice(-5).reverse();
    
    elements.tradesList.innerHTML = '';
    
    if (recentTrades.length === 0) {
      elements.tradesList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px 0;">No trades yet</p>';
      return;
    }
    
    recentTrades.forEach(trade => {
      const item = document.createElement('div');
      item.className = 'trade-item';
      
      const time = new Date(trade.timestamp).toLocaleTimeString();
      const typeClass = trade.type.toLowerCase();
      
      item.innerHTML = `
        <span class="trade-type ${typeClass}">${trade.type}</span>
        <span>${trade.asset}</span>
        <span class="trade-time">${time}</span>
      `;
      
      elements.tradesList.appendChild(item);
    });
  });
  
  // Refresh every 2 seconds
  setTimeout(updateTradesList, 2000);
}
