'use client'

import { useSIP } from '@/context/SIPContext'
import { Button } from '@/components/ui/button'

export function CallHistory() {
  const { callHistory, makeCall, isRegistered } = useSIP()

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  if (callHistory.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-6 bg-card border border-border rounded-lg text-center">
        <p className="text-muted-foreground">No call history</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-card border border-border rounded-lg">
      <h3 className="text-lg font-semibold">Call History</h3>
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {[...callHistory].reverse().map((call, idx) => (
          <div
            key={`${call.id}-${idx}`}
            className="flex items-center justify-between p-3 bg-background border border-border rounded hover:border-accent/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {call.direction === 'inbound' ? '📥' : '📤'} {call.to}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(call.endTime || new Date())} • {formatDuration(call.duration)}
              </p>
            </div>
            {call.direction === 'inbound' && (
              <Button
                onClick={() => isRegistered && makeCall(call.from)}
                variant="outline"
                size="sm"
                className="ml-2"
              >
                Callback
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
