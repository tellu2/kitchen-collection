// Step text with scaled amounts in bold and Thermomix settings as readouts.
import type { ReactNode } from 'react';
import type { Ingredient } from '../types';
import { renderStep } from '../lib/tokens';

const SEG = '(?:\\d{2,3}°C|Varoma|Reverse|Speed\\s*\\d+|Soft stir|Gentle stir|Soft speed|[Ss]poon(?:\\s+speed)?)';
const SETTINGS = new RegExp(`(\\d+(?:[–-]\\d+)?\\s*(?:sec|min)(?:\\s*\\/\\s*${SEG})+)|(\\b\\d{2,3}°C\\b)`, 'g');

function withSettings(text: string, keyBase: string) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(SETTINGS)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    out.push(<code className="readout" key={`${keyBase}-${m.index}`}>{m[0].trim()}</code>);
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function StepText({ text, ingredients, factor }: { text: string; ingredients: Map<string, Ingredient>; factor: number }) {
  const parts = renderStep(text, ingredients, factor);
  return (
    <>
      {parts.map((p, i) =>
        p.kind === 'amount' ? <b key={i} className="amt">{p.text}</b> : <span key={i}>{withSettings(p.text, String(i))}</span>
      )}
    </>
  );
}

/** Plain text with settings highlighted (for notes). */
export function NoteText({ text }: { text: string }) {
  return <>{withSettings(text, 'n')}</>;
}
