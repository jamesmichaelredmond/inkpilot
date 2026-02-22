interface VsCodeApi {
    postMessage(message: unknown): void;
}

export function initToolbar(vscode: VsCodeApi) {
    // Hide the legacy top toolbar — replaced by floating action bar
    const toolbar = document.getElementById("toolbar")!;
    toolbar.style.display = "none";

    buildActionBar(vscode);
}

// ── Floating action bar ──────────────────────────────────────────────

const SAVE_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12.5 14H3.5C3.10218 14 2.72064 13.842 2.43934 13.5607C2.15804 13.2794 2 12.8978 2 12.5V3.5C2 3.10218 2.15804 2.72064 2.43934 2.43934C2.72064 2.15804 3.10218 2 3.5 2H10.5L14 5.5V12.5C14 12.8978 13.842 13.2794 13.5607 13.5607C13.2794 13.842 12.8978 14 12.5 14Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11 14V9H5V14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 2V5.5H9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const SAVE_AS_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12.5 14H3.5C3.1 14 2.72 13.842 2.44 13.561C2.16 13.279 2 12.898 2 12.5V3.5C2 3.1 2.16 2.72 2.44 2.44C2.72 2.16 3.1 2 3.5 2H10.5L14 5.5V12.5C14 12.898 13.842 13.279 13.561 13.561C13.279 13.842 12.898 14 12.5 14Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 8L14 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M13 7L13 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;

const EXPORT_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 10V12.5C14 12.8978 13.842 13.2794 13.5607 13.5607C13.2794 13.842 12.8978 14 12.5 14H3.5C3.10218 14 2.72064 13.842 2.43934 13.5607C2.15804 13.2794 2 12.8978 2 12.5V10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 6.5L8 3.5L11 6.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 3.5V10.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function buildActionBar(vscode: VsCodeApi) {
    const container = document.getElementById("canvas-container")!;

    const bar = document.createElement("div");
    bar.className = "action-bar";

    bar.appendChild(
        makeActionBtn(SAVE_ICON, "Save Project", () =>
            vscode.postMessage({ type: "save" })
        )
    );
    bar.appendChild(
        makeActionBtn(SAVE_AS_ICON, "Save As...", () =>
            vscode.postMessage({ type: "saveAs" })
        )
    );
    bar.appendChild(
        makeActionBtn(EXPORT_ICON, "Export SVG", () =>
            vscode.postMessage({ type: "export" })
        )
    );

    container.appendChild(bar);
}

function makeActionBtn(
    iconHtml: string,
    title: string,
    onClick: () => void
): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.title = title;
    btn.innerHTML = iconHtml;
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onClick();
    });
    return btn;
}
