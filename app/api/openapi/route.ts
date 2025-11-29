import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/openapi
 * Serve OpenAPI YAML specification
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'openapi.yaml');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-yaml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load OpenAPI specification' },
      { status: 500 }
    );
  }
}
