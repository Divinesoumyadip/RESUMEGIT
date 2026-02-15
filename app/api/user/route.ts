import { currentUser } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

// Initialize Prisma directly inside this file
const prisma = new PrismaClient();

async function syncUserInternal() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  // Sync logic for your Singapore-based Supabase instance
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
    console.error('Final isolation sync error:', error);
    return NextResponse.json({ error: 'Sync Failed' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
