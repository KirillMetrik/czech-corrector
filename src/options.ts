const apiKeyEl = document.getElementById("apiKey") as HTMLInputElement;
const modelEl = document.getElementById("model") as HTMLSelectElement;
const debugEl = document.getElementById("debug") as HTMLInputElement;
const outEl = document.getElementById("out") as HTMLPreElement;

interface Settings {
    apiKey: string;
    model: "gpt-4o-mini" | "gpt-5-mini" | "gpt-5-nano";
    debug: boolean;
}

const DEFAULT_SETTINGS: Settings = { apiKey: "", model: "gpt-4o-mini", debug: false };

(async function init() {
    const s = (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Settings;
    apiKeyEl.value = s.apiKey ?? "";
    modelEl.value = s.model ?? "gpt-4o-mini";
    debugEl.checked = !!s.debug;
})();

document.getElementById("save")!.addEventListener("click", async () => {
    const s: Settings = {
        apiKey: apiKeyEl.value.trim(),
        model: (modelEl.value as Settings["model"]) ?? "gpt-4o-mini",
        debug: debugEl.checked
    };
    await chrome.storage.sync.set(s);
    outEl.textContent = "Saved.";
});

document.getElementById("test")!.addEventListener("click", async () => {
    outEl.textContent = "Testing…";
    const apiKey = apiKeyEl.value.trim();
    const model = modelEl.value || "gpt-4o-mini";
    if (!apiKey) {
        outEl.textContent = "Enter your API key first.";
        return;
    }
    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: "Say: Nastavení proběhlo úspěšně." }
                ],
                temperature: 0
            })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(JSON.stringify(json));
        outEl.textContent = "Success: " + (json.choices?.[0]?.message?.content ?? "");
    } catch (e: any) {
        outEl.textContent = "Error: " + (e?.message ?? String(e));
    }
});
