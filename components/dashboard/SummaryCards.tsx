import { ReactNode } from "react";

interface SummaryCard {
  label: string;
  value: number | string;
  helper?: string;
  tone?: "primary" | "success" | "warning";
}

interface SummaryCardsProps {
  cards: SummaryCard[];
}

export function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-slate-200 rounded-2xl px-5 py-6 flex flex-col gap-2"
        >
          <p className="text-sm font-semibold text-slate-500">{card.label}</p>
          <p className="text-3xl font-bold text-blue-600">{card.value}</p>
          {card.helper && <p className="text-xs text-slate-500">{card.helper}</p>}
        </div>
      ))}
    </div>
  );
}
