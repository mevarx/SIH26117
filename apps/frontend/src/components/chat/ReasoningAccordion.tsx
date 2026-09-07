import { BrainCircuit } from 'lucide-react';
import { Accordion } from '../ui/Accordion';

interface ReasoningAccordionProps {
  reasoning: string;
}

export function ReasoningAccordion({ reasoning }: ReasoningAccordionProps) {
  if (!reasoning || !reasoning.trim()) return null;

  // Clean raw <think> tags if present
  const cleaned = reasoning.replace(/<\/?think>/g, '').trim();

  return (
    <Accordion
      title="Analytical Reasoning Process"
      icon={BrainCircuit}
      badge="Local Think"
      className="my-2 border-[var(--border-subtle)]"
    >
      <div className="font-mono text-[11px] leading-relaxed text-[var(--text-muted)] whitespace-pre-wrap selection:bg-[var(--accent-muted)]">
        {cleaned}
      </div>
    </Accordion>
  );
}
