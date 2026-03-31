import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  if (process.env.DISABLE_REGISTRATION === "true") {
    redirect("/login");
  }

  return <RegisterForm />;
}
