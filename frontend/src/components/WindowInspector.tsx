import { useState, useEffect } from 'react'
import { api } from '../api/client'
import {
  PCM_BARS_VALUES, PCM_BARS_LABELS,
  UMD_SELECTION_LABELS, UMD_BOX_COLOUR_LABELS, UMD_TEXT_COLOUR_LABELS,
  UMD_BOX_ALPHA_LABELS, UMD_TEXT_ALPHA_LABELS, UMD_TEXT_SIZE_LABELS, UMD_PADDING_LABELS,
  VARID_UMD_SELECTION, VARID_UMD_TEXT,
  VARID_UMD_BOX_COLOUR, VARID_UMD_BOX_ALPHA,
  VARID_UMD_BOX_X, VARID_UMD_BOX_Y,
  VARID_UMD_TEXT_COLOUR, VARID_UMD_TEXT_ALPHA,
  VARID_UMD_TEXT_SIZE, VARID_UMD_PADDING,
} from '../protocol-mappings'

interface Props {
  mvId: number
  windowIndex: number
  windowData: any
  sources: any[]
  mvNexxIndex: number
  routing: any[]
  onUpdate: () => void
}

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
            {PCM_BARS_VALUES.map((v) => (
              <option key={v} value={v}>{PCM_BARS_LABELS[v]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-neutral-400 text-sm mb-2">UMD Layers</h4>
        {[0, 1, 2].map((idx) => {
          const layer = windowData?.umd?.[idx] || {}
          return <UMDLayer key={`${mvId}-${windowIndex}-${idx}`} layer={layer} layerIndex={idx} mvId={mvId} windowIndex={windowIndex} onUpdate={onUpdate} />
        })}
      </div>
    </div>
  )
}

function UMDLayer({ layer, layerIndex, mvId, windowIndex, onUpdate }: {
  layer: any; layerIndex: number; mvId: number; windowIndex: number; onUpdate: () => void
}) {
  const [saving, setSaving] = useState(false)

  const [selection, setSelection] = useState<number>(0)
  const [text, setText] = useState('')
  const [boxColor, setBoxColor] = useState(0)
  const [boxAlpha, setBoxAlpha] = useState(0)
  const [boxX, setBoxX] = useState(0)
  const [boxY, setBoxY] = useState(0)
  const [textColor, setTextColor] = useState(0)
  const [textAlpha, setTextAlpha] = useState(0)
  const [textSize, setTextSize] = useState(0)
  const [padding, setPadding] = useState(0)

  useEffect(() => {
    setSelection(parseInt(layer?.[VARID_UMD_SELECTION] ?? '0', 10) || 0)
    setText(layer?.[VARID_UMD_TEXT] ?? '')
    setBoxColor(parseInt(layer?.[VARID_UMD_BOX_COLOUR] ?? '0', 10) || 0)
    setBoxAlpha(parseInt(layer?.[VARID_UMD_BOX_ALPHA] ?? '0', 10) || 0)
    setBoxX(parseInt(layer?.[VARID_UMD_BOX_X] ?? '0', 10) || 0)
    setBoxY(parseInt(layer?.[VARID_UMD_BOX_Y] ?? '0', 10) || 0)
    setTextColor(parseInt(layer?.[VARID_UMD_TEXT_COLOUR] ?? '0', 10) || 0)
    setTextAlpha(parseInt(layer?.[VARID_UMD_TEXT_ALPHA] ?? '0', 10) || 0)
    setTextSize(parseInt(layer?.[VARID_UMD_TEXT_SIZE] ?? '0', 10) || 0)
    setPadding(parseInt(layer?.[VARID_UMD_PADDING] ?? '0', 10) || 0)
  }, [layer])

  const sendUmd = async (data: Record<string, string | number>) => {
    const fullUmd: any[] = [{}, {}, {}]
    fullUmd[layerIndex] = data
    await api.setWindow(mvId, windowIndex, { umd: fullUmd })
    onUpdate()
  }

  const handleTypeChange = async (val: number) => {
    setSelection(val)
    setSaving(true)
    try {
      await sendUmd({ [VARID_UMD_SELECTION]: val })
    } finally {
      setSaving(false)
    }
  }

  const handleSetAll = async () => {
    setSaving(true)
    try {
      const data: Record<string, string | number> = {
        [VARID_UMD_BOX_COLOUR]: boxColor,
        [VARID_UMD_BOX_ALPHA]: boxAlpha,
        [VARID_UMD_BOX_X]: boxX,
        [VARID_UMD_BOX_Y]: boxY,
        [VARID_UMD_TEXT_COLOUR]: textColor,
        [VARID_UMD_TEXT_ALPHA]: textAlpha,
        [VARID_UMD_TEXT_SIZE]: textSize,
        [VARID_UMD_PADDING]: padding,
      }
      if (selection === 1) {
        data[VARID_UMD_TEXT] = text
      }
      await sendUmd(data)
    } finally {
      setSaving(false)
    }
  }

  const isOff = selection === 0
  const isStatic = selection === 1
  const selectCls = "px-1.5 py-0.5 bg-neutral-700 border border-neutral-600 rounded text-neutral-100 text-xs"

  return (
    <div className="mb-2 border border-neutral-700 rounded">
      {/* Header: layer number + type selector */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-neutral-400 text-xs font-medium w-14">Layer {layerIndex + 1}</span>
        <select
          value={selection}
          onChange={(e) => handleTypeChange(Number(e.target.value))}
          disabled={saving}
          className={selectCls}
        >
          {Object.entries(UMD_SELECTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {!isOff && (
        <div className="px-3 pb-2 space-y-2">
          {/* Text input — Static only */}
          {isStatic && (
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="UMD text"
              className="w-full px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-neutral-100 text-sm"
            />
          )}

          {/* Row 1: Box Color | Box Alpha | Padding */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-neutral-500 text-[10px] mb-0.5">Box Color</label>
              <select value={boxColor} onChange={(e) => setBoxColor(Number(e.target.value))} className={`w-full ${selectCls}`}>
                {Object.entries(UMD_BOX_COLOUR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-neutral-500 text-[10px] mb-0.5">Box Alpha</label>
              <select value={boxAlpha} onChange={(e) => setBoxAlpha(Number(e.target.value))} className={`w-full ${selectCls}`}>
                {Object.entries(UMD_BOX_ALPHA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-neutral-500 text-[10px] mb-0.5">Padding</label>
              <select value={padding} onChange={(e) => setPadding(Number(e.target.value))} className={`w-full ${selectCls}`}>
                {Object.entries(UMD_PADDING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Text Color | Text Alpha | Text Size */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-neutral-500 text-[10px] mb-0.5">Text Color</label>
              <select value={textColor} onChange={(e) => setTextColor(Number(e.target.value))} className={`w-full ${selectCls}`}>
                {Object.entries(UMD_TEXT_COLOUR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-neutral-500 text-[10px] mb-0.5">Text Alpha</label>
              <select value={textAlpha} onChange={(e) => setTextAlpha(Number(e.target.value))} className={`w-full ${selectCls}`}>
                {Object.entries(UMD_TEXT_ALPHA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-neutral-500 text-[10px] mb-0.5">Text Size</label>
              <select value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className={`w-full ${selectCls}`}>
                {Object.entries(UMD_TEXT_SIZE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Position sliders */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 text-[10px] w-5">X</span>
              <input type="range" min={0} max={10000} value={boxX} onChange={(e) => setBoxX(Number(e.target.value))}
                className="flex-1 h-1 accent-amber-500 cursor-pointer" />
              <div className="flex items-center">
                <input type="number" min={0} max={100} step={0.01} value={+(boxX / 100).toFixed(2)} onChange={(e) => setBoxX(Math.round(Number(e.target.value) * 100))}
                  className="w-14 px-1 py-0.5 bg-neutral-700 border border-neutral-600 rounded-l text-neutral-100 text-xs text-center" />
                <span className="px-1 py-0.5 bg-neutral-600 border border-l-0 border-neutral-600 rounded-r text-neutral-400 text-xs">%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 text-[10px] w-5">Y</span>
              <input type="range" min={0} max={10000} value={boxY} onChange={(e) => setBoxY(Number(e.target.value))}
                className="flex-1 h-1 accent-amber-500 cursor-pointer" />
              <div className="flex items-center">
                <input type="number" min={0} max={100} step={0.01} value={+(boxY / 100).toFixed(2)} onChange={(e) => setBoxY(Math.round(Number(e.target.value) * 100))}
                  className="w-14 px-1 py-0.5 bg-neutral-700 border border-neutral-600 rounded-l text-neutral-100 text-xs text-center" />
                <span className="px-1 py-0.5 bg-neutral-600 border border-l-0 border-neutral-600 rounded-r text-neutral-400 text-xs">%</span>
              </div>
            </div>
          </div>

          {/* Set button */}
          <button
            onClick={handleSetAll}
            disabled={saving}
            className="w-full px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded text-white text-xs"
          >
            {saving ? 'Saving...' : 'Set'}
          </button>
        </div>
      )}
    </div>
  )
}

export default WindowInspector
