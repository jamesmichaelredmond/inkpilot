/**
 * Test script to verify all MCP prompts are registered and return correct content.
 * Run with: node test-prompts.mjs
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/mcp-stdio.js"],
    env: { ...process.env, MCPSVG_PORT: "0" },
});

const client = new Client({ name: "test-runner", version: "1.0" });
await client.connect(transport);

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
    if (condition) {
        console.log(`  PASS  ${label}`);
        passed++;
    } else {
        console.log(`  FAIL  ${label}${detail ? " — " + detail : ""}`);
        failed++;
    }
}

// 1. List all prompts
console.log("\n=== Listing Prompts ===");
const { prompts } = await client.listPrompts();
const promptNames = prompts.map((p) => p.name);
console.log("Registered prompts:", promptNames.join(", "));

const expected = ["design-logo", "design-icon", "design-badge", "design-banner", "design-graphic"];
for (const name of expected) {
    check(`"${name}" is registered`, promptNames.includes(name));
}

// 2. List resources
console.log("\n=== Listing Resources ===");
const { resources } = await client.listResources();
for (const r of resources) {
    console.log(`  Resource: ${r.name} (${r.uri})`);
}
check("svg-design-guidelines resource exists", resources.some((r) => r.name === "svg-design-guidelines"));

// 3. Read the guidelines resource and check for new sections
console.log("\n=== Reading Guidelines Resource ===");
const guidelinesRes = await client.readResource({ uri: "mcpsvg://guidelines/svg-design" });
const guidelinesText = guidelinesRes.contents[0].text;
check("Section 11: Aesthetic Quality Standards", guidelinesText.includes("Aesthetic Quality Standards"));
check("Section 12: Common Aesthetic Failures", guidelinesText.includes("Common Aesthetic Failures"));
check("Century Gothic in guidelines", guidelinesText.includes("Century Gothic"));
check("Anti-pattern: navy+gold", guidelinesText.includes("Navy #0f172a + gold/amber"));
check("feTurbulence technique", guidelinesText.includes("feTurbulence"));

// 4. Test design-logo prompt
console.log("\n=== Testing design-logo Prompt ===");
const logoResult = await client.getPrompt({
    name: "design-logo",
    arguments: { company_name: "TestCo", industry: "tech" },
});
const logoText = logoResult.messages[0].content.text;
check("Logo: no philosophy preamble", !logoText.includes("AESTHETIC DIRECTION"));
check("Logo: has Century Gothic", logoText.includes("Century Gothic"));
check("Logo: has build process", logoText.includes("svg_create"));
check("Logo: includes company name", logoText.includes("TestCo"));
check("Logo: includes industry", logoText.includes("tech"));

// 5. Test design-icon prompt
console.log("\n=== Testing design-icon Prompt ===");
const iconResult = await client.getPrompt({
    name: "design-icon",
    arguments: { concept: "lightning bolt" },
});
const iconText = iconResult.messages[0].content.text;
check("Icon: no philosophy preamble", !iconText.includes("AESTHETIC DIRECTION"));
check("Icon: has default color #1e293b", iconText.includes("Color: #1e293b"));
check("Icon: has build process", iconText.includes("svg_create"));
check("Icon: has construction principles", iconText.includes("Grid alignment"));
check("Icon: includes concept", iconText.includes("lightning bolt"));

// 6. Test design-badge prompt
console.log("\n=== Testing design-badge Prompt ===");
const badgeResult = await client.getPrompt({
    name: "design-badge",
    arguments: { title: "Excellence Award" },
});
const badgeText = badgeResult.messages[0].content.text;
check("Badge: no philosophy preamble", !badgeText.includes("AESTHETIC DIRECTION"));
check("Badge: defaults to circle shape", badgeText.includes("Shape: circle"));
check("Badge: has color combos", badgeText.includes("deep plum + warm copper"));
check("Badge: has build process", badgeText.includes("svg_create"));
check("Badge: includes title", badgeText.includes("Excellence Award"));

// 7. Test design-badge with explicit shape (should use that shape)
console.log("\n=== Testing design-badge with explicit shape ===");
const badgeShieldResult = await client.getPrompt({
    name: "design-badge",
    arguments: { title: "Security", shape: "shield" },
});
const badgeShieldText = badgeShieldResult.messages[0].content.text;
check("Badge+shield: uses shield guide", badgeShieldText.includes("shield/crest shape"));
check("Badge+shield: shows Shape: shield", badgeShieldText.includes("Shape: shield"));

// 8. Test design-banner prompt
console.log("\n=== Testing design-banner Prompt ===");
const bannerResult = await client.getPrompt({
    name: "design-banner",
    arguments: { heading: "Launch Day", purpose: "website-hero" },
});
const bannerText = bannerResult.messages[0].content.text;
check("Banner: no philosophy preamble", !bannerText.includes("AESTHETIC DIRECTION"));
check("Banner: has bold background guidance", bannerText.includes("Bold commitment to a single rich color"));
check("Banner: mentions feTurbulence for patterns", bannerText.includes("feTurbulence"));
check("Banner: typography has personality guidance", bannerText.includes("Georgia for authority"));
check("Banner: has concrete font in button example", bannerText.includes("Trebuchet MS"));

// 9. Test design-graphic prompt (the general-purpose one)
console.log("\n=== Testing design-graphic Prompt ===");
const graphicResult = await client.getPrompt({
    name: "design-graphic",
    arguments: { description: "a logo for a coffee shop called Ember", style: "warm maximalism" },
});
const graphicText = graphicResult.messages[0].content.text;
check("Graphic: has Step 0 (classify)", graphicText.includes("Classify the Artifact"));
check("Graphic: has Step 1 (design thinking)", graphicText.includes("Design Thinking"));
check("Graphic: has Step 2 (anti-patterns)", graphicText.includes("Anti-Pattern Checklist"));
check("Graphic: has Step 3 (tools)", graphicText.includes("Build With These Tools"));
check("Graphic: has Step 4 (techniques)", graphicText.includes("SVG Creative Techniques"));
check("Graphic: has Step 5 (review)", graphicText.includes("Review Before Finishing"));
check("Graphic: includes user description", graphicText.includes("coffee shop called Ember"));
check("Graphic: includes requested style", graphicText.includes("warm maximalism"));
check("Graphic: has font recommendations", graphicText.includes("Georgia"));
check("Graphic: has anti-Inter guidance", graphicText.includes("invisible fonts"));

// Summary
console.log("\n=== Summary ===");
console.log(`${passed} passed, ${failed} failed, ${passed + failed} total`);

await client.close();
process.exit(failed > 0 ? 1 : 0);
