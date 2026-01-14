import { Navbar } from "@/components/navigation/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-[1600px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
