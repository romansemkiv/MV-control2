import { useState } from 'react'
import { api } from '../api/client'

interface Props {
  mvId: number
  windowIndex: number
  windowData: any
  sources: any[]
  mvNexxIndex: number
  routing: any[]
  onUpdate: () => void
}

const PCM_OPTIONS = [0, 2, 4, 6, 8, 12, 16]

function WindowInspector({ mvId, windowIndex, windowData, sources, mvNexxIndex, routing, onUpdate }: Props) {
  const [saving, setSaving] = useState(false)
  const output = mvNexxIndex * 16 + windowIndex + 1
  const currentRoute = routing.find((r: any) => r.output === output)

  const handleSourceChange = async (inputId: number) => {
    setSaving(true)
    try {
      await api.switchRoute(output, inputId)
      onUpdate()
    } finally {
      setSaving(false)
    }
  }

  const handlePcmChange = async (value: number) => {
    setSaving(true)
    try {
      await api.setWindow(mvId, windowIndex, { pcm_bars: value })
      onUpdate()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded p-4">
      <h3 className="text-neutral-100 font-medium mb-3">
        Window {windowIndex + 1} <span className="text-neutral-500 text-sm">(output {output})</span>
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-neutral-400 text-sm mb-1">Source</label>
          <select
            value={currentRoute?.input ?? ''}
            onChange={(e) => handleSourceChange(Number(e.target.value))}
            disabled={saving}
            className="w-full px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-neutral-100 text-sm"
          >
            <option value="">-- Select --</option>
            {sources.map((s: any) => (
              <option key={s.id} value={s.quartz_input}>
                {s.label || `Input ${s.quartz_input}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-neutral-400 text-sm mb-1">PCM Audio Bars</label>
          <select
            value={windowData?.pcm_bars ?? 0}
            onChange={(e) => handlePcmChange(Number(e.target.value))}
            disabled={saving}
            className="w-full px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-neutral-100 text-sm"
          >
            {PCM_OPTIONS.map((v) => (
              <option key={v} value={v}>{v === 0 ? 'Off' : `${v} bars`}</option>
            ))}
          </select>
        </div>
      </div>

      {windowData?.umd && windowData.umd.length > 0 && (
        <div className="mt-4">
          <h4 className="text-neutral-400 text-sm mb-2">UMD Layers</h4>
          {windowData.umd.map((layer: any, idx: number) => (
            <UMDLayer key={idx} layer={layer} layerIndex={idx} mvId={mvId} windowIndex={windowIndex} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}

function UMDLayer({ layer, layerIndex, mvId, windowIndex, onUpdate }: {
  layer: any; layerIndex: number; mvId: number; windowIndex: number; onUpdate: () => void
}) {
  const [text, setText] = useState(layer?.['2709'] ?? '')
  const [saving, setSaving] = useState(false)

  const handleSaveText = async () => {
    setSaving(true)
    try {
      const fullUmd: any[] = []
      for (let i = 0; i < 3; i++) {
        fullUmd.push(i === layerIndex ? { '2709': text } : {})
      }
      await api.setWindow(mvId, windowIndex, { umd: fullUmd })
      onUpdate()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-neutral-500 text-xs w-16">Layer {layerIndex + 1}</span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="UMD text"
        className="flex-1 px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-neutral-100 text-sm"
      />
      <button
        onClick={handleSaveText}
        disabled={saving}
        className="px-2 py-1 bg-amber-600 hover:bg-amber-500 rounded text-white text-xs"
      >
        Set
      </button>
    </div>
  )
}

export default WindowInspector
