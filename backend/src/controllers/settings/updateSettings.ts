import { Context } from "hono";
import { join } from "path";
import { mkdir } from "fs/promises";
import { DEFAULT_SETTINGS } from "./getSettings";

const SETTINGS_PATH = join(process.cwd(), "data", "settings.json");
const DATA_DIR = join(process.cwd(), "data");

export async function updateSettingsController(c: Context) {
  try {
    const body = await c.req.json();

    // Only keep known keys, falling back to defaults for missing ones
    const settings = {
      companyName: body.companyName ?? DEFAULT_SETTINGS.companyName,
      companyAddress: body.companyAddress ?? DEFAULT_SETTINGS.companyAddress,
      companyPhone: body.companyPhone ?? DEFAULT_SETTINGS.companyPhone,
      companyEmail: body.companyEmail ?? DEFAULT_SETTINGS.companyEmail,
      companyWebsite: body.companyWebsite ?? DEFAULT_SETTINGS.companyWebsite,
      currencySymbol: body.currencySymbol ?? DEFAULT_SETTINGS.currencySymbol,
      taxLabel: body.taxLabel ?? DEFAULT_SETTINGS.taxLabel,
      taxRate: typeof body.taxRate === "number" ? body.taxRate : DEFAULT_SETTINGS.taxRate,
    };

    await mkdir(DATA_DIR, { recursive: true });
    await Bun.write(SETTINGS_PATH, JSON.stringify(settings, null, 2));

    return c.json({ success: true, data: settings, message: "Settings saved successfully" });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
