// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get the last user message (most recent one)
  const lastMessage = messages[messages.length - 1];

  // Extract text from AI SDK message format
  let userMessage = '';
  if (typeof lastMessage.content === 'string') {
    userMessage = lastMessage.content;
  } else if (lastMessage.parts) {
    // Handle parts format from @ai-sdk/react
    userMessage = lastMessage.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('');
  }

  // Generate a unique thread ID for each message to avoid tool call state issues
  // The backend will handle conversation context internally
  const threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  console.log('Sending message:', userMessage);
  console.log('Thread ID:', threadId);

  const payload = {
    message: userMessage,
    thread_id: threadId,
    stream: true,
  };

  // Use streaming endpoint
  const response = await fetch('http://localhost:3030/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Backend error:', errorText);
    throw new Error(`API error: ${response.statusText} - ${errorText}`);
  }

  // Transform backend SSE stream to AI SDK v5 format
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const messageId = `msg_${Date.now()}`;

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      // Send text-start event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'text-start', id: messageId })}\n\n`)
      );

      try {
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (!data) continue;

              try {
                const parsed = JSON.parse(data);
                console.log('Parsed chunk:', parsed);
                // Handle error responses
                if (parsed.error) {
                  console.error('Backend error:', parsed.error);
                  controller.error(new Error(parsed.error));
                  return;
                }

                // Check if done
                if (parsed.done) {
                  continue;
                }

                // Extract chunk from backend format
                const chunk = parsed.chunk || '';

                if (chunk) {
                  // Send as text-delta event
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'text-delta', id: messageId, delta: chunk })}\n\n`)
                  );
                }
              } catch (e) {
                console.error('Parse error:', e, 'Line:', line);
              }
            }
          }
        }

        // Send text-end event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'text-end', id: messageId })}\n\n`)
        );
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      } finally {
        // Send [DONE] marker
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
