import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface Props {
  mvId: number
  multiviewers: any[]
  routing: any[]
  onClose: () => void
}

const CATEGORIES = [
  { key: 'layout', label: 'Layout' },
  { key: 'mv_params', label: 'MV Parameters' },
  { key: 'umd', label: 'UMD' },
  { key: 'pcm', label: 'PCM' },
  { key: 'sources', label: 'Sources' },
] as const

type CatKey = (typeof CATEGORIES)[number]['key']

function PresetsModal({ mvId, multiviewers, routing, onClose }: Props) {
  const [presets, setPresets] = useState<any[]>([])
  const [presetDetails, setPresetDetails] = useState<Record<number, any>>({})
  const [name, setName] = useState('')
  const [selectedMVs, setSelectedMVs] = useState<Set<number>>(new Set([mvId]))
  const [selectedCats, setSelectedCats] = useState<Record<CatKey, boolean>>({
    layout: true, mv_params: true, umd: true, pcm: true, sources: false,
  })
  const [applyingPreset, setApplyingPreset] = useState<any | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    loadPresets()
  }, [])

  const loadPresets = async () => {
    const list = await api.getPresets().catch(() => [])
    setPresets(list)
    // Fetch details for all presets to show MV labels
    const details: Record<number, any> = {}
    for (const p of list) {
      try {
        const d = await api.getPreset(p.id)
        details[p.id] = d.payload
      } catch {}
    }
    setPresetDetails(details)
  }

  const toggleMV = (id: number) => {
    const next = new Set(selectedMVs)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedMVs(next)
  }

  const toggleCat = (key: CatKey) => {
    setSelectedCats({ ...selectedCats, [key]: !selectedCats[key] })
  }

  const handleSave = async () => {
    if (!name.trim() || selectedMVs.size === 0) return
    try {
      const cats = Object.keys(selectedCats).filter((k) => selectedCats[k as CatKey]) as CatKey[]
      const mvs: any[] = []

      for (const id of selectedMVs) {
        const mv = await api.getMultiviewer(id)
        const mvData: any = {
          mv_id: id,
          mv_nexx_index: mv.nexx_index,
          mv_label: mv.label || `MV ${mv.nexx_index + 1}`,
        }
        if (cats.includes('layout')) mvData.layout = mv.layout
        if (cats.includes('mv_params')) {
          mvData.font = mv.font
          mvData.output_format = mv.output_format
          mvData.outer_border = mv.outer_border
          mvData.inner_border = mv.inner_border
        }
        if (cats.includes('umd') || cats.includes('pcm') || cats.includes('sources')) {
          mvData.windows = (mv.windows || []).map((w: any) => {
            const win: any = { index: w.window_index }
            if (cats.includes('pcm')) win.pcm_bars = w.pcm_bars
            if (cats.includes('umd')) win.umd = w.umd
            if (cats.includes('sources')) {
              const output = mv.nexx_index * 16 + w.window_index + 1
              const route = routing.find((r: any) => r.output === output)
              win.source_input = route?.input ?? null
            }
            return win
          })
        }
        mvs.push(mvData)
      }

      await api.createPreset({ name, payload: { categories: cats, mvs } })
      setStatus('Saved')
      setName('')
      loadPresets()
    } catch (err: any) {
      setStatus(err.message)
    }
  }

  const handleDelete = async (presetId: number) => {
    await api.deletePreset(presetId)
    loadPresets()
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
      loadPresets()
    }
    input.click()
  }

  const getPresetMVLabels = (presetId: number): string => {
    const payload = presetDetails[presetId]
    if (!payload) return ''
    const mvs = payload.mvs
    if (!mvs) return payload.mv_nexx_index != null ? `MV ${payload.mv_nexx_index + 1}` : ''
    return mvs.map((m: any) => m.mv_label || `MV ${m.mv_nexx_index + 1}`).join(', ')
  }

  const getPresetCats = (presetId: number): string[] => {
    const payload = presetDetails[presetId]
    if (!payload) return []
    if (payload.categories) return payload.categories
    // Legacy: infer from params
    const cats: string[] = []
    const p = payload.params || payload.mvs?.[0] || {}
    if ('layout' in p) cats.push('layout')
    if ('font' in p || 'output_format' in p) cats.push('mv_params')
    if (p.windows?.some((w: any) => w.umd)) cats.push('umd')
    if (p.windows?.some((w: any) => 'pcm_bars' in w)) cats.push('pcm')
    if (p.windows?.some((w: any) => 'source_input' in w)) cats.push('sources')
    return cats
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 w-[520px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-neutral-100 font-bold mb-4">Presets</h2>

        {/* Save section */}
        <div className="mb-4 space-y-3">
          {/* MV selection */}
          <div className="bg-neutral-900/50 border border-neutral-700 rounded p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-neutral-400 text-xs font-medium">Multiviewers</span>
              <button
                onClick={() => {
                  const allSelected = multiviewers.every((mv: any) => selectedMVs.has(mv.id))
                  setSelectedMVs(allSelected ? new Set() : new Set(multiviewers.map((mv: any) => mv.id)))
                }}
                className="text-amber-500 hover:text-amber-400 text-[10px]"
              >
                {multiviewers.every((mv: any) => selectedMVs.has(mv.id)) ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {multiviewers.map((mv: any) => (
                <label key={mv.id} className="flex items-center gap-1 text-neutral-300 text-xs">
                  <input type="checkbox" checked={selectedMVs.has(mv.id)} onChange={() => toggleMV(mv.id)} className="accent-amber-500" />
                  {mv.label || `MV ${mv.nexx_index + 1}`}
                </label>
              ))}
            </div>
          </div>

          {/* Category selection */}
          <div className="bg-neutral-900/50 border border-neutral-700 rounded p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-neutral-400 text-xs font-medium">Parameters</span>
              <button
                onClick={() => {
                  const allSelected = CATEGORIES.every(({ key }) => selectedCats[key])
                  const next = Object.fromEntries(CATEGORIES.map(({ key }) => [key, !allSelected])) as Record<CatKey, boolean>
                  setSelectedCats(next)
                }}
                className="text-amber-500 hover:text-amber-400 text-[10px]"
              >
                {CATEGORIES.every(({ key }) => selectedCats[key]) ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="flex gap-3 flex-wrap">
              {CATEGORIES.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1 text-neutral-300 text-xs">
                  <input type="checkbox" checked={selectedCats[key]} onChange={() => toggleCat(key)} className="accent-amber-500" />
                  {label}
                </label>
              ))}
            </div>
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

        {status && !applyingPreset && <p className="text-amber-400 text-sm mb-3">{status}</p>}

        {/* Preset list */}
        <div className="space-y-2">
          {presets.map((p) => (
            <div key={p.id} className="bg-neutral-750 border border-neutral-600 rounded px-3 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-neutral-200 text-sm">{p.name}</span>
                  <span className="text-neutral-500 text-xs ml-2">{getPresetMVLabels(p.id)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setApplyingPreset({ id: p.id, payload: presetDetails[p.id] })} className="text-amber-400 hover:text-amber-300 text-xs">Apply</button>
                  <a href={api.exportPreset(p.id)} className="text-neutral-400 hover:text-neutral-300 text-xs">Export</a>
                  <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {presets.length === 0 && <p className="text-neutral-500 text-sm">No presets yet</p>}
        </div>
      </div>

      {/* Apply sub-modal */}
      {applyingPreset && (
        <ApplyModal
          preset={applyingPreset}
          multiviewers={multiviewers}
          savedCats={getPresetCats(applyingPreset.id)}
          onApply={async (body) => {
            try {
              await api.applyPreset(applyingPreset.id, body)
              setStatus('Applied')
              setApplyingPreset(null)
            } catch (err: any) {
              setStatus(err.message)
            }
          }}
          onClose={() => setApplyingPreset(null)}
        />
      )}
    </div>
  )
}


function ApplyModal({ preset, multiviewers, savedCats, onApply, onClose }: {
  preset: any
  multiviewers: any[]
  savedCats: string[]
  onApply: (body: { categories: string[]; targets: Record<string, number> }) => void
  onClose: () => void
}) {
  const payload = preset.payload || {}
  const mvs = payload.mvs || [{ mv_nexx_index: payload.mv_nexx_index, mv_label: `MV ${(payload.mv_nexx_index ?? 0) + 1}` }]

  const [applyCats, setApplyCats] = useState<Record<string, boolean>>(
    Object.fromEntries(savedCats.map((c) => [c, true]))
  )
  const [targets, setTargets] = useState<Record<string, number>>(() => {
    const t: Record<string, number> = {}
    for (const mv of mvs) {
      const idx = String(mv.mv_nexx_index)
      const match = multiviewers.find((m: any) => m.nexx_index === mv.mv_nexx_index)
      t[idx] = match?.id ?? multiviewers[0]?.id ?? 0
    }
    return t
  })
  const [applying, setApplying] = useState(false)

  const handleApply = async () => {
    setApplying(true)
    const cats = Object.keys(applyCats).filter((k) => applyCats[k])
    await onApply({ categories: cats, targets })
    setApplying(false)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-60" onClick={onClose}>
      <div className="bg-neutral-800 border border-amber-600/50 rounded-lg p-5 w-[420px] shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-neutral-100 font-bold mb-3">Apply Preset</h3>

        {/* Categories */}
        <div className="mb-3">
          <label className="block text-neutral-500 text-xs mb-1">Apply parameters:</label>
          <div className="flex gap-3 flex-wrap">
            {CATEGORIES.filter(({ key }) => savedCats.includes(key)).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1 text-neutral-300 text-xs">
                <input type="checkbox" checked={applyCats[key] ?? false} onChange={() => setApplyCats({ ...applyCats, [key]: !applyCats[key] })} className="accent-amber-500" />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Target MV mapping */}
        <div className="mb-4 space-y-2">
          <label className="block text-neutral-500 text-xs">Apply to:</label>
          {mvs.map((mv: any) => {
            const idx = String(mv.mv_nexx_index)
            return (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-neutral-400 text-xs w-24 truncate">{mv.mv_label || `MV ${mv.mv_nexx_index + 1}`}</span>
                <span className="text-neutral-500 text-xs">&rarr;</span>
                <select
                  value={targets[idx] ?? ''}
                  onChange={(e) => setTargets({ ...targets, [idx]: Number(e.target.value) })}
                  className="flex-1 px-1.5 py-0.5 bg-neutral-700 border border-neutral-600 rounded text-neutral-100 text-xs"
                >
                  {multiviewers.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.label || `MV ${m.nexx_index + 1}`}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 bg-neutral-600 hover:bg-neutral-500 rounded text-white text-sm">Cancel</button>
          <button onClick={handleApply} disabled={applying} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded text-white text-sm">
            {applying ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PresetsModal
