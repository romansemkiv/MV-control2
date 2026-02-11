import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useMVStore } from '../stores/mvStore'
import { api } from '../api/client'
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

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await api.refresh()
      await loadMultiviewers()
      await loadRouting()
      if (currentMV) await selectMV(currentMV.id)
    } catch {}
    setRefreshing(false)
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
      <div className="bg-neutral-800 border-b border-neutral-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
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
            <>
              <button
                onClick={() => setShowLayoutModal(true)}
                className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 rounded text-sm"
              >
                Layout: {currentMV.layout != null ? currentMV.layout + 1 : '?'}
              </button>
              <span className="text-neutral-500 text-sm">Font: {currentMV.font ?? '-'}</span>
              <span className="text-neutral-500 text-sm">Border: {currentMV.outer_border ?? '-'}/{currentMV.inner_border ?? '-'}</span>
            </>
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
              />
            )}
            {selectedWindow !== null && selectedWindowData && (
              <div className="w-full max-w-2xl">
                <WindowInspector
                  mvId={currentMV.id}
                  windowIndex={selectedWindow}
                  windowData={selectedWindowData}
                  sources={sources}
                  mvNexxIndex={currentMV.nexx_index}
                  routing={routing}
                  onUpdate={() => selectMV(currentMV.id)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {showLayoutModal && <LayoutPreviewModal onSelect={handleSelectLayout} onClose={() => setShowLayoutModal(false)} />}
      {showPresetsModal && currentMV && (
        <PresetsModal mvId={currentMV.id} mvNexxIndex={currentMV.nexx_index} onClose={() => setShowPresetsModal(false)} />
      )}
    </div>
  )
}

export default Main
