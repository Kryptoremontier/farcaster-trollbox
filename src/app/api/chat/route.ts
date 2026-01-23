import { NextRequest, NextResponse } from 'next/server';
import { addChatMessage, getMarketChatMessages } from '~/lib/kv';

/**
 * GET /api/chat?marketId=X
 * Get chat messages for a market
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const marketId = searchParams.get('marketId');

    if (!marketId) {
      return NextResponse.json(
        { error: 'marketId is required' },
        { status: 400 }
      );
    }

    const messages = await getMarketChatMessages(parseInt(marketId), 50);
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat
 * Add a new chat message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketId, userName, userAvatar, message, fid } = body;

    if (!marketId || !userName || !userAvatar || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message too long (max 500 characters)' },
        { status: 400 }
      );
    }

    const chatMessage = await addChatMessage(
      parseInt(marketId),
      userName,
      userAvatar,
      message,
      fid
    );

    if (!chatMessage) {
      return NextResponse.json(
        { error: 'Failed to save message (Redis not configured)' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: chatMessage });
  } catch (error) {
    console.error('Error posting chat message:', error);
    return NextResponse.json(
      { error: 'Failed to post message' },
      { status: 500 }
    );
  }
}
