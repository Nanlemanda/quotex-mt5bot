# Quotex MT5 Bot 🤖

A Chrome extension that automatically executes trades on Quotex based on signals from MetaTrader 5 (MT5).

## Features

✅ **WebSocket Connection to MT5** - Receive real-time trading signals from MT5 indicators  
✅ **Auto-Click PUT/CALL** - Automatically clicks trade buttons on Quotex  
✅ **No Credentials Needed** - Works on already-logged-in Quotex account  
✅ **Signal Management** - Configurable host/port for MT5 connection  
✅ **Trade Logging** - View recent trades in the popup  
✅ **Easy Configuration** - Simple UI for setup

## Installation

### 1. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this repository folder

### 2. Set Up MT5 Signal Sender

You need a script or indicator in MT5 that sends signals via WebSocket. Here's a basic example:

```python
# Python example using MetaTrader5 library
import MetaTrader5 as mt5
import websocket
import json
import time

ws = websocket.WebSocketApp(
    "ws://localhost:5555",
    on_message=on_message,
    on_error=on_error,
    on_close=on_close
)

def send_signal(signal_type, asset, duration=60):
    signal = {
        "type": signal_type,  # "CALL" or "PUT"
        "asset": asset,
        "duration": duration,
        "timestamp": time.time()
    }
    ws.send(json.dumps(signal))

# Example: Send signal when indicator triggers
if indicator_condition_met:
    send_signal("CALL", "EURUSD", 60)
```

## Configuration

1. **Open the extension popup** (click the extension icon)
2. **Enter MT5 Host** (default: `localhost`)
3. **Enter Port** (default: `5555`)
4. **Toggle "Enable Auto Trading"**
5. **Click "Connect"**

## How It Works

```
MT5 Indicator
    ↓
    └─→ WebSocket Signal
        ↓
        └─→ Extension Background Script
            ↓
            └─→ Content Script (on Quotex page)
                ↓
                └─→ Auto-Click PUT/CALL Button
```

## Signal Format

The extension expects signals in JSON format:

```json
{
  "type": "CALL",
  "asset": "EURUSD",
  "duration": 60,
  "amount": 10
}
```

### Required Fields
- `type` (string): `"CALL"` or `"PUT"`

### Optional Fields
- `asset` (string): Trading instrument
- `duration` (number): Trade duration in seconds
- `amount` (number): Trade amount

## Troubleshooting

### Connection Status is "disconnected"
- Check that MT5 WebSocket server is running
- Verify host and port are correct
- Look at Chrome console for error messages

### Trades not executing
- Ensure Quotex page is open and logged in
- Check browser console for button selector errors
- Try updating button selectors in `src/content-script.js`

### Console Debugging
- Open Chrome DevTools (F12)
- Look for logs starting with `[Quotex Bot]` or `[MT5 Bot]`

## Button Selectors

If trades don't execute, you may need to update button selectors in `src/content-script.js`:

```javascript
const BotConfig = {
  putButtonSelectors: [
    'button[class*="put"]',
    'button[data-action="put"]',
    // Add your custom selectors here
  ],
  callButtonSelectors: [
    'button[class*="call"]',
    'button[data-action="call"]',
    // Add your custom selectors here
  ]
};
```

**To find the correct selectors:**
1. Right-click the PUT button on Quotex
2. Select "Inspect" or "Inspect Element"
3. Copy the relevant class names or data attributes
4. Add to the selectors array

## Development

### Project Structure

```
quotex-mt5bot/
├── manifest.json          # Extension configuration
├── src/
│   ├── background.js      # MT5 connection handler
│   ├── content-script.js  # Quotex page interactions
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styling
│   └── popup.js           # Popup interactions
└── README.md
```

### Making Changes

1. Edit the files
2. Go to `chrome://extensions/`
3. Click the refresh icon for this extension
4. Changes should be reflected immediately

## Safety & Disclaimer

⚠️ **IMPORTANT**: This bot executes trades automatically. Use at your own risk!

- Start with small trade amounts
- Test with a demo account first
- Monitor the bot's trades regularly
- Set stop-loss limits in MT5 indicator

## License

MIT License - Free to use and modify

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review console logs
3. Update button selectors if needed

---

**Happy Trading! 📈**
