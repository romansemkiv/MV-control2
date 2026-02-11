import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { api } from '../api/client'

type Tab = 'users' | 'access' | 'integrations' | 'status'

function Admin() {
  const { checkAuth } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('users')

  useEffect(() => {
    checkAuth().then(() => {
      const u = useAuthStore.getState().user
      if (!u || u.role !== 'admin') navigate('/login')
    })
  }, [])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'users', label: 'Users' },
    { key: 'access', label: 'Access' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="bg-neutral-800 border-b border-neutral-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-amber-500">MV-Control</span>
          <span className="text-neutral-400">Admin</span>
        </div>
        <button onClick={() => navigate('/main')} className="text-neutral-400 hover:text-neutral-200 text-sm">Back to Main</button>
      </div>

      <div className="flex border-b border-neutral-700">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm ${tab === t.key ? 'text-amber-400 border-b-2 border-amber-400' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'users' && <UsersTab />}
        {tab === 'access' && <AccessTab />}
        {tab === 'integrations' && <IntegrationsTab />}
        {tab === 'status' && <StatusTab />}
      </div>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')

  useEffect(() => { api.getUsers().then(setUsers) }, [])

  const handleCreate = async () => {
    if (!login || !password) return
    await api.createUser({ login, password, role })
    setLogin('')
    setPassword('')
    api.getUsers().then(setUsers)
  }

  const handleDelete = async (id: number) => {
    await api.deleteUser(id)
    api.getUsers().then(setUsers)
  }

  const handleResetPassword = async (id: number) => {
    const newPass = prompt('New password:')
    if (!newPass) return
    await api.updateUser(id, { password: newPass })
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Login" className="px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm">
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button onClick={handleCreate} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded text-white text-sm">Create</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-neutral-400 border-b border-neutral-700">
          <th className="text-left py-2">Login</th><th className="text-left py-2">Role</th><th className="text-right py-2">Actions</th>
        </tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-neutral-800">
              <td className="py-2">{u.login}</td>
              <td className="py-2">{u.role}</td>
              <td className="py-2 text-right">
                <button onClick={() => handleResetPassword(u.id)} className="text-amber-400 hover:text-amber-300 text-xs mr-3">Reset Password</button>
                <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AccessTab() {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [access, setAccess] = useState<{ source_ids: number[]; mv_ids: number[] }>({ source_ids: [], mv_ids: [] })
  const [sources, setSources] = useState<any[]>([])
  const [mvs, setMvs] = useState<any[]>([])

  useEffect(() => {
    api.getUsers().then(setUsers)
    api.getSources().then(setSources)
    api.getMultiviewers().then(setMvs)
  }, [])

  useEffect(() => {
    if (selectedUser) api.getAccess(selectedUser).then(setAccess)
  }, [selectedUser])

  const handleSave = async () => {
    if (!selectedUser) return
    await api.setAccess(selectedUser, access)
  }

  const toggleSource = (id: number) => {
    setAccess((prev) => ({
      ...prev,
      source_ids: prev.source_ids.includes(id)
        ? prev.source_ids.filter((s) => s !== id)
        : [...prev.source_ids, id],
    }))
  }

  const toggleMV = (id: number) => {
    setAccess((prev) => ({
      ...prev,
      mv_ids: prev.mv_ids.includes(id)
        ? prev.mv_ids.filter((m) => m !== id)
        : [...prev.mv_ids, id],
    }))
  }

  return (
    <div>
      <select
        value={selectedUser ?? ''}
        onChange={(e) => setSelectedUser(Number(e.target.value) || null)}
        className="px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm mb-4"
      >
        <option value="">Select user</option>
        {users.filter((u) => u.role !== 'admin').map((u) => (
          <option key={u.id} value={u.id}>{u.login}</option>
        ))}
      </select>

      {selectedUser && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-neutral-400 text-sm mb-2">Sources</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {sources.map((s: any) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={access.source_ids.includes(s.id)} onChange={() => toggleSource(s.id)} className="accent-amber-500" />
                  {s.label || `Input ${s.quartz_input}`}
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-neutral-400 text-sm mb-2">Multiviewers</h3>
            <div className="space-y-1">
              {mvs.map((m: any) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={access.mv_ids.includes(m.id)} onChange={() => toggleMV(m.id)} className="accent-amber-500" />
                  {m.label || `MV ${m.nexx_index + 1}`}
                </label>
              ))}
            </div>
          </div>
          <button onClick={handleSave} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded text-white text-sm w-fit">Save Access</button>
        </div>
      )}
    </div>
  )
}

function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [editingQuartz, setEditingQuartz] = useState(false)
  const [editingNexx, setEditingNexx] = useState(false)
  const [quartzHost, setQuartzHost] = useState('')
  const [quartzPort, setQuartzPort] = useState('6543')
  const [quartzMaxInputs, setQuartzMaxInputs] = useState('960')
  const [quartzMaxOutputs, setQuartzMaxOutputs] = useState('960')
  const [nexxHost, setNexxHost] = useState('')
  const [nexxKey, setNexxKey] = useState('')
  const [quartzStatus, setQuartzStatus] = useState<any>(null)
  const [nexxStatus, setNexxStatus] = useState<any>(null)

  const loadIntegrations = () => {
    api.getIntegrations().then((items) => {
      setIntegrations(items)
      const q = items.find((i: any) => i.protocol === 'quartz')
      const n = items.find((i: any) => i.protocol === 'nexx')
      if (q) {
        setQuartzHost(q.host)
        setQuartzPort(String(q.port ?? 6543))
        setQuartzMaxInputs(String(q.max_inputs ?? 960))
        setQuartzMaxOutputs(String(q.max_outputs ?? 960))
      }
      if (n) { setNexxHost(n.host); setNexxKey(n.api_key ?? '') }
    })
  }

  useEffect(() => { loadIntegrations() }, [])

  const saveQuartz = async () => {
    const res = await api.saveIntegration({
      protocol: 'quartz',
      host: quartzHost,
      port: Number(quartzPort),
      max_inputs: Number(quartzMaxInputs),
      max_outputs: Number(quartzMaxOutputs)
    })
    setQuartzStatus(res.status)
    setEditingQuartz(false)
    loadIntegrations()
  }

  const saveNexx = async () => {
    const res = await api.saveIntegration({ protocol: 'nexx', host: nexxHost, api_key: nexxKey })
    setNexxStatus(res.status)
    setEditingNexx(false)
    loadIntegrations()
  }

  const deleteIntegration = async (protocol: string) => {
    await api.deleteIntegration(protocol)
    if (protocol === 'quartz') setQuartzStatus(null)
    if (protocol === 'nexx') setNexxStatus(null)
    loadIntegrations()
  }

  const quartzIntegration = integrations.find((i) => i.protocol === 'quartz')
  const nexxIntegration = integrations.find((i) => i.protocol === 'nexx')

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Quartz Section */}
      <div>
        <h3 className="text-neutral-300 font-medium mb-2">Quartz (TCP Routing)</h3>

        {quartzIntegration && !editingQuartz ? (
          <div className="p-3 bg-neutral-800 border border-neutral-700 rounded space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-300">{quartzIntegration.host}:{quartzIntegration.port}</p>
                <p className="text-xs text-neutral-500">Max Inputs: {quartzIntegration.max_inputs ?? 'Not set'} | Max Outputs: {quartzIntegration.max_outputs ?? 'Not set'}</p>
                {quartzStatus && (
                  <p className={`text-xs mt-1 ${quartzStatus.ok ? 'text-green-400' : 'text-red-400'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${quartzStatus.ok ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    {quartzStatus.message}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingQuartz(true)} className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs text-white">Edit</button>
                <button onClick={() => deleteIntegration('quartz')} className="px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-xs text-white">Delete</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input value={quartzHost} onChange={(e) => setQuartzHost(e.target.value)} placeholder="IP address" className="px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm flex-1" />
              <input value={quartzPort} onChange={(e) => setQuartzPort(e.target.value)} placeholder="Port" className="px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm w-24" />
            </div>
            <div className="flex gap-2">
              <input
                value={quartzMaxInputs}
                onChange={(e) => setQuartzMaxInputs(e.target.value)}
                placeholder="Max Inputs"
                type="number"
                className="px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm flex-1"
              />
              <input
                value={quartzMaxOutputs}
                onChange={(e) => setQuartzMaxOutputs(e.target.value)}
                placeholder="Max Outputs"
                type="number"
                className="px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm flex-1"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={saveQuartz} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded text-white text-sm">Save & Test</button>
              {quartzIntegration && <button onClick={() => setEditingQuartz(false)} className="px-3 py-1.5 bg-neutral-600 hover:bg-neutral-500 rounded text-white text-sm">Cancel</button>}
            </div>
          </div>
        )}
      </div>

      {/* NEXX Section */}
      <div>
        <h3 className="text-neutral-300 font-medium mb-2">NEXX (REST API Multiviewer)</h3>

        {nexxIntegration && !editingNexx ? (
          <div className="p-3 bg-neutral-800 border border-neutral-700 rounded space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-300">{nexxIntegration.host}</p>
                <p className="text-xs text-neutral-500">API Key: {nexxIntegration.api_key ? '•••••••••' : 'Not set'}</p>
                {nexxStatus && (
                  <p className={`text-xs mt-1 ${nexxStatus.ok ? 'text-green-400' : 'text-red-400'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${nexxStatus.ok ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    {nexxStatus.message}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingNexx(true)} className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs text-white">Edit</button>
                <button onClick={() => deleteIntegration('nexx')} className="px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-xs text-white">Delete</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <input value={nexxHost} onChange={(e) => setNexxHost(e.target.value)} placeholder="IP address" className="px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm" />
            <input value={nexxKey} onChange={(e) => setNexxKey(e.target.value)} placeholder="API Key" className="px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm" />
            <button onClick={saveNexx} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded text-white text-sm">Save & Test</button>
            {nexxIntegration && <button onClick={() => setEditingNexx(false)} className="px-3 py-1.5 bg-neutral-600 hover:bg-neutral-500 rounded text-white text-sm">Cancel</button>}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusTab() {
  const [status, setStatus] = useState<any>(null)
  const [localRefreshing, setLocalRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadStatus = () => {
    api.refreshStatus().then(setStatus).catch(() => {})
  }

  useEffect(() => {
    loadStatus()
    const poll = setInterval(loadStatus, 3000)
    return () => clearInterval(poll)
  }, [])

  const isRunning = status?.is_running || localRefreshing

  const doRefresh = async () => {
    setLocalRefreshing(true)
    setError('')
    try {
      await api.refresh()
      loadStatus()
    } catch (err: any) {
      setError(err.message || 'Refresh failed')
    } finally {
      setLocalRefreshing(false)
    }
  }

  const refreshResult = status?.result

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-neutral-300 font-medium mb-2">System Status</h3>
        {status ? (
          <div className="text-neutral-400 text-sm space-y-1">
            <p>Last refresh: {status.finished_at ? new Date(status.finished_at).toLocaleString() : 'Never'}</p>
            {status.started_by && status.finished_at && <p>By: {status.started_by}</p>}
            {status.is_running && status.started_by && (
              <p className="text-amber-400">Refresh in progress (started by {status.started_by})...</p>
            )}
          </div>
        ) : (
          <p className="text-neutral-500 text-sm">Loading...</p>
        )}
      </div>

      <div>
        <button
          onClick={doRefresh}
          disabled={isRunning}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-600 disabled:cursor-not-allowed rounded text-white text-sm"
        >
          {isRunning ? 'Refreshing...' : 'Refresh State from Equipment'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {refreshResult && !status?.is_running && (
        <div className="space-y-2">
          <h4 className="text-neutral-300 font-medium text-sm">Last Refresh Results:</h4>

          {refreshResult.nexx && (
            <div className={`p-3 rounded border ${
              refreshResult.nexx.error || (refreshResult.nexx.errors?.length > 0)
                ? 'bg-red-900/20 border-red-700'
                : 'bg-green-900/20 border-green-700'
            }`}>
              <p className="text-sm font-medium text-neutral-300">NEXX API</p>
              {refreshResult.nexx.error ? (
                <p className="text-red-400 text-xs mt-1">{refreshResult.nexx.error}</p>
              ) : (
                <>
                  <p className={`text-xs mt-1 ${refreshResult.nexx.errors?.length > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                    Synced {refreshResult.nexx.mvs_synced} multiviewers
                    {refreshResult.nexx.errors?.length > 0 && ` (${refreshResult.nexx.errors.length} errors)`}
                  </p>
                  {refreshResult.nexx.errors?.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      {refreshResult.nexx.errors.slice(0, 5).map((err: string, i: number) => (
                        <p key={i} className="text-red-400 text-xs">{err}</p>
                      ))}
                      {refreshResult.nexx.errors.length > 5 && (
                        <p className="text-red-400 text-xs">...and {refreshResult.nexx.errors.length - 5} more</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {refreshResult.quartz && (
            <div className={`p-3 rounded border ${refreshResult.quartz.error ? 'bg-red-900/20 border-red-700' : 'bg-green-900/20 border-green-700'}`}>
              <p className="text-sm font-medium text-neutral-300">Quartz TCP</p>
              {refreshResult.quartz.error ? (
                <p className="text-red-400 text-xs mt-1">{refreshResult.quartz.error}</p>
              ) : (
                <p className="text-green-400 text-xs mt-1">Synced {refreshResult.quartz.sources_synced} sources, {refreshResult.quartz.routes_synced} routes</p>
              )}
            </div>
          )}

          {refreshResult.errors && refreshResult.errors.length > 0 && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded">
              <p className="text-sm font-medium text-yellow-400">Warnings:</p>
              {refreshResult.errors.map((err: string, i: number) => (
                <p key={i} className="text-yellow-400 text-xs mt-1">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Admin
