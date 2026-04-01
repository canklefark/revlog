import { TimesNav } from "@/components/times/times-nav";

export default function TimesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Times</h1>
      </div>
      <TimesNav />
      {children}
    </div>
  );
}
