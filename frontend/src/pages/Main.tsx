import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useMVStore } from '../stores/mvStore'
import { api } from '../api/client'
import { OUTPUT_FORMAT_LABELS, TEXT_FONT_LABELS, BORDER_PIXEL_VALUES, BORDER_PIXEL_LABELS } from '../protocol-mappings'
import { getLayoutById } from '../data/layouts'
import LayoutCanvas from '../components/LayoutCanvas'
import WindowInspector from '../components/WindowInspector'
import LayoutPreviewModal from '../components/LayoutPreviewModal'
import PresetsModal from '../components/PresetsModal'

function Main() {
  const { user, logout, checkAuth } = useAuthStore()
  const { multiviewers, sources, routing, currentMV, selectedWindow, loadMultiviewers, loadSources, loadRouting, selectMV, selectWindow } = useMVStore()
  const navigate = useNavigate()
  const [showLayoutModal, setShowLayoutModal] = useState(false)
  const [showPresetsModal, setShowPresetsModal] = useState(false)
  const [showMVParams, setShowMVParams] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkAuth().then(() => {
      const u = useAuthStore.getState().user
      if (!u) navigate('/login')
    })
    loadMultiviewers()
    loadSources()
    loadRouting()
  }, [])

  useEffect(() => {
    const poll = setInterval(() => {
      api.refreshStatus().then((s: any) => setRefreshing(s.is_running)).catch(() => {})
    }, 3000)
    return () => clearInterval(poll)
  }, [])

  useEffect(() => {
    if (multiviewers.length > 0 && !currentMV) {
      selectMV(multiviewers[0].id)
    }
  }, [multiviewers])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await api.refresh()
      await loadMultiviewers()
      await loadSources()
      await loadRouting()
      if (currentMV) await selectMV(currentMV.id)
    } catch {}
    setRefreshing(false)
  }

  const handleMVParamChange = async (params: { font?: number; outer_border?: number; inner_border?: number; output_format?: number }) => {
    if (!currentMV) return
    try {
      await api.setMVParams(currentMV.id, params)
      await selectMV(currentMV.id)
    } catch {}
  }

  const handleSelectLayout = async (layoutId: number) => {
    if (!currentMV) return
    await api.setLayout(currentMV.id, layoutId - 1)
    await selectMV(currentMV.id)
    setShowLayoutModal(false)
  }

  const layout = currentMV ? getLayoutById((currentMV.layout ?? 0) + 1) : null
  const selectedWindowData = currentMV?.windows?.find((w: any) => w.window_index === selectedWindow)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-neutral-800 border-b border-x border-neutral-700 px-4 py-2 rounded-b-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-amber-500">MV-Control</span>
            <select
              value={currentMV?.id ?? ''}
              onChange={(e) => e.target.value && selectMV(Number(e.target.value))}
              className="px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-sm"
            >
              <option value="">Select MV</option>
              {multiviewers.map((mv: any) => (
                <option key={mv.id} value={mv.id}>{mv.label || `MV ${mv.nexx_index + 1}`}</option>
              ))}
            </select>
            {currentMV && (
              <button
                onClick={() => setShowMVParams(!showMVParams)}
                className={`px-2 py-1 border rounded text-sm ${showMVParams ? 'bg-neutral-600 border-neutral-500 text-neutral-200' : 'bg-neutral-700 border-neutral-600 text-neutral-400 hover:text-neutral-200'}`}
                title="MV Parameters"
              >
                &#9881;
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPresetsModal(true)}
              disabled={!currentMV}
              className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 rounded text-sm disabled:opacity-50"
            >
              Presets
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 rounded text-sm disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 rounded text-sm">
                Admin
              </button>
            )}
            <span className="text-neutral-400 text-sm">{user?.login}</span>
            <button onClick={handleLogout} className="text-neutral-500 hover:text-neutral-300 text-sm">Logout</button>
          </div>
        </div>

        {/* MV Parameters (collapsible) */}
        {showMVParams && currentMV && (
          <div className="bg-neutral-800/80 border-b border-x border-neutral-700 rounded-b-lg px-4 py-1.5 flex items-center gap-4 flex-wrap">
            <button
              onClick={() => setShowLayoutModal(true)}
              className="px-2 py-0.5 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 rounded text-xs"
            >
              Layout: {currentMV.layout != null ? currentMV.layout + 1 : '?'}
            </button>
            <span className="text-neutral-500 text-xs">Output</span>
            <select
              value={currentMV.output_format ?? 0}
              onChange={(e) => handleMVParamChange({ output_format: Number(e.target.value) })}
              className="px-1.5 py-0.5 bg-neutral-700 border border-neutral-600 rounded text-xs"
            >
              {Object.entries(OUTPUT_FORMAT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <span className="text-neutral-500 text-xs">Font</span>
            <select
              value={currentMV.font ?? 0}
              onChange={(e) => handleMVParamChange({ font: Number(e.target.value) })}
              className="px-1.5 py-0.5 bg-neutral-700 border border-neutral-600 rounded text-xs"
            >
              {Object.entries(TEXT_FONT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <span className="text-neutral-500 text-xs">Outer</span>
            <select
              value={currentMV.outer_border ?? 0}
              onChange={(e) => handleMVParamChange({ outer_border: Number(e.target.value) })}
              className="px-1.5 py-0.5 bg-neutral-700 border border-neutral-600 rounded text-xs"
            >
              {BORDER_PIXEL_VALUES.map((v) => (
                <option key={v} value={v}>{BORDER_PIXEL_LABELS[v]}</option>
              ))}
            </select>
            <span className="text-neutral-500 text-xs">Inner</span>
            <select
              value={currentMV.inner_border ?? 0}
              onChange={(e) => handleMVParamChange({ inner_border: Number(e.target.value) })}
              className="px-1.5 py-0.5 bg-neutral-700 border border-neutral-600 rounded text-xs"
            >
              {BORDER_PIXEL_VALUES.map((v) => (
                <option key={v} value={v}>{BORDER_PIXEL_LABELS[v]}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {!currentMV ? (
          <div className="text-center text-neutral-500 mt-20">Select a multiviewer to begin</div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {layout && (
              <LayoutCanvas
                windows={layout.windows}
                selectedWindow={selectedWindow}
                onSelectWindow={selectWindow}
                mvNexxIndex={currentMV.nexx_index}
                sources={sources}
                routing={routing}
              />
            )}
            {selectedWindow !== null && (
              <div className="w-full max-w-2xl">
                <WindowInspector
                  mvId={currentMV.id}
                  windowIndex={selectedWindow}
                  windowData={selectedWindowData || { window_index: selectedWindow, pcm_bars: 0, umd: [{}, {}, {}] }}
                  sources={sources}
                  mvNexxIndex={currentMV.nexx_index}
                  routing={routing}
                  onUpdate={() => {
                    selectMV(currentMV.id)
                    loadRouting()
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {showLayoutModal && <LayoutPreviewModal onSelect={handleSelectLayout} onClose={() => setShowLayoutModal(false)} />}
      {showPresetsModal && currentMV && (
        <PresetsModal mvId={currentMV.id} multiviewers={multiviewers} routing={routing} onClose={() => setShowPresetsModal(false)} />
      )}
    </div>
  )
}

export default Main
