'use client';
import { NavigationCard } from "@/components/ui/navigation-card";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  
  
  useEffect(() => {
    router.push('/financing');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
     Loading
    </div>
  );
}
