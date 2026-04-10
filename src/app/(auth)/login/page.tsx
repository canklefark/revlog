import { LoginForm } from "@/components/auth/login-form";
import { hasWhitelistEntries } from "@/lib/admin";

export default async function LoginPage() {
  const registrationDisabled = process.env.DISABLE_REGISTRATION === "true";
  const whitelistExists = registrationDisabled
    ? await hasWhitelistEntries()
    : false;
  const registrationEnabled = !registrationDisabled || whitelistExists;
  const googleEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  return (
    <LoginForm
      registrationEnabled={registrationEnabled}
      googleEnabled={googleEnabled}
      invitationOnly={registrationDisabled && whitelistExists}
    />
  );
}
