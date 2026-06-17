// Kenya National ID: 7–8 digits
export const isValidKenyaId = (value) => /^\d{7,8}$/.test(value.trim());

// Kenya Passport: 1–2 letters followed by 6–9 digits (e.g. A1234567, AB1234567)
export const isValidKenyaPassport = (value) => /^[A-Za-z]{1,2}\d{6,9}$/.test(value.trim());

// Accepts either a valid National ID or Passport
export const isValidKenyaIdOrPassport = (value) =>
  isValidKenyaId(value) || isValidKenyaPassport(value);

// Kenya Company Registration Number formats:
//   Old numeric only:      12345 – 123456789
//   BRS new (with year):   CPR/2022/123456, PVT/2021/123456, BN/2020/1234
//   BRS short:             PVT-123456, LLP-123456
//   Old letter-dot:        C.12345
export const isValidKenyaCompanyReg = (value) => {
  const v = value.trim();
  return (
    /^\d{5,9}$/.test(v) ||
    /^[A-Za-z]{2,4}\/\d{4}\/\d{3,9}$/.test(v) ||
    /^[A-Za-z]{2,4}-\d{3,9}$/.test(v) ||
    /^[A-Za-z]\.\d{4,7}$/.test(v)
  );
};

// Kenya phone: local (07XXXXXXXX / 01XXXXXXXX) or international (+2547XXXXXXXX / 2547XXXXXXXX)
export const isValidKenyaPhone = (value) =>
  /^(\+?254|0)[17]\d{8}$/.test(value.trim());

// Standard email format
export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const KENYA_ID_HELPER = 'National ID: 7–8 digits. Passport: 1–2 letters followed by 6–9 digits (e.g. A1234567)';
export const KENYA_REG_HELPER = 'e.g. CPR/2022/123456, PVT/2021/123456, BN-123456, or a 5–9 digit number';
export const KENYA_PHONE_HELPER = 'e.g. 0712345678 or +254712345678';
export const EMAIL_HELPER = 'Enter a valid email address (e.g. name@example.com)';
