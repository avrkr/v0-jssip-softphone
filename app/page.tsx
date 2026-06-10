'use client'

import { SIPProvider } from '@/context/SIPContext'
import { RegistrationPanel } from '@/components/RegistrationPanel'
import { CallControl } from '@/components/CallControl'
import { Dialpad } from '@/components/Dialpad'
import { CallHistory } from '@/components/CallHistory'
import { Phone } from 'lucide-react'

function SoftphoneUI() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <Phone className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">SIP Softphone</h1>
            <p className="text-xs text-muted-foreground">Real-time communication</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Registration & Dialpad */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <RegistrationPanel />
            <Dialpad />
          </div>

          {/* Right Column - Call Control & History */}
          <div className="flex flex-col gap-6">
            <CallControl />
            <CallHistory />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          <p>Built with JsSIP • Connect to any SIP server</p>
        </div>
      </footer>
    </div>
  )
}

export default function Page() {
  return (
    <SIPProvider>
      <SoftphoneUI />
    </SIPProvider>
  )
}
