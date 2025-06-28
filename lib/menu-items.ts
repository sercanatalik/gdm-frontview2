import {
  Calendar,
  CreditCard,
  Globe,
  Home,
  Inbox,
  Search,
  Settings,
} from "lucide-react";

export const teams = [
  {
    name: "Financing",
    plan: "Financing",
    icon: Globe,
    route: "/financing",
  },
  {
    name: "Structured Credit",
    plan: "Structured Credit",
    icon: CreditCard,
    route: "/credit",
  },
];

export const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];
