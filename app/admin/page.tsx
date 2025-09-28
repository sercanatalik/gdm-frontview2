import { Metadata } from "next";

import { NavigationCard } from "@/components/ui/navigation-card";

const ADMIN_LINKS = [{ href: "/admin/cache", title: "Redis" }];

export const metadata: Metadata = {
  title: "Admin",
};

export default function Admin() {
  return (
    <main className="min-h-screen bg-background p-2 text-foreground">
      <div className="container">
        <h1 className="mb-5 text-3xl font-bold">GDM Admin Tools</h1>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
          {ADMIN_LINKS.map((link) => (
            <NavigationCard key={link.href} {...link} />
          ))}
        </div>
      </div>
    </main>
  );
}
