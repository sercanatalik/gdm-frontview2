import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Credit",
};

export default function CreditPage() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="container">
        <h1 className="text-3xl font-bold">Credit</h1>
      </div>
    </main>
  );
}
