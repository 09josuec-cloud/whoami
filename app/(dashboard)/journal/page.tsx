import type { Metadata } from "next";
import JournalClient from "./components/JournalClient";

export const metadata: Metadata = {
  title: "Journal",
};

export default function JournalPage() {
  return <JournalClient />;
}
