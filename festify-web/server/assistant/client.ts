import Anthropic from '@anthropic-ai/sdk';

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string | any[];
}

export interface LLMToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface LLMToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface LLMResponse {
  text: string;
  toolCalls: LLMToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMClient {
  generate(params: {
    systemPrompt: string;
    messages: LLMMessage[];
    tools?: LLMToolDefinition[];
  }): Promise<LLMResponse>;
}

/**
 * Production Anthropic Client wrapping @anthropic-ai/sdk
 */
export class AnthropicLLMClient implements LLMClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is not configured in environment variables');
    }
    this.client = new Anthropic({ apiKey: key });
    this.model = model || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  }

  async generate(params: {
    systemPrompt: string;
    messages: LLMMessage[];
    tools?: LLMToolDefinition[];
  }): Promise<LLMResponse> {
    const toolsParam: Anthropic.Tool[] | undefined = params.tools?.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema as Anthropic.Tool.InputSchema,
    }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      system: params.systemPrompt,
      messages: params.messages as Anthropic.MessageParam[],
      tools: toolsParam && toolsParam.length > 0 ? toolsParam : undefined,
    });

    let text = '';
    const toolCalls: LLMToolCall[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        text += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: (block.input || {}) as Record<string, any>,
        });
      }
    }

    return {
      text,
      toolCalls,
      usage: {
        inputTokens: response.usage.input_tokens || 0,
        outputTokens: response.usage.output_tokens || 0,
      },
    };
  }
}

/**
 * Deterministic Mock LLM Client for testing, CI, and offline evaluation
 */
export class MockLLMClient implements LLMClient {
  private handlers: Array<
    (params: { systemPrompt: string; messages: LLMMessage[]; tools?: LLMToolDefinition[] }) =>
      | LLMResponse
      | Promise<LLMResponse>
  > = [];

  constructor(
    handlers?: Array<
      (params: { systemPrompt: string; messages: LLMMessage[]; tools?: LLMToolDefinition[] }) =>
        | LLMResponse
        | Promise<LLMResponse>
    >
  ) {
    if (handlers) {
      this.handlers = [...handlers];
    }
  }

  addHandler(
    handler: (params: {
      systemPrompt: string;
      messages: LLMMessage[];
      tools?: LLMToolDefinition[];
    }) => LLMResponse | Promise<LLMResponse>
  ) {
    this.handlers.push(handler);
  }

  clearHandlers() {
    this.handlers = [];
  }

  async generate(params: {
    systemPrompt: string;
    messages: LLMMessage[];
    tools?: LLMToolDefinition[];
  }): Promise<LLMResponse> {
    if (this.handlers.length > 0) {
      const handler = this.handlers.shift()!;
      return await handler(params);
    }

    const lastMsg = params.messages[params.messages.length - 1];
    const availableToolNames = params.tools?.map((t) => t.name) || [];

    // If the latest message contains tool results, generate final natural language answer
    if (
      Array.isArray(lastMsg?.content) &&
      lastMsg.content.some((c: any) => c.type === 'tool_result')
    ) {
      const results = lastMsg.content
        .filter((c: any) => c.type === 'tool_result')
        .map((c: any) => c.content)
        .join(' ');
      return {
        text: `Based on the latest data: ${results.slice(0, 300)}... Is there anything else you would like to know?`,
        toolCalls: [],
        usage: { inputTokens: 50, outputTokens: 40 },
      };
    }

    const textContent =
      typeof lastMsg?.content === 'string'
        ? lastMsg.content
        : JSON.stringify(lastMsg?.content || '');

    // Intent routing for mock testing
    // 1. ADMIN: list_registrations_for_event (check before generic stats)
    if (
      availableToolNames.includes('list_registrations_for_event') &&
      /list registrations|who registered/i.test(textContent)
    ) {
      const eventIdMatch = textContent.match(/event\s*(?:#|id)?\s*(\d+)/i);
      return {
        text: 'Fetching registration attendee list...',
        toolCalls: [
          {
            id: 'mock-call-regs',
            name: 'list_registrations_for_event',
            input: { eventId: eventIdMatch ? parseInt(eventIdMatch[1], 10) : 1 },
          },
        ],
        usage: { inputTokens: 45, outputTokens: 25 },
      };
    }

    // 2. ADMIN: draft_announcement (check before generic draft)
    if (
      availableToolNames.includes('draft_announcement') &&
      /announcement|notification|broadcast|urgent/i.test(textContent)
    ) {
      return {
        text: 'Composing festival alert announcement...',
        toolCalls: [
          {
            id: 'mock-call-announcement',
            name: 'draft_announcement',
            input: { update_type: 'reminder', key_details: textContent },
          },
        ],
        usage: { inputTokens: 50, outputTokens: 30 },
      };
    }

    // 3. ADMIN: draft_event_description
    if (
      availableToolNames.includes('draft_event_description') &&
      /draft|generate event|create event|event details/i.test(textContent)
    ) {
      return {
        text: 'Drafting your event details...',
        toolCalls: [
          {
            id: 'mock-call-draft',
            name: 'draft_event_description',
            input: { bullet_points: textContent },
          },
        ],
        usage: { inputTokens: 50, outputTokens: 30 },
      };
    }

    // 4. ADMIN: get_my_events_stats
    if (
      availableToolNames.includes('get_my_events_stats') &&
      /stats|registrations|attendance|how many|fill rate|checked in|overview/i.test(textContent)
    ) {
      const eventIdMatch = textContent.match(/event\s*(?:#|id)?\s*(\d+)/i);
      return {
        text: 'Checking your event analytics...',
        toolCalls: [
          {
            id: 'mock-call-stats',
            name: 'get_my_events_stats',
            input: eventIdMatch ? { eventId: parseInt(eventIdMatch[1], 10) } : {},
          },
        ],
        usage: { inputTokens: 45, outputTokens: 25 },
      };
    }

    // 5. STUDENT: plan_my_day (check before generic passes/registrations)
    if (
      availableToolNames.includes('plan_my_day') &&
      /plan|itinerary|schedule|sessions can I attend|conflict-free/i.test(textContent)
    ) {
      return {
        text: 'Building a conflict-free itinerary for your festival day...',
        toolCalls: [
          {
            id: 'mock-call-plan',
            name: 'plan_my_day',
            input: {},
          },
        ],
        usage: { inputTokens: 45, outputTokens: 30 },
      };
    }

    // 6. STUDENT: locate_zone
    if (
      availableToolNames.includes('locate_zone') &&
      /where is|locate|venue|stage|zone/i.test(textContent)
    ) {
      const zoneMatch = textContent.match(/(?:where is|locate)\s+(?:the\s+)?([a-zA-Z0-9\s]+?)(?:\s+located|\s+on|\s+venue|\?|$)/i);
      const name = zoneMatch ? zoneMatch[1].trim() : 'Auditorium';
      return {
        text: `Locating ${name} on the campus venue map...`,
        toolCalls: [
          {
            id: 'mock-call-locate',
            name: 'locate_zone',
            input: { name },
          },
        ],
        usage: { inputTokens: 40, outputTokens: 25 },
      };
    }

    // 7. STUDENT: get_my_registrations
    if (
      availableToolNames.includes('get_my_registrations') &&
      /pass|ticket|registered|my registrations|check-in status/i.test(textContent)
    ) {
      return {
        text: 'Checking your registered passes and tickets...',
        toolCalls: [
          {
            id: 'mock-call-my-passes',
            name: 'get_my_registrations',
            input: {},
          },
        ],
        usage: { inputTokens: 40, outputTokens: 25 },
      };
    }

    // 8. STUDENT: search_events
    if (
      availableToolNames.includes('search_events') &&
      /search|find|looking for|hackathon/i.test(textContent)
    ) {
      const query = textContent.replace(/search for|find|looking for/gi, '').trim() || 'tech';
      return {
        text: `Searching festival events for "${query}"...`,
        toolCalls: [
          {
            id: 'mock-call-search',
            name: 'search_events',
            input: { query },
          },
        ],
        usage: { inputTokens: 40, outputTokens: 25 },
      };
    }

    // 9. STUDENT: list_events
    if (
      availableToolNames.includes('list_events') &&
      /events|what's on|show events|upcoming|workshops|seats/i.test(textContent)
    ) {
      return {
        text: 'Fetching upcoming festival events...',
        toolCalls: [
          {
            id: 'mock-call-list',
            name: 'list_events',
            input: {},
          },
        ],
        usage: { inputTokens: 40, outputTokens: 25 },
      };
    }

    // Default conversational response
    return {
      text: 'Hello! I am your Festify assistant. How can I assist you with events, registrations, or festival navigation today?',
      toolCalls: [],
      usage: { inputTokens: 30, outputTokens: 20 },
    };
  }
}

let activeClient: LLMClient | null = null;

export function getLLMClient(): LLMClient {
  if (activeClient) return activeClient;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return new AnthropicLLMClient();
    } catch {
      return new MockLLMClient();
    }
  }
  return new MockLLMClient();
}

export function setLLMClient(client: LLMClient | null) {
  activeClient = client;
}
