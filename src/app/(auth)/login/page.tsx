import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const registrationEnabled = process.env.DISABLE_REGISTRATION !== "true";
  const googleEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  return (
    <LoginForm
      registrationEnabled={registrationEnabled}
      googleEnabled={googleEnabled}
    />
  );
}
