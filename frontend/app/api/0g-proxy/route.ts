import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  return handleProxy(req);
}

export async function GET(req: NextRequest) {
  return handleProxy(req);
}

async function handleProxy(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Ensure we only proxy to http://...:5678 to prevent abuse
    if (!url.startsWith('http://') || !url.includes(':5678')) {
      return NextResponse.json({ error: 'Invalid proxy target' }, { status: 403 });
    }

    const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.blob() : undefined;
    
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      // Don't forward host and connection headers to avoid issues with target server
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'connection') {
        headers.set(key, value);
      }
    });

    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const responseBody = await response.blob();
    const responseHeaders = new Headers();
    
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });
    
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
