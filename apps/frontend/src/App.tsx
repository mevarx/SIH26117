import { useState } from 'react';
import { HeroPage } from './components/hero/HeroPage';
import { HeroTransition } from './components/hero/HeroTransition';
import { ConsoleShell } from './components/layout/ConsoleShell';

export default function App() {
  const [screen, setScreen] = useState<'hero' | 'console'>('hero');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Single orchestrated transition sequence (~500ms) per PRD Section 3.3
  const handleEnterWorkbench = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setScreen('console');
      setIsTransitioning(false);
    }, 500);
  };

  const handleReturnToHero = () => {
    setScreen('hero');
  };

  return (
    <HeroTransition
      hero={<HeroPage onEnter={handleEnterWorkbench} />}
      console={<ConsoleShell onReturnToHero={handleReturnToHero} />}
      isTransitioning={isTransitioning}
      isConsoleActive={screen === 'console'}
    />
  );
}
