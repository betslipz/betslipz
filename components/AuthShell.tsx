export default function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="hero-glow px-4 py-16">
      <div className="card mx-auto w-full max-w-md p-6 sm:p-8">
        <h1 className="mb-6 text-2xl font-black">{title}</h1>
        {children}
      </div>
    </div>
  );
}
