import Link from "next/link";

import { cn } from "@/lib/utils";

import { Card, CardTitle } from "./card";

type NavigationCardProps = {
  href: string;
  title: string;
};

export const NavigationCard = ({ href, title }: NavigationCardProps) => {
  return (
    <Link href={href} className="block aspect-square">
      <Card
        className={cn(
          "dark flex h-full w-full flex-col items-center justify-center gap-0 rounded-lg border-white p-6 text-center shadow-lg transition-shadow duration-300 hover:shadow-xl"
        )}
      >
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </Card>
    </Link>
  );
};