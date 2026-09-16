export interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  currencySymbol: string;
  taxLabel: string;
  taxRate: number;
}

export type SettingsResponse = {
  success: boolean;
  data: CompanySettings;
  message?: string;
};
