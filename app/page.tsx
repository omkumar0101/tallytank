import TanksGame from "@/components/tanks-game"
import { Gamepad2, Info } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-2">
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Game header */}
        <div className="w-full flex items-center justify-center mb-2 md:mb-4">
          <div className="flex items-center gap-4 px-6 py-2 rounded-full shadow-lg" style={{ background: 'transparent' }}>
            <a href="https://x.com/TallyTank_" target="_blank" rel="noopener noreferrer">
              <img src="/twitterlogo.png" alt="Twitter" className="w-8 h-8 md:w-10 md:h-10 object-contain rounded-full border-2 border-white" style={{ marginRight: '0.5rem' }} />
            </a>
            <h1 className="text-2xl md:text-4xl font-bold text-white text-center tracking-wider">TALLY TANK</h1>
            <a href="https://t.me/tallytank" target="_blank" rel="noopener noreferrer">
              <img src="/tglogo.png" alt="Telegram" className="w-8 h-8 md:w-10 md:h-10 object-contain rounded-full border-2 border-white" style={{ marginLeft: '0.5rem' }} />
            </a>
          </div>
        </div>

        {/* Game container with improved styling */}
        <div className="w-full aspect-[4/3] rounded-xl shadow-xl overflow-hidden border-4" style={{ background: 'transparent', borderColor: 'transparent' }}>
          <TanksGame />
        </div>
      </div>
    </main>
  )
}
