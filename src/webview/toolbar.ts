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

const SAVE_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
  <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3m3-10H5V5h10z"/>
</svg>`;

const SAVE_AS_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
  <path d="M21 12.4V7l-4-4H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h7.4zM15 15c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3M6 6h9v4H6zm13.99 10.25 1.77 1.77L16.77 23H15v-1.77zm3.26.26-.85.85-1.77-1.77.85-.85c.2-.2.51-.2.71 0l1.06 1.06c.2.2.2.52 0 .71"/>
</svg>`;

const EXPORT_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
  <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
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
