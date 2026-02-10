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
}

function LayoutCanvas({ windows, selectedWindow, onSelectWindow, mvNexxIndex }: Props) {
  return (
    <svg viewBox="0 0 1000 1000" className="w-full max-w-2xl border border-neutral-600 rounded bg-neutral-950">
      {windows.map((win) => {
        const output = mvNexxIndex * 16 + win.id
        const isSelected = selectedWindow === win.id - 1
        return (
          <g key={win.id} onClick={() => onSelectWindow(win.id - 1)} className="cursor-pointer">
            <rect
              x={win.x * 1000}
              y={win.y * 1000}
              width={win.w * 1000}
              height={win.h * 1000}
              fill={isSelected ? '#44403c' : '#1c1917'}
              stroke={isSelected ? '#f59e0b' : '#525252'}
              strokeWidth={isSelected ? 3 : 1}
            />
            <text
              x={win.x * 1000 + (win.w * 1000) / 2}
              y={win.y * 1000 + (win.h * 1000) / 2 - 8}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#e5e5e5"
              fontSize={Math.min(win.w, win.h) * 120}
              fontWeight="bold"
            >
              {win.id}
            </text>
            <text
              x={win.x * 1000 + (win.w * 1000) / 2}
              y={win.y * 1000 + (win.h * 1000) / 2 + 18}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#737373"
              fontSize={Math.min(win.w, win.h) * 60}
            >
              out {output}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default LayoutCanvas
