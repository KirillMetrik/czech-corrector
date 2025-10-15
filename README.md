# 🇨🇿 Czech Corrector (AI)

A friendly Chrome Extension that helps you instantly correct Czech text in any text field — powered by OpenAI.

Right-click → **Correct Czech (AI)** → get clean, natural Czech grammar and spelling within a second.
All processing happens through your **own OpenAI API key**, so you stay in control of your data.

---

## ✨ Features

- 🪄 **Right-click correction** — select any text and instantly fix grammar, punctuation, and style
- 🧠 **Powered by OpenAI** — use `gpt-4o-mini`, `gpt-5-mini`, or `gpt-5-nano`
- 💬 **Friendly UI** — minimal toast notifications and progress overlay
- ⚙️ **Simple settings page** — store your API key and choose a model
- 🔒 **Privacy-first** — your text is sent only to `api.openai.com`, never to any other server

---

## 🧩 How It Works

1. The **background service worker** adds a context-menu item: “Correct Czech (AI)”.
2. When clicked, it sends the selected text to the **OpenAI Chat Completions API**.
3. The **content script** receives the corrected text and replaces your selection in place.
4. The **options page** stores your API key and preferred model in Chrome Sync storage.

---

## 🛠️ Development Setup

### 1. Clone & install
```bash
git clone https://github.com/<your-username>/czech-corrector.git
cd czech-corrector
npm install
```

### 2. Run the build
```bash
npm run build
```

### 3. Load in Chrome
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder
5. You’ll see “Czech Corrector (AI)” appear in your toolbar.

## ⚙️ Project Structure
```
czech-corrector/
├─ src/
│  ├─ background.ts     # Service worker - context menu & API calls
│  ├─ content.ts        # Runs inside web pages - replaces text
│  └─ options.ts        # Options page logic
├─ public/
│  ├─ manifest.json     # Declares permissions & scripts
│  └─ icons/            # Icon set (16, 32, 128 px)
├─ options.html         # Settings page UI
├─ vite.config.ts       # Build config (Vite + Rollup)
├─ tsconfig.json
└─ package.json

```

## 🧪 Debugging Tips
| Context        | How to open DevTools                                                  |
| -------------- | --------------------------------------------------------------------- |
| Background     | `chrome://extensions` → *Inspect service worker*                      |
| Content script | Right-click the target page → *Inspect* → *Sources → Content scripts* |
| Options page   | Open the Options page → *Ctrl+Shift+I*                                |

## 🔒 Privacy Policy

The extension processes **only the text you select.**
* Your selected text is securely sent to OpenAI’s API (api.openai.com) to generate corrections.
* No data is logged, stored, or transmitted elsewhere.
* Your OpenAI API key is stored locally using chrome.storage.sync.