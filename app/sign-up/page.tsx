import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <SignUp 
        appearance={{
          variables: { colorPrimary: '#f59e0b' },
        }}
      />
    </div>
  );
}