"use client";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

export function Header() {
    const pathname = usePathname();
    const title = pathname.split("/").pop()?.replace("-", " ") || "Home";
    return (
        <div className="flex items-center gap-3 px-1 py-2 bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />

            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/">Home</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <span className="capitalize">{title}</span>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
}

