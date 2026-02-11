import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface Props {
  mvId: number
  mvNexxIndex: number
  onClose: () => void
}

function PresetsModal({ mvId, mvNexxIndex, onClose }: Props) {
  const [presets, setPresets] = useState<any[]>([])
  const [name, setName] = useState('')
  const [selected, setSelected] = useState({ layout: true, umd: true, pcm: true, borders: true, font: true })
  const [status, setStatus] = useState('')

  useEffect(() => {
    api.getPresets().then(setPresets).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!name.trim()) return
    try {
      const mv = await api.getMultiviewer(mvId)
      const payload: any = { mv_nexx_index: mvNexxIndex, params: {} }
      if (selected.layout) payload.params.layout = mv.layout
      if (selected.font) {
        payload.params.font = mv.font
        payload.params.output_format = mv.output_format
      }
      if (selected.borders) {
        payload.params.outer_border = mv.outer_border
        payload.params.inner_border = mv.inner_border
      }
      if (selected.umd || selected.pcm) {
        payload.params.windows = mv.windows.map((w: any) => {
          const win: any = { index: w.window_index }
          if (selected.pcm) win.pcm_bars = w.pcm_bars
          if (selected.umd) win.umd = w.umd
          return win
        })
      }
      await api.createPreset({ name, payload })
      setStatus('Saved')
      setName('')
      api.getPresets().then(setPresets)
    } catch (err: any) {
      setStatus(err.message)
    }
  }

  const handleApply = async (presetId: number) => {
    try {
      await api.applyPreset(presetId)
      setStatus('Applied')
    } catch (err: any) {
      setStatus(err.message)
    }
  }

  const handleDelete = async (presetId: number) => {
    await api.deletePreset(presetId)
    api.getPresets().then(setPresets)
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      const formData = new FormData()
      formData.append('file', file)
      await fetch('/api/presets/import', { method: 'POST', body: formData, credentials: 'include' })
      api.getPresets().then(setPresets)
    }
    input.click()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 w-[480px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-neutral-100 font-bold mb-4">Presets</h2>

        <div className="mb-4">
          <div className="flex gap-3 flex-wrap mb-3">
            {Object.entries(selected).map(([key, val]) => (
              <label key={key} className="flex items-center gap-1 text-neutral-300 text-sm">
                <input
                  type="checkbox"
                  checked={val}
                  onChange={() => setSelected({ ...selected, [key]: !val })}
                  className="accent-amber-500"
                />
                {key}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Preset name"
              className="flex-1 px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-neutral-100 text-sm"
            />
            <button onClick={handleSave} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded text-white text-sm">Save</button>
            <button onClick={handleImport} className="px-3 py-1.5 bg-neutral-600 hover:bg-neutral-500 rounded text-white text-sm">Import</button>
          </div>
        </div>

        {status && <p className="text-amber-400 text-sm mb-3">{status}</p>}

        <div className="space-y-2">
          {presets.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-neutral-750 border border-neutral-600 rounded px-3 py-2">
              <span className="text-neutral-200 text-sm">{p.name}</span>
              <div className="flex gap-2">
                <button onClick={() => handleApply(p.id)} className="text-amber-400 hover:text-amber-300 text-xs">Apply</button>
                <a href={api.exportPreset(p.id)} className="text-neutral-400 hover:text-neutral-300 text-xs">Export</a>
                <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
              </div>
            </div>
          ))}
          {presets.length === 0 && <p className="text-neutral-500 text-sm">No presets yet</p>}
        </div>
      </div>
    </div>
  )
}

export default PresetsModal
