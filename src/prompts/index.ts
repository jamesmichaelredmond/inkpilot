import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDesignLogoPrompt } from "./design-logo";
import { registerDesignIconPrompt } from "./design-icon";
import { registerDesignBadgePrompt } from "./design-badge";
import { registerDesignBannerPrompt } from "./design-banner";

export function registerAllPrompts(server: McpServer) {
    registerDesignLogoPrompt(server);
    registerDesignIconPrompt(server);
    registerDesignBadgePrompt(server);
    registerDesignBannerPrompt(server);
}
