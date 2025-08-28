import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Since we're using localStorage for tokens, 
    // logout is mainly handled on the frontend
    // This endpoint can be used for logging purposes
    
    return NextResponse.json({ 
      message: 'Logout successful' 
    }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
