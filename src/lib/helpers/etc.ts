export const canonicalizePhoneNumber = (phoneNumber: string) => {
  let cleaned = phoneNumber.replace(/\D/g, "");
  if (cleaned.length === 10) {
    cleaned = `1${cleaned}`;
  }

  return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
};
