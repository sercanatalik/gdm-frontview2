import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Test API route is working' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ 
      message: 'Test POST route is working', 
      received: body 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON' }, 
      { status: 400 }
    );
  }
}