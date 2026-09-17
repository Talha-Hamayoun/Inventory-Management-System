export function getLoginBlockMessage(user: {
  emailVerified: boolean;
  accountStatus: string;
  isActive: boolean;
}) {
  if (!user.emailVerified || user.accountStatus === "PENDING_EMAIL_VERIFICATION") {
    return "Please verify your email before signing in.";
  }
  if (user.accountStatus === "PENDING_APPROVAL") {
    return "Your account is pending administrator approval.";
  }
  if (user.accountStatus === "REJECTED") {
    return "Your account request has been rejected.";
  }
  if (user.accountStatus !== "APPROVED") {
    return "Your account is not approved.";
  }
  if (!user.isActive) {
    return "Account is deactivated";
  }
  return null;
}
