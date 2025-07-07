import { Metadata } from "next";

import { NavigationCard } from "@/components/ui/navigation-card";

export const metadata: Metadata = {
  title: "Home",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-2 text-foreground">
      <div className="container">
        <h1 className="mb-5 text-3xl font-bold">
         GDM FrontView Apps
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
          <NavigationCard  href="/credit" title="Credit"  />
          <NavigationCard href="/financing" title="Financing" />
        </div>
      </div>
    </div>
  );
}
