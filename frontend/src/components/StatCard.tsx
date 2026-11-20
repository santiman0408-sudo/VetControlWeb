import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: LucideIcon
  color: string
  background: string
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  background,
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span>{title}</span>

        <div
          className="stat-icon"
          style={{ color, background }}
        >
          <Icon size={23} />
        </div>
      </div>

      <h2>{value}</h2>

      <p>{description}</p>
    </div>
  )
}
