import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - API Schedulr",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
