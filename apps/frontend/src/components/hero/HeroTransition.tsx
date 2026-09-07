import type { ReactNode } from 'react';

interface HeroTransitionProps {
  hero: ReactNode;
  console: ReactNode;
  isTransitioning: boolean;
  isConsoleActive: boolean;
}

export function HeroTransition({
  hero,
  console,
  isTransitioning,
  isConsoleActive,
}: HeroTransitionProps) {
  if (isConsoleActive && !isTransitioning) {
    return <div className="h-screen w-screen overflow-hidden">{console}</div>;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Hero Layer with smooth scrolling */}
      <div
        className={`absolute inset-0 overflow-y-auto overflow-x-hidden scroll-smooth transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isTransitioning
            ? 'opacity-0 scale-95 pointer-events-none'
            : 'opacity-100 scale-100'
        }`}
      >
        {hero}
      </div>

      {/* Console Layer */}
      <div
        className={`absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isTransitioning
            ? 'opacity-100 scale-100 translate-y-0'
            : isConsoleActive
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-[1.02] translate-y-2 pointer-events-none'
        }`}
      >
        {console}
      </div>
    </div>
  );
}
