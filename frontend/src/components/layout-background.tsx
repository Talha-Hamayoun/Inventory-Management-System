interface LayoutBackgroundProps {
  overlay?: "light" | "dark";
}

export function LayoutBackground({ overlay }: LayoutBackgroundProps) {
  const isAuth = overlay === "dark";

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0 scale-105 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/layout-bg.jpg')",
          filter: "brightness(1.04) contrast(1.12) saturate(1.18)",
        }}
        aria-hidden
      />

      {isAuth ? (
        <>
          <div
            className="pointer-events-none fixed inset-0 z-0 bg-linear-to-br from-slate-950/85 via-slate-950/40 to-cyan-950/25"
            aria-hidden
          />
          <div
            className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(75%_65%_at_70%_55%,transparent_12%,rgba(2,6,23,0.78)_100%)]"
            aria-hidden
          />
        </>
      ) : (
        <>
          <div
            className="pointer-events-none fixed inset-0 z-0 bg-linear-to-br from-white/45 via-transparent to-cyan-950/12 dark:from-slate-950/72 dark:via-slate-950/28 dark:to-cyan-950/22"
            aria-hidden
          />
          <div
            className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(72%_62%_at_70%_52%,transparent_8%,rgba(248,250,252,0.78)_100%)] dark:bg-[radial-gradient(72%_62%_at_70%_52%,transparent_6%,rgba(2,6,23,0.8)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none fixed inset-0 z-0 bg-linear-to-b from-white/35 via-transparent to-white/20 dark:from-slate-950/40 dark:via-transparent dark:to-slate-950/25"
            aria-hidden
          />
        </>
      )}
    </>
  );
}
