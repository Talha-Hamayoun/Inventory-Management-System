"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/src/lib/theme-context";

export function AppToaster() {
  const { theme } = useTheme();
  return <Toaster richColors position="top-right" theme={theme} />;
}
