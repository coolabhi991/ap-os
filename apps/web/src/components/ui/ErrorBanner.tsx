export default function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">
      {children}
    </div>
  );
}
