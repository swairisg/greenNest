// backend/utils/isCompanyEmail.js
const domains = (process.env.COMPANY_EMAIL_DOMAINS || "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

/**
 * Returns true if email's domain is one of the company domains.
 */
module.exports = function isCompanyEmail(email) {
  if (!email) return false;
  const at = email.indexOf("@");
  if (at === -1) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return domains.includes(domain);
};
