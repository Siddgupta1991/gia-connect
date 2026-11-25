export const LIMITS = {
  descriptionMin: 10,
  descriptionMax: 500,
  locationMin: 3,
  locationMax: 80,
  passwordMin: 6,
  broadcastTitleMax: 60,
  broadcastBodyMax: 240,
  messageMax: 1000,
  reasonMin: 5,
} as const;

export interface RegisterInput {
  name: string;
  mobile: string;
  industryName: string;
  plotNo: string;
  username: string;
  password: string;
}

export type RegisterErrors = Partial<Record<keyof RegisterInput, string>>;

export function validateRegister(input: RegisterInput): RegisterErrors {
  const e: RegisterErrors = {};
  if (input.name.trim().length < 2) e.name = 'Enter your full name';
  if (!/^\d{10}$/.test(input.mobile.trim())) e.mobile = 'Enter a 10 digit mobile number';
  if (!input.industryName.trim()) e.industryName = 'Enter your industry name';
  if (!input.plotNo.trim()) e.plotNo = 'Enter your plot number';
  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(input.username.trim()))
    e.username = 'Use 3 to 20 letters, numbers, dot or underscore';
  if (input.password.length < LIMITS.passwordMin)
    e.password = `Use at least ${LIMITS.passwordMin} characters`;
  return e;
}

export function validateLocation(location: string): string | null {
  const t = location.trim();
  if (!t) return 'Tell us where the problem is';
  if (t.length < LIMITS.locationMin) return 'Add a little more detail';
  if (t.length > LIMITS.locationMax) return `Keep it under ${LIMITS.locationMax} characters`;
  return null;
}

export function validateDescription(text: string): string | null {
  const t = text.trim();
  if (t.length < LIMITS.descriptionMin) return `Write at least ${LIMITS.descriptionMin} characters`;
  if (t.length > LIMITS.descriptionMax) return `Keep it under ${LIMITS.descriptionMax} characters`;
  return null;
}
