import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const registrationEnabled = process.env.DISABLE_REGISTRATION !== "true";
  return <LoginForm registrationEnabled={registrationEnabled} />;
}
