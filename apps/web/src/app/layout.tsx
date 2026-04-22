import type { Metadata } from "next";
import { AuthProvider } from "@/features/auth/auth-provider";
import { AppShellProvider } from "@/features/app-shell/app-shell-provider";
import { SettingsProvider } from "@/features/settings/settings-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance Dashboard",
  description: "Personal finance dashboard connected to Google Sheets"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <SettingsProvider>
          <AuthProvider>
            <AppShellProvider>{children}</AppShellProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
