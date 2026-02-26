// ──────────────────────────────────────────────
// PlotGuardian AI — OpenRouter API Integration
// ──────────────────────────────────────────────

const OPENROUTER_API_KEY = "sk-or-v1-dxchgbnkmjlera87tgpwil5bt hlksgrek";
const OPENROUTER_MODEL = "deepseek/deepseek-chat";

// Direct OpenRouter endpoint. (CORS proxies often strip Authorization headers causing 401s).
// Note: If this fails in the browser, 99% of the time it is because an Adblocker (uBlock, Brave Shields) is blocking 'openrouter.ai'.
// FIX: We use Vite's local proxy to tunnel the request and bypass adblockers locally!
const API_URL = import.meta.env.DEV
    ? "/api/openrouter/api/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";

// Simple message format used by AIAssistant
export interface ChatHistoryMessage {
    role: "user" | "ai";
    content: string;
}

// OpenRouter / OpenAI-compatible format
interface OpenRouterMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

/**
 * Send a message to OpenRouter (DeepSeek).
 * @param history      Previous messages in { role: "user"|"ai", content } format
 * @param systemPrompt The full system prompt (including injected plot data)
 */
export async function sendToGemini(
    history: ChatHistoryMessage[],
    systemPrompt: string
): Promise<string> {

    // Guard: truncate system prompt if it would exceed ~12k chars to avoid body-too-large issues
    const safeSystem = systemPrompt.length > 12000
        ? systemPrompt.slice(0, 12000) + "\n...[truncated for length]"
        : systemPrompt;

    const messages: OpenRouterMessage[] = [
        { role: "system", content: safeSystem },
        // Keep only last 10 history messages to stay within token limits
        ...history.slice(-10).map(m => ({
            role: (m.role === "ai" ? "assistant" : "user") as "user" | "assistant",
            content: m.content,
        })),
    ];

    let response: Response;
    try {
        response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://plotguardian.app",
                "X-Title": "PlotGuardian AI",
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages,
                temperature: 0.5,
                max_tokens: 1024,
            }),
        });
    } catch (networkErr: unknown) {
        let msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
        if (msg.includes("Failed to fetch")) {
            msg += " (Blocked by Adblocker or CORS. Please disable Brave Shields/uBlock Origin for this site to allow OpenRouter API calls).";
        }
        throw new Error(`Network error: ${msg}`);
    }

    // Read body text regardless of status so we can show a useful error
    const bodyText = await response.text();

    if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
            const parsed = JSON.parse(bodyText) as { error?: { message?: string } };
            errMsg = parsed?.error?.message ?? bodyText.slice(0, 200);
        } catch { errMsg = bodyText.slice(0, 200); }
        throw new Error(`OpenRouter API error: ${errMsg}`);
    }

    let data: { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
    try {
        data = JSON.parse(bodyText);
    } catch {
        throw new Error(`Invalid JSON response: ${bodyText.slice(0, 200)}`);
    }

    if (data.error?.message) throw new Error(data.error.message);

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
        console.error("OpenRouter Full Response:", data);
        throw new Error(`Empty response from OpenRouter API. Raw data: ${JSON.stringify(data).slice(0, 300)}`);
    }
    return text;
}

// Legacy compatibility
export type GeminiMessage = ChatHistoryMessage;
export function toGeminiHistory(messages: ChatHistoryMessage[]): ChatHistoryMessage[] {
    return messages;
}
