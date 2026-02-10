import { layouts } from '../data/layouts'

interface Props {
  onSelect: (layoutId: number) => void
  onClose: () => void
}

function LayoutPreviewModal({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-neutral-100 font-bold mb-4">Select Layout</h2>
        <div className="grid grid-cols-5 gap-3">
          {layouts.map((layout) => (
            <div
              key={layout.id}
              onClick={() => onSelect(layout.id)}
              className="cursor-pointer border border-neutral-600 rounded p-1 hover:border-amber-500 transition-colors"
            >
              <svg viewBox="0 0 100 100" className="w-full bg-neutral-950 rounded">
                {layout.windows.map((win) => (
                  <g key={win.id}>
                    <rect
                      x={win.x * 100}
                      y={win.y * 100}
                      width={win.w * 100}
                      height={win.h * 100}
                      fill="#1c1917"
                      stroke="#525252"
                      strokeWidth={0.5}
                    />
                    <text
                      x={win.x * 100 + (win.w * 100) / 2}
                      y={win.y * 100 + (win.h * 100) / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#a3a3a3"
                      fontSize={Math.min(win.w, win.h) * 20}
                    >
                      {win.id}
                    </text>
                  </g>
                ))}
              </svg>
              <p className="text-neutral-400 text-xs text-center mt-1">{layout.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LayoutPreviewModal
