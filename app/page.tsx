import { Metadata } from "next";

import { NavigationCard } from "@/components/ui/navigation-card";

const NAVIGATION_LINKS = [
  { href: "/credit", title: "Credit" },
  { href: "/financing", title: "Financing" },
  { href: "/datagrid", title: "Data Grid" },
  { href: "/ai", title: "AI Playground" },
];

export const metadata: Metadata = {
  title: "Home",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-2 text-foreground">
      <div className="container">
        <h1 className="mb-5 text-3xl font-bold">GDM FrontView Apps</h1>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
          {NAVIGATION_LINKS.map((link) => (
            <NavigationCard key={link.href} {...link} />
          ))}
        </div>
      </div>
    </main>
  );
}
