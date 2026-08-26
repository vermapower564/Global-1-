import "./globals.css";
import AppLayout from "@/components/AppLayout";

export const metadata = {
  title: "OMS - Enterprise Operations Management",
  description: "Smart, Classic and Professional Operations Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-slate-50 text-slate-900 font-sans h-full antialiased overflow-hidden">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}