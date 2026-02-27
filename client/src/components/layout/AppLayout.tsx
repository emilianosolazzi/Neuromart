import { Navbar } from "./Navbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="border-t border-zinc-900 py-8 text-center text-zinc-600 text-sm">
        <p>© {new Date().getFullYear()} Neuromart. Intelligence on demand.</p>
      </footer>
    </div>
  );
}
