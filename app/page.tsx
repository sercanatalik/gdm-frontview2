import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      Loading
    </div>
  );
}
