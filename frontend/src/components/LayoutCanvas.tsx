interface Window {
  id: number
  x: number
  y: number
  w: number
  h: number
}

interface Props {
  windows: Window[]
  selectedWindow: number | null
  onSelectWindow: (id: number) => void
  mvNexxIndex: number
  sources: any[]
  routing: any[]
}

function LayoutCanvas({ windows, selectedWindow, onSelectWindow, mvNexxIndex, sources, routing }: Props) {
  const getSourceLabel = (output: number) => {
    const route = routing.find((r: any) => r.output === output)
    if (!route || route.input === 0) return 'Other'

    const source = sources.find((s: any) => s.quartz_input === route.input)
    return source?.label || `Input ${route.input}`
  }

  return (
    <svg viewBox="0 0 1600 900" className="w-full max-w-2xl border border-neutral-600 rounded bg-neutral-950">
      {windows.map((win) => {
        const output = mvNexxIndex * 16 + win.id
        const isSelected = selectedWindow === win.id - 1
        const sourceLabel = getSourceLabel(output)

        return (
          <g key={win.id} onClick={() => onSelectWindow(win.id - 1)} className="cursor-pointer">
            <rect
              x={win.x * 1600}
              y={win.y * 900}
              width={win.w * 1600}
              height={win.h * 900}
              fill={isSelected ? '#44403c' : '#1c1917'}
              stroke={isSelected ? '#f59e0b' : '#525252'}
              strokeWidth={isSelected ? 3 : 1}
            />
            <text
              x={win.x * 1600 + (win.w * 1600) / 2}
              y={win.y * 900 + (win.h * 900) / 2 - 20}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#e5e5e5"
              fontSize={Math.min(win.w * 1600, win.h * 900) * 0.25}
              fontWeight="bold"
            >
              {win.id}
            </text>
            <text
              x={win.x * 1600 + (win.w * 1600) / 2}
              y={win.y * 900 + (win.h * 900) / 2 + 50}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#737373"
              fontSize={Math.min(win.w * 1600, win.h * 900) * 0.08}
            >
              {sourceLabel}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default LayoutCanvas
