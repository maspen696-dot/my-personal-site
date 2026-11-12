import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adventures",
  description: "Travel stories and dispatches from the road.",
};

export default function AdventuresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
