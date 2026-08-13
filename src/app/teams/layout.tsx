import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Management",
  description: "View, generate, and edit volleyball teams",
};

export default function TeamsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        </div>
      </header>
      <main className="flex-1 flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}