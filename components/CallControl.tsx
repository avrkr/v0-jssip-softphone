'use client'

import { useState, useEffect } from 'react'
import { useSIP } from '@/context/SIPContext'
import { Button } from '@/components/ui/button'

export function CallControl() {
  const { currentCall, endCall, answerCall, rejectCall, holdCall, resumeCall, transferCall } = useSIP()
  const [callDuration, setCallDuration] = useState(0)
  const [transferNumber, setTransferNumber] = useState('')
  const [showTransfer, setShowTransfer] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (currentCall?.startTime && currentCall.status === 'active') {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - currentCall.startTime!.getTime()) / 1000)
        setCallDuration(duration)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [currentCall?.startTime, currentCall?.status])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentCall) {
    return (
      <div className="flex flex-col gap-4 p-6 bg-card border border-border rounded-lg text-center">
        <p className="text-muted-foreground">No active call</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-card border border-border rounded-lg">
      {/* Call Info */}
      <div className="flex flex-col gap-2 text-center">
        <p className="text-sm text-muted-foreground">
          {currentCall.direction === 'inbound' ? 'Incoming from' : 'Calling'}
        </p>
        <p className="text-2xl font-semibold text-accent">{currentCall.to}</p>
        {currentCall.status === 'connecting' && (
          <p className="text-sm text-accent">Connecting...</p>
        )}
        {currentCall.status === 'active' && (
          <p className="text-sm text-muted-foreground">{formatDuration(callDuration)}</p>
        )}
        {currentCall.status === 'on-hold' && (
          <p className="text-sm text-yellow-500">On Hold</p>
        )}
      </div>

      {/* Answer/Reject (for incoming) */}
      {currentCall.direction === 'inbound' && currentCall.status === 'connecting' && (
        <div className="flex gap-2">
          <Button
            onClick={rejectCall}
            className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            Reject
          </Button>
          <Button
            onClick={answerCall}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Answer
          </Button>
        </div>
      )}

      {/* Active Call Controls */}
      {currentCall.status !== 'connecting' && (
        <div className="flex gap-2">
          {currentCall.status === 'on-hold' ? (
            <Button
              onClick={resumeCall}
              variant="outline"
              className="flex-1"
            >
              Resume
            </Button>
          ) : (
            <Button
              onClick={holdCall}
              variant="outline"
              className="flex-1"
            >
              Hold
            </Button>
          )}

          <Button
            onClick={() => setShowTransfer(!showTransfer)}
            variant="outline"
            className="flex-1"
          >
            Transfer
          </Button>

          <Button
            onClick={endCall}
            className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            End Call
          </Button>
        </div>
      )}

      {/* Transfer Section */}
      {showTransfer && (
        <div className="flex flex-col gap-2 p-3 bg-background border border-border rounded">
          <input
            type="text"
            placeholder="Transfer to..."
            value={transferNumber}
            onChange={(e) => setTransferNumber(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                transferCall(transferNumber)
                setShowTransfer(false)
                setTransferNumber('')
              }}
              disabled={!transferNumber.trim()}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Transfer
            </Button>
            <Button
              onClick={() => {
                setShowTransfer(false)
                setTransferNumber('')
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* End Call Button (for connecting) */}
      {currentCall.status === 'connecting' && currentCall.direction === 'outbound' && (
        <Button
          onClick={endCall}
          className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        >
          Hang Up
        </Button>
      )}
    </div>
  )
}
