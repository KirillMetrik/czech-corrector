type Model = "gpt-4o-mini" | "gpt-5-mini" | "gpt-5-nano";

interface Settings {
    apiKey: string;
    model: Model;
    debug: boolean;
}

const DEFAULTS: Settings = {
    apiKey: "",
    model: "gpt-4o-mini",
    debug: false
};

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "cz-correct",
        title: "Correct Czech (AI)",
        contexts: ["selection"]
    });
    log("[CZC] onInstalled: context menu created");
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "cz-correct") return;
    const selectedText = (info.selectionText ?? "").trim();
    if (!selectedText) return;

    const settings = await loadSettings();
    if (!settings.apiKey) {
        if (tab?.id) {
            await chrome.tabs.sendMessage(tab.id, { type: "CZC_TOAST", message: "Open options and set your OpenAI API key." });
        }
        chrome.runtime.openOptionsPage();
        return;
    }

    if (selectedText.length > 8000) {
        if (tab?.id) {
            await chrome.tabs.sendMessage(tab.id, { type: "CZC_TOAST", message: "Selection too long (~8k char limit)." });
        }
        return;
    }

    try {
        if (tab?.id) await chrome.tabs.sendMessage(tab.id, { type: "CZC_WORKING_START" });
        if (tab?.id) await chrome.tabs.sendMessage(tab.id, { type: "CZC_TOAST", message: `Calling OpenAI (${settings.model})…` });

        const corrected = await callOpenAI(settings.apiKey, settings.model, selectedText, settings.debug);

        if (tab?.id) {
            await chrome.tabs.sendMessage(tab.id, {
                type: "CZC_REPLACE_SELECTION",
                original: selectedText,
                corrected
            });
            await chrome.tabs.sendMessage(tab.id, { type: "CZC_TOAST", message: "Text corrected." });
        }
    } catch (e: any) {
        const msg = `Error: ${e?.message ?? String(e)}`;
        log("[CZC] error", msg);
        if (tab?.id) await chrome.tabs.sendMessage(tab.id, { type: "CZC_TOAST", message: msg });
    } finally {
        if (tab?.id) await chrome.tabs.sendMessage(tab.id, { type: "CZC_WORKING_END" });
    }
});

async function callOpenAI(apiKey: string, model: Model, text: string, debug: boolean): Promise<string> {
    const system = "Jsi korektor češtiny. Oprav gramatiku, interpunkci a styl. Zachovej význam. Vrať pouze opravený text bez komentářů.";
    const body = {
        model,
        messages: [
            { role: "system", content: system },
            { role: "user", content: text }
        ],
        temperature: 0.2
    };

    debug && log("[CZC] fetch body", body);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const raw = await res.text();
    debug && log("[CZC] raw response", raw);

    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${raw}`);

    const data = JSON.parse(raw);
    const answer: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("No content returned from OpenAI.");
    return answer;
}

async function loadSettings(): Promise<Settings> {
    const obj = await chrome.storage.sync.get(DEFAULTS);
    return { ...DEFAULTS, ...obj } as Settings;
}

function log(...args: any[]) {
    // service worker console (visible via chrome://extensions → Inspect service worker)
    console.log(...args);
}
