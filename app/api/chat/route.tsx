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
  };
  console.log('Request payload:', JSON.stringify(payload));

  // Use non-streaming endpoint since streaming has a backend bug
  const response = await fetch('http://localhost:3030/chat', {
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

  const data = await response.json();
  // console.log('Response:', data);

  const responseText = data.response || data.message || '';

  // Use SSE format for AI SDK v5
  const encoder = new TextEncoder();
  const messageId = `msg_${Date.now()}`;

  const stream = new ReadableStream({
    async start(controller) {
      // Send text-start event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'text-start', id: messageId })}\n\n`)
      );

      // Send text in chunks as text-delta events
      const chunkSize = 5; // characters per chunk
      for (let i = 0; i < responseText.length; i += chunkSize) {
        const chunk = responseText.slice(i, i + chunkSize);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'text-delta', id: messageId, delta: chunk })}\n\n`)
        );
        // console.log('Sending chunk:', chunk);
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Send text-end event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'text-end', id: messageId })}\n\n`)
      );

      // Send [DONE] marker
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
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
