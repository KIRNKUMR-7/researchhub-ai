// ──────────────────────────────────────────────
// PlotGuardian AI — OpenRouter API Integration
// ──────────────────────────────────────────────

const OPENROUTER_API_KEY = "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";
const OPENROUTER_MODEL = "google/gemini-2.0-flash-001"; // Free & fast on OpenRouter
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Simple message format used throughout the app
export interface ChatHistoryMessage {
    role: "user" | "ai";
    content: string;
}

interface ORMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

/**
 * Send a message to OpenRouter using the OpenAI-compatible chat completions API.
 * @param history      Previous messages in { role: "user"|"ai", content } format
 * @param systemPrompt Full system prompt (including injected live plot data)
 */
export async function sendToGemini(
    history: ChatHistoryMessage[],
    systemPrompt: string
): Promise<string> {

    // Truncate system prompt if it would exceed ~12k chars
    const safeSystem = systemPrompt.length > 12000
        ? systemPrompt.slice(0, 12000) + "\n...[truncated for length]"
        : systemPrompt;

    // Build OpenAI-compatible messages array
    const messages: ORMessage[] = [
        { role: "system", content: safeSystem },
        // Last 10 history messages to stay within context limits
        ...history.slice(-10).map(m => ({
            role: (m.role === "ai" ? "assistant" : "user") as "user" | "assistant",
            content: m.content,
        })),
    ];

    let response: Response;
    try {
        response = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://plotguardian.in",
                "X-Title": "ResearchHub AI",
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages,
                temperature: 0.5,
                max_tokens: 1024,
            }),
        });
    } catch (networkErr: unknown) {
        const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
        throw new Error(`Network error: ${msg}`);
    }

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
        throw new Error(`Empty response from OpenRouter. Raw: ${JSON.stringify(data).slice(0, 300)}`);
    }

    return text;
}

// Legacy compatibility
export type GeminiMessage = ChatHistoryMessage;
export function toGeminiHistory(messages: ChatHistoryMessage[]): ChatHistoryMessage[] {
    return messages;
}
