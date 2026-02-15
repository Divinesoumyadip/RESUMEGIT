import { db } from './db';
import { auth, currentUser } from '@clerk/nextjs/server';

export const syncUser = async () => {
  const user = await currentUser();
  if (!user) return null;

  const existingUser = await db.user.findUnique({
    where: { clerkId: user.id }
  });

  if (!existingUser) {
    return await db.user.create({
      data: {
        clerkId: user.id,
        email: user.emailAddresses[0].emailAddress,
        credits: 10
      }
    });
  }

  return existingUser;
};
