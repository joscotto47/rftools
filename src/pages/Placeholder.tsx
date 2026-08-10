import { Construction } from 'lucide-react'

export default function Placeholder({ title, category }: { title: string; category: string }) {
  return (
    <div>
      <div className="page-title">
        <div><div className="eyebrow">{category}</div><h1>{title}</h1><p>This module is part of the RFTools roadmap.</p></div>
      </div>
      <section className="empty-state">
        <Construction size={32}/>
        <h2>Module scaffolded</h2>
        <p>The navigation and application architecture are ready. This calculator can now be implemented without changing the main layout.</p>
      </section>
    </div>
  )
}