// Force Update: v2
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from './db';

export async function syncUser() {
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
