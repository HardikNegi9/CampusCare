import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For client-side authentication, we'll handle redirects in the components
  // Middleware can't access localStorage, so we'll skip authentication checks
  // and let the client components handle the authentication state
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login']
};
