import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { hasWhitelistEntries } from "@/lib/admin";

export default async function RegisterPage() {
  const registrationDisabled = process.env.DISABLE_REGISTRATION === "true";
  const whitelistExists = registrationDisabled
    ? await hasWhitelistEntries()
    : false;

  // Redirect only if registration is disabled AND there are no whitelisted emails.
  if (registrationDisabled && !whitelistExists) {
    redirect("/login");
  }

  return (
    <RegisterForm invitationOnly={registrationDisabled && whitelistExists} />
  );
}
