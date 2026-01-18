import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
      <SignIn />
    </div>
  );
}
