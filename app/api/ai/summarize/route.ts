import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const { text } = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      prompt: `Please provide a concise summary of the following content. Focus on the key points and main findings. Keep the summary clear and professional, suitable for an email report.

Content to summarize:
${content}

Please format your summary in markdown.`,
    });

    return NextResponse.json({ summary: text });
  } catch (error) {
    console.error('Error in summarize API:', error);
    return NextResponse.json(
      { error: 'Failed to summarize content' },
      { status: 500 }
    );
  }
}
