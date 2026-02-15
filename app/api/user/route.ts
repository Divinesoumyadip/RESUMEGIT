import { syncUser } from '@/lib/db-sync';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await syncUser();
    return NextResponse.json({ credits: user?.credits || 0 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
