import { TimesNav } from "@/components/times/times-nav";

export default function TimesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Times</h1>
      </div>
      <TimesNav />
      {children}
    </div>
  );
}
