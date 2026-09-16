"use client";

import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ToastProvider } from "@/context/ToastContext";

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>{children}</SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
