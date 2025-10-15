// simple toast
(function injectToast() {
    const el = document.createElement("div");
    el.id = "czc_toast";
    Object.assign(el.style, {
        position: "fixed",
        zIndex: "2147483647",
        bottom: "16px",
        right: "16px",
        padding: "10px 12px",
        background: "rgba(0,0,0,0.8)",
        color: "white",
        borderRadius: "8px",
        font: "13px system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        display: "none"
    } as CSSStyleDeclaration);

    document.documentElement.appendChild(el);

    let timer: number | undefined;
    function show(msg: string) {
        el.textContent = msg;
        el.style.display = "block";
        window.clearTimeout(timer);
        timer = window.setTimeout(() => (el.style.display = "none"), 2500);
    }

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "CZC_TOAST") show(String(msg.message ?? ""));
    });
})();

function replaceInTextControl(el: HTMLInputElement | HTMLTextAreaElement, newText: string): boolean {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start == null || end == null) return false;

    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    el.value = before + newText + after;

    const caret = before.length + newText.length;
    el.setSelectionRange(caret, caret);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
}

function replaceInContentEditable(newText: string): boolean {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(newText));

    // move caret to end
    sel.removeAllRanges();
    const endRange = document.createRange();
    const node = range.endContainer;
    const length = (node.nodeType === Node.TEXT_NODE) ? (node.textContent?.length ?? 0) : node.childNodes.length;
    endRange.setStart(node, length);
    endRange.collapse(true);
    sel.addRange(endRange);

    (document.activeElement as HTMLElement | null)?.dispatchEvent(new Event("input", { bubbles: true }));
    (document.activeElement as HTMLElement | null)?.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
}

let workingOverlay: HTMLDivElement | null = null;
function showWorking(on: boolean) {
    if (on) {
        if (!workingOverlay) {
            workingOverlay = document.createElement("div");
            Object.assign(workingOverlay.style, {
                position: "fixed",
                inset: "0",
                zIndex: "2147483646",
                pointerEvents: "none",
                display: "grid",
                placeItems: "center"
            } as CSSStyleDeclaration);
            workingOverlay.innerHTML = `<div style="background: rgba(0,0,0,.6); color:#fff; padding:10px 14px; border-radius:10px">Correcting…</div>`;
            document.documentElement.appendChild(workingOverlay);
        }
        workingOverlay.style.display = "grid";
    } else if (workingOverlay) {
        workingOverlay.style.display = "none";
    }
}

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "CZC_WORKING_START") showWorking(true);
    if (msg.type === "CZC_WORKING_END") showWorking(false);

    if (msg.type === "CZC_REPLACE_SELECTION") {
        const corrected: string = msg.corrected ?? "";
        const active = document.activeElement as HTMLElement | null;

        // try inputs/textareas first
        const isTextControl =
            active instanceof HTMLTextAreaElement ||
            (active instanceof HTMLInputElement && /text|search|url|tel|email|password/.test(active.type));

        let done = false;
        if (isTextControl && active) {
            done = replaceInTextControl(active as HTMLInputElement | HTMLTextAreaElement, corrected);
        }

        // then contenteditable
        if (!done) {
            const isEditable = !!active && (active.isContentEditable || active.getAttribute("contenteditable") === "true");
            if (isEditable) {
                done = replaceInContentEditable(corrected);
            }
        }

        // as a last resort, try selection range directly
        if (!done) {
            done = replaceInContentEditable(corrected);
        }

        if (!done) {
            navigator.clipboard?.writeText(corrected).catch(() => { });
            chrome.runtime.sendMessage({ type: "CZC_TOAST", message: "Couldn’t replace in place. Copied to clipboard." });
        }
    }
});
