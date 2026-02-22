/**
 * Lightweight creative nudge injected into design prompts.
 * The concrete SVG reference examples in each prompt do the heavy lifting —
 * this just reminds the AI to make a deliberate choice before building.
 */

export function getCreativeNudge(): string {
    return `Before calling any tools, briefly decide: What's the visual concept? Pick 2-3 specific hex colors and a font with personality (Georgia, Palatino, Trebuchet MS, Century Gothic, Courier New — not Arial/Helvetica/Inter).`;
}
