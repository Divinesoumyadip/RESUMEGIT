import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <SignIn 
        appearance={{
          variables: { colorPrimary: '#f59e0b' }, // Matches your Amber theme
        }}
      />
    </div>
  );
}