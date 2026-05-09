'use client'

import { useState } from 'react'

type FaqItem = { p: string; r: string }

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [aberto, setAberto] = useState<number | null>(null)

  function toggle(i: number) {
    setAberto(prev => prev === i ? null : i)
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.p} className="card rounded-xl overflow-hidden">
          <button
            className="w-full px-6 py-4 text-left flex items-center justify-between font-semibold"
            onClick={() => toggle(i)}
            aria-expanded={aberto === i}
          >
            <span>{item.p}</span>
            <span style={{ display: 'inline-block', transition: 'transform 0.3s', transform: aberto === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </button>
          {aberto === i && (
            <div className="px-6 pb-4">
              <p className="text-muted font-light">{item.r}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}