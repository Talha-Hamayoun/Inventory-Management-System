import { Context } from "hono";
import { join } from "path";

const SETTINGS_PATH = join(process.cwd(), "data", "settings.json");

export const DEFAULT_SETTINGS = {
  companyName: "Inventory Management",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",
  companyWebsite: "",
  currencySymbol: "Rs.",
  taxLabel: "Tax",
  taxRate: 0,
};

export async function readSettings() {
  try {
    const file = Bun.file(SETTINGS_PATH);
    if (await file.exists()) {
      const data = await file.json();
      return { ...DEFAULT_SETTINGS, ...data };
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_SETTINGS };
}

export async function getSettingsController(c: Context) {
  const settings = await readSettings();
  return c.json({ success: true, data: settings });
}
