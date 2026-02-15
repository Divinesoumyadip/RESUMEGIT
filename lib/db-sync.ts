import { currentUser } from '@clerk/nextjs/server';
import { prisma } from './db';

export async function syncUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) return null;

  // Check if user already exists in Supabase
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existingUser) return existingUser;

  // If not, create them with their 10 starting credits
  const newUser = await prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0].emailAddress,
      credits: 10,
    },
  });

  return newUser;
}
