'use client'

import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react'

export interface SIPConfig {
  serverUri: string
  username: string
  password: string
  displayName: string
}

export interface CallInfo {
  id: string
  to: string
  from: string
  startTime?: Date
  endTime?: Date
  duration?: number
  direction: 'inbound' | 'outbound'
  status: 'connecting' | 'active' | 'on-hold' | 'ended'
}

export interface AdvancedSettings {
  sipHeaders: Record<string, string>
  audioCodec: string
  dtmfMode: 'rfc2833' | 'info'
  enableICE: boolean
  stunServers: string[]
}

interface SIPContextType {
  isRegistered: boolean
  isRegistering: boolean
  currentCall: CallInfo | null
  callHistory: CallInfo[]
  registrationError: string | null
  config: SIPConfig | null
  advancedSettings: AdvancedSettings
  
  register: (config: SIPConfig, advancedSettings?: Partial<AdvancedSettings>) => Promise<void>
  unregister: () => Promise<void>
  makeCall: (destination: string) => Promise<void>
  endCall: () => Promise<void>
  answerCall: () => Promise<void>
  rejectCall: () => Promise<void>
  holdCall: () => Promise<void>
  resumeCall: () => Promise<void>
  transferCall: (destination: string) => Promise<void>
  dtmf: (digit: string) => Promise<void>
  setAdvancedSettings: (settings: Partial<AdvancedSettings>) => void
}

const SIPContext = createContext<SIPContextType | undefined>(undefined)

let sipUA: any = null
let currentSession: any = null
let incomingSession: any = null
let remoteAudio: HTMLAudioElement | null = null
let localStream: MediaStream | null = null

export function SIPProvider({ children }: { children: React.ReactNode }) {
  const [isRegistered, setIsRegistered] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [currentCall, setCurrentCall] = useState<CallInfo | null>(null)
  const [callHistory, setCallHistory] = useState<CallInfo[]>([])
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [config, setConfig] = useState<SIPConfig | null>(null)
  const [advancedSettings, setAdvancedSettingsState] = useState<AdvancedSettings>({
    sipHeaders: {},
    audioCodec: 'opus',
    dtmfMode: 'rfc2833',
    enableICE: true,
    stunServers: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const registrationPromiseRef = useRef<{ resolve?: () => void; reject?: (error: Error) => void } | null>(null)

  // Initialize JsSIP
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/gh/versatica/JsSIP@3.7.4/dist/jssip.min.js'
    script.async = true
    script.onload = () => {
      console.log('[v0] JsSIP loaded successfully')
    }
    document.body.appendChild(script)
    return () => {
      script.remove()
    }
  }, [])

  // Create audio element
  useEffect(() => {
    const audio = new Audio()
    audio.autoplay = true
    document.body.appendChild(audio)
    remoteAudio = audio
    audioRef.current = audio

    return () => {
      audio.remove()
    }
  }, [])

  const register = useCallback(async (newConfig: SIPConfig, newAdvancedSettings?: Partial<AdvancedSettings>) => {
    try {
      setIsRegistering(true)
      setRegistrationError(null)
      setConfig(newConfig)

      if (newAdvancedSettings) {
        setAdvancedSettingsState(prev => ({ ...prev, ...newAdvancedSettings }))
      }

      // Wait for JsSIP to be loaded
      let attempts = 0
      while (typeof (window as any).JsSIP === 'undefined' && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }

      if (typeof (window as any).JsSIP === 'undefined') {
        throw new Error('JsSIP failed to load')
      }

      const JsSIP = (window as any).JsSIP

      // Create user agent
      const socket = new JsSIP.WebSocketInterface(newConfig.serverUri)

      sipUA = new JsSIP.UA({
        uri: `sip:${newConfig.username}@${new URL(newConfig.serverUri).hostname}`,
        password: newConfig.password,
        display_name: newConfig.displayName,
        sockets: [socket],
        register: true,
        register_expires: 600,
        use_preloaded_route: true,
        no_answer_timeout: 30000,
        mediaConstraints: {
          audio: true,
          video: false,
        },
        pcConfig: {
          iceServers: newAdvancedSettings?.stunServers?.map(server => ({
            urls: [server]
          })) || advancedSettings.stunServers.map(server => ({
            urls: [server]
          })),
        },
      })

      // Event handlers
      sipUA.on('connected', () => {
        console.log('[v0] SIP UA connected')
      })

      sipUA.on('disconnected', () => {
        console.log('[v0] SIP UA disconnected')
        setIsRegistered(false)
      })

      sipUA.on('registered', () => {
        console.log('[v0] SIP registered')
        setIsRegistered(true)
        setIsRegistering(false)
        if (registrationPromiseRef.current?.resolve) {
          registrationPromiseRef.current.resolve()
        }
      })

      sipUA.on('unregistered', () => {
        console.log('[v0] SIP unregistered')
        setIsRegistered(false)
      })

      sipUA.on('registrationFailed', (ev: any) => {
        console.log('[v0] Registration failed:', ev.cause)
        const errorMsg = ev.cause || 'Registration failed'
        setRegistrationError(errorMsg)
        setIsRegistering(false)
        if (registrationPromiseRef.current?.reject) {
          registrationPromiseRef.current.reject(new Error(errorMsg))
        }
      })

      sipUA.on('newRTCSession', (ev: any) => {
        console.log('[v0] New RTC session:', ev)
        const session = ev.session

        if (session.direction === 'incoming') {
          incomingSession = session
          const remoteURI = session.remote_identity.uri.toString()
          setCurrentCall({
            id: session.id,
            to: newConfig.username,
            from: remoteURI,
            direction: 'inbound',
            status: 'connecting',
          })
          return
        }

        currentSession = session
        const peerConnection = session.peerconnection

        // Handle ICE candidates
        peerConnection.onicecandidate = (event: any) => {
          console.log('[v0] ICE candidate:', event.candidate)
        }

        // Handle connection established
        peerConnection.onconnectionstatechange = () => {
          console.log('[v0] Connection state:', peerConnection.connectionState)
          if (peerConnection.connectionState === 'connected' || peerConnection.connectionState === 'completed') {
            setCurrentCall(prev => prev ? { ...prev, status: 'active', startTime: new Date() } : null)
          }
        }

        // Handle incoming stream
        peerConnection.ontrack = (event: any) => {
          console.log('[v0] Received remote track:', event.track.kind)
          if (remoteAudio && event.streams[0]) {
            remoteAudio.srcObject = event.streams[0]
          }
        }

        // Handle session events
        session.on('progress', () => {
          console.log('[v0] Call progress')
        })

        session.on('accepted', () => {
          console.log('[v0] Call accepted')
          setCurrentCall(prev => prev ? { ...prev, status: 'active', startTime: new Date() } : null)
        })

        session.on('failed', (ev: any) => {
          console.log('[v0] Call failed:', ev)
          endCallInternal()
        })

        session.on('ended', () => {
          console.log('[v0] Call ended')
          endCallInternal()
        })

        session.on('hold', () => {
          console.log('[v0] Call held')
          setCurrentCall(prev => prev ? { ...prev, status: 'on-hold' } : null)
        })

        session.on('unhold', () => {
          console.log('[v0] Call resumed')
          setCurrentCall(prev => prev ? { ...prev, status: 'active' } : null)
        })
      })

      sipUA.start()

      // Wait for registration with timeout
      await new Promise<void>((resolve, reject) => {
        registrationPromiseRef.current = { resolve, reject }
        const timeout = setTimeout(() => {
          registrationPromiseRef.current = null
          reject(new Error('Registration timeout - could not reach SIP server. Check your server URI and network connection.'))
        }, 10000)
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Registration error:', message)
      setRegistrationError(message)
      setIsRegistering(false)
      if (sipUA) {
        try {
          sipUA.stop()
          sipUA = null
        } catch (e) {
          console.error('[v0] Error stopping UA:', e)
        }
      }
    }
  }, [advancedSettings.stunServers])

  const unregister = useCallback(async () => {
    try {
      if (sipUA) {
        sipUA.unregister()
        sipUA.stop()
        sipUA = null
        currentSession = null
        incomingSession = null
        setIsRegistered(false)
        setConfig(null)
      }
    } catch (error) {
      console.error('[v0] Unregister error:', error)
    }
  }, [])

  const makeCall = useCallback(async (destination: string) => {
    try {
      if (!sipUA || !isRegistered) {
        throw new Error('SIP not registered')
      }

      const uri = destination.includes('@') ? destination : `${destination}@${config?.serverUri.split('@')[1] || 'localhost'}`

      setCurrentCall({
        id: Math.random().toString(),
        to: destination,
        from: config?.username || 'unknown',
        direction: 'outbound',
        status: 'connecting',
      })

      const options = {
        mediaConstraints: {
          audio: true,
          video: false,
        },
        pcConfig: {
          iceServers: advancedSettings.stunServers.map(server => ({
            urls: [server]
          })),
        },
      }

      sipUA.call(uri, options)
    } catch (error) {
      console.error('[v0] Make call error:', error)
      setCurrentCall(null)
    }
  }, [isRegistered, config, advancedSettings.stunServers])

  const endCallInternal = () => {
    if (currentCall) {
      const duration = currentCall.startTime 
        ? Math.floor((Date.now() - currentCall.startTime.getTime()) / 1000)
        : 0
      
      setCallHistory(prev => [...prev, {
        ...currentCall,
        status: 'ended',
        endTime: new Date(),
        duration,
      }])
    }
    setCurrentCall(null)
    if (remoteAudio) {
      remoteAudio.srcObject = null
    }
  }

  const endCall = useCallback(async () => {
    try {
      if (currentSession) {
        currentSession.terminate()
      } else if (incomingSession) {
        incomingSession.terminate()
      }
      endCallInternal()
    } catch (error) {
      console.error('[v0] End call error:', error)
    }
  }, [])

  const answerCall = useCallback(async () => {
    try {
      if (incomingSession) {
        const options = {
          mediaConstraints: {
            audio: true,
            video: false,
          },
          pcConfig: {
            iceServers: advancedSettings.stunServers.map(server => ({
              urls: [server]
            })),
          },
        }
        incomingSession.answer(options)
        currentSession = incomingSession
        incomingSession = null
        setCurrentCall(prev => prev ? { ...prev, status: 'active', startTime: new Date() } : null)
      }
    } catch (error) {
      console.error('[v0] Answer call error:', error)
    }
  }, [advancedSettings.stunServers])

  const rejectCall = useCallback(async () => {
    try {
      if (incomingSession) {
        incomingSession.reject()
        incomingSession = null
        setCurrentCall(null)
      }
    } catch (error) {
      console.error('[v0] Reject call error:', error)
    }
  }, [])

  const holdCall = useCallback(async () => {
    try {
      if (currentSession) {
        currentSession.hold()
      }
    } catch (error) {
      console.error('[v0] Hold call error:', error)
    }
  }, [])

  const resumeCall = useCallback(async () => {
    try {
      if (currentSession) {
        currentSession.unhold()
      }
    } catch (error) {
      console.error('[v0] Resume call error:', error)
    }
  }, [])

  const transferCall = useCallback(async (destination: string) => {
    try {
      if (currentSession) {
        const uri = destination.includes('@') ? destination : `${destination}@${config?.serverUri.split('@')[1] || 'localhost'}`
        currentSession.refer(uri)
      }
    } catch (error) {
      console.error('[v0] Transfer call error:', error)
    }
  }, [config])

  const dtmf = useCallback(async (digit: string) => {
    try {
      if (currentSession && currentCall?.status === 'active') {
        currentSession.sendDTMF(digit)
      }
    } catch (error) {
      console.error('[v0] DTMF error:', error)
    }
  }, [currentCall])

  const setAdvancedSettings = useCallback((settings: Partial<AdvancedSettings>) => {
    setAdvancedSettingsState(prev => ({ ...prev, ...settings }))
  }, [])

  return (
    <SIPContext.Provider
      value={{
        isRegistered,
        isRegistering,
        currentCall,
        callHistory,
        registrationError,
        config,
        advancedSettings,
        register,
        unregister,
        makeCall,
        endCall,
        answerCall,
        rejectCall,
        holdCall,
        resumeCall,
        transferCall,
        dtmf,
        setAdvancedSettings,
      }}
    >
      {children}
    </SIPContext.Provider>
  )
}

export function useSIP() {
  const context = useContext(SIPContext)
  if (context === undefined) {
    throw new Error('useSIP must be used within a SIPProvider')
  }
  return context
}
