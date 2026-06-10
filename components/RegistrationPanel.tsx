'use client'

import { useState } from 'react'
import { useSIP } from '@/context/SIPContext'
import { Button } from '@/components/ui/button'

export function RegistrationPanel() {
  const { isRegistered, isRegistering, registrationError, register, unregister, config } = useSIP()
  const [serverUri, setServerUri] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [stunServers, setStunServers] = useState('stun:stun.l.google.com:19302\nstun:stun1.l.google.com:19302')
  const [audioCodec, setAudioCodec] = useState('opus')
  const [dtmfMode, setDtmfMode] = useState('rfc2833')

  const handleRegister = async () => {
    await register(
      {
        serverUri,
        username,
        password,
        displayName: displayName || username,
      },
      {
        stunServers: stunServers.split('\n').filter(s => s.trim()),
        audioCodec,
        dtmfMode: dtmfMode as 'rfc2833' | 'info',
      }
    )
  }

  if (isRegistered) {
    return (
      <div className="flex flex-col gap-4 p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Registered as</p>
            <p className="text-lg font-semibold text-accent">{config?.displayName || config?.username}</p>
            <p className="text-xs text-muted-foreground mt-1">{config?.serverUri}</p>
          </div>
          <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
        </div>
        <Button
          onClick={unregister}
          variant="outline"
          className="w-full"
        >
          Unregister
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-card border border-border rounded-lg">
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            SIP Server (WebSocket URI)
          </label>
          <input
            type="text"
            placeholder="ws://your-sip-server:5066"
            value={serverUri}
            onChange={(e) => setServerUri(e.target.value)}
            disabled={isRegistering}
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Username
          </label>
          <input
            type="text"
            placeholder="extension or username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isRegistering}
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Password
          </label>
          <input
            type="password"
            placeholder="your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isRegistering}
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Display Name (optional)
          </label>
          <input
            type="text"
            placeholder="Your Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isRegistering}
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
          />
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-accent hover:text-accent/80 transition-colors"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Settings
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-3 p-3 bg-background border border-border rounded">
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">
                STUN Servers (one per line)
              </label>
              <textarea
                value={stunServers}
                onChange={(e) => setStunServers(e.target.value)}
                disabled={isRegistering}
                className="w-full px-3 py-2 bg-card border border-border rounded text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:border-accent"
                rows={3}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-2">
                Audio Codec
              </label>
              <select
                value={audioCodec}
                onChange={(e) => setAudioCodec(e.target.value)}
                disabled={isRegistering}
                className="w-full px-3 py-2 bg-card border border-border rounded text-foreground text-xs focus:outline-none focus:border-accent"
              >
                <option>opus</option>
                <option>pcmu</option>
                <option>pcma</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-2">
                DTMF Mode
              </label>
              <select
                value={dtmfMode}
                onChange={(e) => setDtmfMode(e.target.value)}
                disabled={isRegistering}
                className="w-full px-3 py-2 bg-card border border-border rounded text-foreground text-xs focus:outline-none focus:border-accent"
              >
                <option value="rfc2833">RFC 2833</option>
                <option value="info">INFO</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {registrationError && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm">
          {registrationError}
        </div>
      )}

      <Button
        onClick={handleRegister}
        disabled={isRegistering || !serverUri || !username || !password}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
      >
        {isRegistering ? 'Registering...' : 'Register'}
      </Button>
    </div>
  )
}
