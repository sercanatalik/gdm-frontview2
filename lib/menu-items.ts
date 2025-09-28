import {
  Calendar,
  CreditCard,
  DollarSign,
  Globe,
  Home,
  Inbox,
  Search,
  Table
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
   {
    name: "AI SDK Client",
    plan: "AI SDK Clientt",
    icon: DollarSign,
    route: "/ai",
  },


];

export const creditItems = [
  {
    title: "Exposure 4T",
    url: "#",
    icon: Home,
  },
 
  {
    title: "Settings",
    url: "#",
    icon: Table,
  },
];

export const financingItems = [
  {
    title: "Dashboard",
    url: "/financing",
    icon: Home,
  },
 
  {
    title: "Data Grid",
    url: "/datagrid",
    icon: Table,
  },
];


