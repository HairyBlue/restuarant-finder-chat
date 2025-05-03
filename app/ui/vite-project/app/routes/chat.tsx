import type { Route } from "./+types/chat";
import { Welcome } from "../welcome/welcome";
import Chat from "~/chat/chat";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Restuarant Finder Assistant" },
    { name: "description", content: "Welcome to Restuarant Finder Chat Assistant!" },
  ];
}

export default function Home() {
  return <Chat />;
}
