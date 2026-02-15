import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Only the landing page and Stripe are public. 
  // Everything else is protected by the Swarm.
  publicRoutes: ["/", "/api/webhooks/stripe"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
