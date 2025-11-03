import { NextResponse } from 'next/server';
import { setScan } from '@/lib/scanStore';

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: Request) {
  try {
    // Parse the incoming JSON data
    const specData = await request.json();
    
    // Log the incoming request
    console.log('=== INCOMING SCAN REQUEST ===');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('Body:', JSON.stringify(specData, null, 2));

    // Validate the required fields
    if (!specData.Brand || !specData.Model || !specData.CPU) {
      console.error('Missing required fields');
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Missing required fields',
          required: ['Brand', 'Model', 'CPU']
        },
        { status: 400 }
      );
    }

    // Generate a unique ID for this PC
    const pcId = `scan_${Date.now()}`;
    
    // Store the scan data using the shared store
    await setScan(pcId, {
      ...specData,
      createdAt: new Date().toISOString(),
      status: 'pending',
      Scan_Time: new Date().toISOString()
    });

    console.log(`✅ Scan saved with ID: ${pcId}`);
    
    // Create the response object with the expected format
    const response = {
      status: 'ok' as const,
      message: 'PC specifications received successfully',
      pc_id: pcId,  // Make sure this is at the root level
      data: {
        ...specData,
        pc_id: pcId  // Also include in data for backward compatibility
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('Returning success response:', JSON.stringify(response, null, 2));
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Scan-ID': pcId,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('❌ Error processing request:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
