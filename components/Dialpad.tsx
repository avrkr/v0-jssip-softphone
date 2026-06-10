'use client'

import { useState } from 'react'
import { useSIP } from '@/context/SIPContext'
import { Button } from '@/components/ui/button'

export function Dialpad() {
  const { isRegistered, currentCall, makeCall, dtmf } = useSIP()
  const [dialInput, setDialInput] = useState('')

  const handleDial = (digit: string) => {
    if (currentCall) {
      dtmf(digit)
    } else {
      setDialInput(prev => prev + digit)
    }
  }

  const handleCall = () => {
    if (dialInput.trim() && isRegistered) {
      makeCall(dialInput)
      setDialInput('')
    }
  }

  const handleBackspace = () => {
    setDialInput(prev => prev.slice(0, -1))
  }

  const dialpadButtons = [
    { label: '1', letters: '' },
    { label: '2', letters: 'ABC' },
    { label: '3', letters: 'DEF' },
    { label: '4', letters: 'GHI' },
    { label: '5', letters: 'JKL' },
    { label: '6', letters: 'MNO' },
    { label: '7', letters: 'PQRS' },
    { label: '8', letters: 'TUV' },
    { label: '9', letters: 'WXYZ' },
    { label: '*', letters: '' },
    { label: '0', letters: '+' },
    { label: '#', letters: '' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Display */}
      <div className="bg-card border border-border rounded-lg p-4">
        <input
          type="text"
          value={dialInput}
          onChange={(e) => setDialInput(e.target.value)}
          disabled={!isRegistered || currentCall !== null}
          placeholder="Enter number"
          className="w-full text-3xl font-semibold bg-background border border-border rounded px-3 py-3 text-accent text-center focus:outline-none focus:border-accent"
        />
      </div>

      {/* Dialpad Grid */}
      <div className="grid grid-cols-3 gap-2">
        {dialpadButtons.map((btn) => (
          <button
            key={btn.label}
            onClick={() => handleDial(btn.label)}
            disabled={!isRegistered || currentCall !== null}
            className="aspect-square bg-card hover:bg-card/80 border border-border rounded-lg flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-2xl font-semibold text-foreground">{btn.label}</span>
            {btn.letters && <span className="text-xs text-muted-foreground">{btn.letters}</span>}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleCall}
          disabled={!dialInput.trim() || !isRegistered || currentCall !== null}
          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Call
        </Button>
        <Button
          onClick={handleBackspace}
          disabled={!dialInput}
          variant="outline"
          className="flex-1"
        >
          ← Clear
        </Button>
      </div>
    </div>
  )
}
