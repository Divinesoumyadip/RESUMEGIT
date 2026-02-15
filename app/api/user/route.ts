import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

async function syncUserInternal() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const existingUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existingUser) return existingUser;

  return await prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0].emailAddress,
      credits: 10,
    },
  });
}

export async function GET() {
  try {
    const user = await syncUserInternal();
    return NextResponse.json({ credits: user?.credits || 0 });
  } catch (error) {
    console.error('Credit sync error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
