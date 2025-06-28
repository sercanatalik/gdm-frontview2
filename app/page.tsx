import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold">Welcome to the Future of Banking</h1>
        <p className="text-muted-foreground mt-2">Your financial journey starts here.</p>
      </header>
      <main>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <Link href="/credit">
            <div className="dark bg-card p-6 rounded-lg shadow-lg hover:shadow-1xl transition-shadow duration-300 cursor-pointer aspect-square flex flex-col items-center justify-center text-center">
              <h2 className="text-1xl font-semibold text-card-foreground">Credit</h2>
            </div>
          </Link>
          <Link href="/financing">
            <div className="dark bg-card p-6 rounded-lg shadow-lg hover:shadow-1xl transition-shadow duration-300 cursor-pointer aspect-square flex flex-col items-center justify-center text-center">
              <h2 className="text-1xl font-semibold text-card-foreground">Financing</h2>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
