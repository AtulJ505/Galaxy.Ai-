import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import WorkflowCanvas from "@/components/WorkflowCanvas";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#0a0a0a]">
      <WorkflowCanvas />
    </main>
  );
}
