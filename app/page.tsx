import { NavigationCard } from "@/components/ui/navigation-card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold">Welcome to the Future of Banking</h1>
        <p className="mt-2 text-muted-foreground">
          Your financial journey starts here.
        </p>
      </header>
      <main>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-4">
          <NavigationCard href="/credit" title="Structured Credit" />
          <NavigationCard href="/financing" title="Financing" />
        </div>
      </main>
    </div>
  );
}
