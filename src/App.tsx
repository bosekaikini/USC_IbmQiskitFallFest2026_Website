import { useEffect, useRef, useState, useCallback } from "react"
import logo from "./imports/qff_logo.png"

// ─── Types ──────────────────────────────────────────────────────────────────

type Gate = "H" | "X" | "Y" | "Z" | "S" | "T" | "CNOT"
type CircuitGate = { gate: Gate; qubit: number; control?: number; col: number }

// ─── Quantum Animation Canvas ────────────────────────────────────────────────

function QuantumCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    let raf: number
    let W = 0,
      H = 0

    type Particle = {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      phase: number
      speed: number
      color: string
      entangled?: number
    }

    // one restrained accent family instead of a rainbow — keeps the field feeling
    // like a single continuous surface rather than a cluster of hackathon neons
    const PALETTE = ["#7c6cf6", "#4fd8c4", "#a89bf9", "#6bc9ba"]
    const particles: Particle[] = []
    let time = 0

    function resize() {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = W
      canvas.height = H
    }

    function init() {
      particles.length = 0
      const count = Math.min(42, Math.floor((W * H) / 26000))
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 1.6 + Math.random() * 2.2,
          phase: Math.random() * Math.PI * 2,
          speed: 0.006 + Math.random() * 0.012,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          entangled:
            Math.random() > 0.65 ? Math.floor(Math.random() * count) : undefined,
        })
      }
    }

    function hexToRgb(hex: string) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `${r},${g},${b}`
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      time += 0.016

      // Draw entanglement lines
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (
          p.entangled !== undefined &&
          p.entangled < particles.length &&
          p.entangled !== i
        ) {
          const q = particles[p.entangled]
          const dx = q.x - p.x,
            dy = q.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 260) {
            const alpha = (1 - dist / 260) * 0.16
            ctx.save()
            ctx.strokeStyle = `rgba(${hexToRgb(p.color)},${alpha})`
            ctx.lineWidth = 0.7
            ctx.setLineDash([3, 7])
            ctx.lineDashOffset = -time * 10
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            const mx = (p.x + q.x) / 2 + Math.sin(time + i) * 26
            const my = (p.y + q.y) / 2 + Math.cos(time + i) * 26
            ctx.quadraticCurveTo(mx, my, q.x, q.y)
            ctx.stroke()
            ctx.restore()
          }
        }
      }

      // Draw nearby connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - particles[i].x
          const dy = particles[j].y - particles[i].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.08
            ctx.strokeStyle = `rgba(124,108,246,${alpha})`
            ctx.lineWidth = 0.5
            ctx.setLineDash([])
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw particles (qubits)
      for (const p of particles) {
        p.phase += p.speed
        const wobble = Math.sin(p.phase) * 14
        p.x += p.vx + Math.cos(p.phase * 0.7) * 0.12
        p.y += p.vy + Math.sin(p.phase * 0.5) * 0.12

        if (p.x < -20) p.x = W + 20
        if (p.x > W + 20) p.x = -20
        if (p.y < -20) p.y = H + 20
        if (p.y > H + 20) p.y = -20

        const rx = p.x + wobble * 0.3
        const ry = p.y + wobble * 0.2

        ctx.save()
        ctx.strokeStyle = `rgba(${hexToRgb(p.color)},0.12)`
        ctx.lineWidth = 0.7
        ctx.beginPath()
        ctx.arc(rx, ry, p.r + 5 + Math.sin(p.phase * 1.4) * 2.5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()

        const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, p.r * 2.4)
        grad.addColorStop(0, `rgba(${hexToRgb(p.color)},0.8)`)
        grad.addColorStop(0.5, `rgba(${hexToRgb(p.color)},0.28)`)
        grad.addColorStop(1, `rgba(${hexToRgb(p.color)},0)`)
        ctx.beginPath()
        ctx.arc(rx, ry, p.r * 2.4, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        ctx.beginPath()
        ctx.arc(rx, ry, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(() => {
      resize()
      init()
    })
    ro.observe(canvas)
    resize()
    init()
    draw()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  )
}

// ─── Gate definitions ────────────────────────────────────────────────────────

type GateInfo = {
  id: Gate
  label: string
  color: string
  name: string
  short: string
  desc: string
  matrix: string[][]
}

const GATES: GateInfo[] = [
  {
    id: "H",
    label: "H",
    color: "var(--color-q-violet)",
    name: "Hadamard",
    short: "Superposition",
    desc: "Rotates a qubit into an equal superposition of |0⟩ and |1⟩. It's the gate that takes a definite classical bit and makes it genuinely quantum — the starting move of almost every algorithm.",
    matrix: [
      ["1/√2", "1/√2"],
      ["1/√2", "−1/√2"],
    ],
  },
  {
    id: "X",
    label: "X",
    color: "var(--color-q-aqua)",
    name: "Pauli-X",
    short: "Bit flip",
    desc: "The quantum equivalent of a classical NOT gate — swaps the amplitudes of |0⟩ and |1⟩. Geometrically, it's a 180° rotation of the qubit around the X axis of the Bloch sphere.",
    matrix: [
      ["0", "1"],
      ["1", "0"],
    ],
  },
  {
    id: "Z",
    label: "Z",
    color: "var(--color-q-rose)",
    name: "Pauli-Z",
    short: "Phase flip",
    desc: "Leaves |0⟩ untouched but flips the sign of |1⟩. Invisible on its own to a measurement, but it changes how a qubit interferes with others — essential for algorithms built on interference.",
    matrix: [
      ["1", "0"],
      ["0", "−1"],
    ],
  },
  {
    id: "S",
    label: "S",
    color: "var(--color-q-blue)",
    name: "S gate",
    short: "π/2 phase",
    desc: "A quarter-turn phase rotation — half of a Z gate. Two S gates in a row equal one Z gate. Used to fine-tune the relative phase between |0⟩ and |1⟩.",
    matrix: [
      ["1", "0"],
      ["0", "i"],
    ],
  },
  {
    id: "T",
    label: "T",
    color: "var(--color-q-amber)",
    name: "T gate",
    short: "π/4 phase",
    desc: "An eighth-turn phase rotation — half of an S gate. Combined with H and CNOT, T gates form a universal gate set capable of approximating any quantum operation.",
    matrix: [
      ["1", "0"],
      ["0", "eiπ/4"],
    ],
  },
  {
    id: "CNOT",
    label: "⊕",
    color: "var(--color-q-accent-2)",
    name: "CNOT",
    short: "Entanglement",
    desc: "Flips a target qubit only when a control qubit is |1⟩. Applied to a qubit in superposition, it creates entanglement — correlations between qubits with no classical equivalent.",
    matrix: [
      ["1", "0", "0", "0"],
      ["0", "1", "0", "0"],
      ["0", "0", "0", "1"],
      ["0", "0", "1", "0"],
    ],
  },
]

const NUM_QUBITS = 3
const MAX_COLS = 6

function applyCircuit(gates: CircuitGate[]): Record<string, number> {
  // Simplified simulation: track |ψ⟩ as amplitude map
  type State = Record<string, number>

  // Start with |000⟩
  let state: State = { "000": 1.0 }

  for (const g of gates) {
    const next: State = {}

    if (g.gate === "H") {
      for (const [basis, amp] of Object.entries(state)) {
        const bit = parseInt(basis[g.qubit])
        const flip =
          basis.slice(0, g.qubit) + (1 - bit) + basis.slice(g.qubit + 1)
        const same = basis
        next[same] = (next[same] ?? 0) + amp / Math.SQRT2
        next[flip] =
          (next[flip] ?? 0) + ((bit === 0 ? 1 : -1) * amp) / Math.SQRT2
      }
    } else if (g.gate === "X") {
      for (const [basis, amp] of Object.entries(state)) {
        const bit = parseInt(basis[g.qubit])
        const flip =
          basis.slice(0, g.qubit) + (1 - bit) + basis.slice(g.qubit + 1)
        next[flip] = (next[flip] ?? 0) + amp
      }
    } else if (g.gate === "Z") {
      for (const [basis, amp] of Object.entries(state)) {
        const bit = parseInt(basis[g.qubit])
        next[basis] = (next[basis] ?? 0) + (bit === 1 ? -amp : amp)
      }
    } else if (g.gate === "CNOT" && g.control !== undefined) {
      for (const [basis, amp] of Object.entries(state)) {
        const ctrl = parseInt(basis[g.control!])
        if (ctrl === 1) {
          const bit = parseInt(basis[g.qubit])
          const flip =
            basis.slice(0, g.qubit) + (1 - bit) + basis.slice(g.qubit + 1)
          next[flip] = (next[flip] ?? 0) + amp
        } else {
          next[basis] = (next[basis] ?? 0) + amp
        }
      }
    } else {
      // S, T — phase gates (just pass through for visualization)
      for (const [basis, amp] of Object.entries(state)) {
        next[basis] = (next[basis] ?? 0) + amp
      }
    }

    state = next
  }

  // Convert to probabilities
  const probs: Record<string, number> = {}
  let total = 0
  for (const [k, v] of Object.entries(state)) {
    probs[k] = v * v
    total += v * v
  }
  // Normalize
  if (total > 0) {
    for (const k of Object.keys(probs)) probs[k] /= total
  }
  return probs
}

// ─── Gate info popover ───────────────────────────────────────────────────────

function GateInfoCard({ info }: { info: GateInfo }) {
  return (
    <div
      className="pop-in rounded-2xl p-5 md:p-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        border: "1px solid var(--color-q-border)",
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-mono text-lg font-medium"
          style={{
            background: `${info.color}1c`,
            border: `1px solid ${info.color}55`,
            color: info.color,
          }}
        >
          {info.label}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h4 className="font-serif text-lg text-[var(--color-q-text)]">
              {info.name}
            </h4>
            <span
              className="font-mono text-[10px] tracking-widest uppercase"
              style={{ color: info.color }}
            >
              {info.short}
            </span>
          </div>
          <p className="text-sm text-[var(--color-q-text-dim)] leading-relaxed mt-2">
            {info.desc}
          </p>
        </div>

        {/* Matrix */}
        <div className="hidden sm:flex flex-col items-center justify-center shrink-0 pl-4 ml-1 border-l border-[var(--color-q-border)]">
          <div
            className="font-mono text-[11px] leading-tight grid gap-x-3 gap-y-1"
            style={{
              gridTemplateColumns: `repeat(${info.matrix[0].length}, auto)`,
              color: "var(--color-q-text-dim)",
            }}
          >
            {info.matrix.flat().map((v, i) => (
              <span key={i} className="text-center">
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Quantum Circuit Widget ──────────────────────────────────────────────────

function QuantumCircuit() {
  const [gates, setGates] = useState<CircuitGate[]>([])
  const [selectedGate, setSelectedGate] = useState<Gate>("H")
  const [selectedControl, setSelectedControl] = useState<number | null>(null)
  const [probs, setProbs] = useState<Record<string, number>>({})
  const [infoGate, setInfoGate] = useState<Gate | null>("H")
  const [activePlaced, setActivePlaced] = useState<number | null>(null)

  const nextCol = useCallback(() => {
    if (gates.length === 0) return 0
    return Math.min(MAX_COLS - 1, Math.max(...gates.map((g) => g.col)) + 1)
  }, [gates])

  const addGate = useCallback(
    (qubit: number) => {
      const col = nextCol()
      if (col >= MAX_COLS) return

      if (selectedGate === "CNOT") {
        if (selectedControl === null) {
          setSelectedControl(qubit)
          return
        }
        if (selectedControl === qubit) {
          setSelectedControl(null)
          return
        }
        const g: CircuitGate = {
          gate: "CNOT",
          qubit,
          control: selectedControl,
          col,
        }
        const updated = [...gates, g]
        setGates(updated)
        setProbs(applyCircuit(updated))
        setSelectedControl(null)
        return
      }

      const g: CircuitGate = { gate: selectedGate, qubit, col }
      const updated = [...gates, g]
      setGates(updated)
      setProbs(applyCircuit(updated))
    },
    [selectedGate, selectedControl, gates, nextCol],
  )

  const reset = () => {
    setGates([])
    setProbs({})
    setSelectedControl(null)
    setActivePlaced(null)
  }

  const removeGate = (idx: number) => {
    const updated = gates.filter((_, i) => i !== idx)
    setGates(updated)
    setProbs(applyCircuit(updated))
    setActivePlaced(null)
  }

  const topStates = Object.entries(probs)
    .filter(([, v]) => v > 0.005)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const activeInfo = GATES.find((g) => g.id === infoGate)
  const activePlacedGate =
    activePlaced !== null ? gates[activePlaced] : undefined
  const activePlacedInfo = activePlacedGate
    ? GATES.find((g) => g.id === activePlacedGate.gate)
    : undefined

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <span className="font-mono text-[11px] text-[var(--color-q-accent-2)] tracking-[0.2em] uppercase">
          Quantum circuit
        </span>
        <div className="flex-1 h-px bg-[var(--color-q-border)]" />
        <button
          onClick={reset}
          className="font-mono text-[11px] text-[var(--color-q-text-dim)] hover:text-[var(--color-q-text)] transition-colors px-3 py-1.5 border border-[var(--color-q-border)] hover:border-[var(--color-q-accent)] rounded-full"
        >
          reset
        </button>
      </div>

      {/* Gate palette */}
      <div className="flex flex-wrap gap-2 mb-3">
        {GATES.map((g) => (
          <button
            key={g.id}
            onClick={() => {
              setSelectedGate(g.id)
              setSelectedControl(null)
              setInfoGate((cur) => (cur === g.id ? null : g.id))
              setActivePlaced(null)
            }}
            className="relative group flex items-center gap-2 px-3.5 py-2 rounded-full font-mono text-sm transition-all"
            style={{
              background:
                selectedGate === g.id ? `${g.color}18` : "transparent",
              border: `1px solid ${
                selectedGate === g.id ? g.color : "var(--color-q-border)"
              }`,
              color: selectedGate === g.id ? g.color : "var(--color-q-text-dim)",
            }}
          >
            <span style={{ color: g.color }}>{g.label}</span>
            <span className="text-xs hidden sm:inline opacity-70">{g.id}</span>
          </button>
        ))}
      </div>
      <p className="font-mono text-[10px] text-[var(--color-q-muted)] mb-5 tracking-wide">
        tap a gate to learn what it does, then place it on a wire
      </p>

      {/* Info card for selected palette gate */}
      {activeInfo && (
        <div className="mb-5">
          <GateInfoCard info={activeInfo} />
        </div>
      )}

      {selectedGate === "CNOT" && (
        <div className="mb-3 text-xs font-mono text-[var(--color-q-amber)]">
          {selectedControl === null
            ? "→ click a qubit to set the control"
            : `→ control set on q${selectedControl} — click the target qubit`}
        </div>
      )}

      {/* Circuit grid */}
      <div className="rounded-2xl border border-[var(--color-q-border)] bg-[var(--color-q-dark)] p-5 mb-4">
        {Array.from({ length: NUM_QUBITS }, (_, qi) => (
          <div key={qi} className="flex items-center gap-0 mb-4 last:mb-0">
            <span className="font-mono text-xs text-[var(--color-q-text-dim)] w-8 shrink-0">
              q{qi}
            </span>
            {/* Wire */}
            <div
              className="relative flex items-center flex-1"
              style={{ minHeight: 36 }}
            >
              <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-[var(--color-q-border)]" />
              {/* Placed gates */}
              {gates.map((g, idx) => {
                if (g.qubit !== qi && !(g.gate === "CNOT" && g.control === qi))
                  return null
                const isCnotControl = g.gate === "CNOT" && g.control === qi
                const isCnotTarget = g.gate === "CNOT" && g.qubit === qi
                const gi = GATES.find((x) => x.id === g.gate)
                const color = gi?.color ?? "var(--color-q-text-dim)"
                const left = `${(g.col / MAX_COLS) * 100}%`
                const isActive = activePlaced === idx
                return (
                  <button
                    key={idx}
                    onClick={() =>
                      setActivePlaced((cur) => (cur === idx ? null : idx))
                    }
                    className="absolute gate-pop flex items-center justify-center rounded-lg font-mono text-xs font-medium z-10 hover:scale-110 transition-transform"
                    style={{
                      left,
                      width: 28,
                      height: 28,
                      marginLeft: -14,
                      background: isCnotControl
                        ? "transparent"
                        : isActive
                          ? `${color}33`
                          : `${color}18`,
                      border: `1.5px solid ${color}`,
                      color,
                      boxShadow: isActive ? `0 0 0 3px ${color}22` : "none",
                    }}
                  >
                    {isCnotControl
                      ? "●"
                      : isCnotTarget
                        ? "⊕"
                        : gi?.label}
                  </button>
                )
              })}
              {/* Click zones */}
              {Array.from({ length: MAX_COLS }, (_, ci) => (
                <button
                  key={ci}
                  onClick={() => addGate(qi)}
                  className="absolute flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-0"
                  style={{
                    left: `${(ci / MAX_COLS) * 100}%`,
                    width: 28,
                    height: 28,
                    marginLeft: -14,
                  }}
                >
                  <span className="text-[var(--color-q-muted)] text-base">+</span>
                </button>
              ))}
              {/* Add button at end */}
              <button
                onClick={() => addGate(qi)}
                className="absolute right-0 flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-[var(--color-q-border)] hover:border-[var(--color-q-accent-2)] text-[var(--color-q-muted)] hover:text-[var(--color-q-accent-2)] transition-colors font-mono text-xs z-10"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info card for a placed gate the user clicked */}
      {activePlacedInfo && activePlacedGate && (
        <div className="mb-4">
          <GateInfoCard info={activePlacedInfo} />
          <button
            onClick={() => removeGate(activePlaced!)}
            className="mt-2 font-mono text-[11px] text-[var(--color-q-text-dim)] hover:text-[var(--color-q-rose)] transition-colors px-3 py-1.5 border border-[var(--color-q-border)] hover:border-[var(--color-q-rose)] rounded-full"
          >
            remove this gate
          </button>
        </div>
      )}

      {/* Output probabilities */}
      {topStates.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-q-border)] bg-[var(--color-q-dark)] p-5">
          <div className="font-mono text-[11px] text-[var(--color-q-text-dim)] mb-4 tracking-[0.2em] uppercase">
            Measurement output
          </div>
          <div className="space-y-2.5">
            {topStates.map(([state, prob]) => (
              <div key={state} className="flex items-center gap-3">
                <span className="font-mono text-xs text-[var(--color-q-accent-2)] w-11">
                  |{state}⟩
                </span>
                <div className="flex-1 h-2 bg-[var(--color-q-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${prob * 100}%`,
                      background:
                        "linear-gradient(90deg, var(--color-q-accent), var(--color-q-accent-2))",
                    }}
                  />
                </div>
                <span className="font-mono text-xs text-[var(--color-q-text-dim)] w-12 text-right">
                  {(prob * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {topStates.length === 0 && gates.length === 0 && (
        <p className="text-center font-mono text-xs text-[var(--color-q-muted)] py-2">
          click + on any qubit wire to place a gate
        </p>
      )}
    </div>
  )
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(8,8,11,0.85)" : "transparent",
        borderBottom: scrolled
          ? "1px solid var(--color-q-border)"
          : "1px solid transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
      }}
    >
      <div className="flex items-center gap-6">
        {["about", "schedule", "register"].map((s) => (
          <a
            key={s}
            href={`#${s}`}
            className="font-mono text-xs text-[var(--color-q-text-dim)] hover:text-[var(--color-q-text)] transition-colors tracking-widest uppercase"
          >
            {s}
          </a>
        ))}
      </div>

      {/* logo — the only place it appears on the whole site */}
      <a href="#top" className="flex items-center gap-2.5 shrink-0">
        <span className="hidden sm:inline font-mono text-xs text-[var(--color-q-text-dim)] tracking-wider">
          Qiskit Fall Fest 2026
        </span>
        <img
          src={logo}
          alt="Qiskit Fall Fest 2026"
          className="w-9 h-9 rounded-full object-cover"
          style={{ boxShadow: "0 0 0 1px var(--color-q-border)" }}
        />
      </a>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6"
    >
      <QuantumCanvas />

      {/* Radial vignette — seamless fade into the page rather than a hard panel edge */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 42%, transparent 10%, #08080b 100%)",
        }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto pt-24">
        <span className="inline-block font-mono text-[11px] text-[var(--color-q-accent-2)] tracking-[0.3em] uppercase mb-6">
          IBM Quantum · University of South Carolina
        </span>

        <h1 className="font-serif font-light text-[var(--color-q-text)] text-5xl md:text-7xl leading-[1.05] mb-6">
          Qiskit Fall Fest
          <br />
          <span
            style={{
              background:
                "linear-gradient(135deg, var(--color-q-accent), var(--color-q-accent-2))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            2026
          </span>
        </h1>

        <p className="font-mono text-xs text-[var(--color-q-muted)] tracking-widest mb-3 uppercase">
          Columbia, SC · Nov 6–8, 2026
        </p>

        <p className="font-mono text-[11px] text-[var(--color-q-text-dim)] tracking-widest mb-12 uppercase">
          Opening ceremony 6 PM Fri · Submissions 9 AM Sun · Closes 12 PM Sun
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <a
            href="#register"
            className="px-8 py-3.5 rounded-full font-mono text-sm font-medium transition-all hover:brightness-110"
            style={{
              background:
                "linear-gradient(135deg, var(--color-q-accent), var(--color-q-accent-2))",
              color: "#08080b",
            }}
          >
            Register Now
          </a>
          <a
            href="#about"
            className="px-8 py-3.5 rounded-full font-mono text-sm font-medium border border-[var(--color-q-border)] text-[var(--color-q-text-dim)] hover:border-[var(--color-q-accent-2)] hover:text-[var(--color-q-text)] transition-all"
          >
            Learn More
          </a>
        </div>

        {/* Interactive circuit */}
        <div
          className="relative rounded-3xl border border-[var(--color-q-border)] p-6 md:p-8 backdrop-blur-md text-left"
          style={{
            background: "rgba(13,13,18,0.6)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-serif text-lg text-[var(--color-q-text)] mb-0.5">
                Interactive circuit
              </p>
              <p className="font-mono text-[10px] text-[var(--color-q-muted)] tracking-wide">
                build a circuit, tap any gate to learn what it does
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-[var(--color-q-accent-2)] soft-pulse" />
          </div>
          <QuantumCircuit />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <span className="font-mono text-[10px] text-[var(--color-q-muted)] tracking-widest uppercase">
          scroll
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-[var(--color-q-muted)] to-transparent" />
      </div>
    </section>
  )
}

// ─── About ────────────────────────────────────────────────────────────────────

function About() {
  const talks = [
    {
      type: "Workshop",
      title: "Intro to Quantum Computing with Qiskit",
      desc: "A hands-on introductory workshop walking through quantum gates, circuits, and running jobs on IBM Quantum hardware using the Qiskit SDK.",
    },
    {
      type: "Talk",
      title: "Post-Quantum Cryptography Methods",
      desc: "An in-depth look at NIST-standardized algorithms (CRYSTALS-Kyber, CRYSTALS-Dilithium) and why classical RSA/ECC are vulnerable to Shor's algorithm.",
    },
    {
      type: "Talk",
      title: "IBM Quantum's Hardware Stack",
      desc: "A deep dive into IBM Eagle, Heron, and Flamingo processors — transmon qubits, lattice surgery, and the roadmap toward error-corrected quantum computing.",
    },
  ]

  return (
    <section id="about" className="relative py-32 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-16">
          <span className="font-mono text-xs text-[var(--color-q-accent-2)] tracking-widest uppercase">
            01 / about
          </span>
          <div className="flex-1 h-px bg-[var(--color-q-border)]" />
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-[var(--color-q-text)] mb-6 leading-tight">
              Build on the
              <br />
              <span style={{ color: "var(--color-q-accent-2)" }}>
                quantum frontier.
              </span>
            </h2>
            <p className="text-[var(--color-q-text-dim)] leading-relaxed mb-5">
              Qiskit Fall Fest is IBM's unique series of hackathons designed to
              foster global engagement in quantum computing. The USC chapter
              brings together students, researchers and quantum enthusiasts for
              a weekend of building, learning, and pushing the boundaries of
              quantum information science.
            </p>
            <p className="text-[var(--color-q-text-dim)] leading-relaxed">
              Whether you're writing your first quantum circuit or optimizing
              variational algorithms, this event is your launchpad. Teams of
              1–4 will hack for around 40 hours on challenges spanning quantum
              optimization, machine learning and cryptography.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "40 hrs", sub: "of hacking" },
              { label: "~80", sub: "participants" },
              { label: "3", sub: "sessions" },
              { label: "Free", sub: "registration" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-[var(--color-q-border)] bg-[var(--color-q-dark)] p-5 flex flex-col justify-between"
              >
                <span
                  className="font-serif text-3xl font-light"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-q-accent), var(--color-q-accent-2))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {s.label}
                </span>
                <span className="font-mono text-xs text-[var(--color-q-muted)] tracking-widest uppercase mt-2">
                  {s.sub}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions */}
        <div>
          <h3 className="font-mono text-sm text-[var(--color-q-text-dim)] tracking-widest uppercase mb-8">
            Sessions &amp; Talks
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {talks.map((t) => (
              <div
                key={t.title}
                className="rounded-2xl border border-[var(--color-q-border)] bg-[var(--color-q-dark)] p-6 flex flex-col gap-4 transition-all hover:border-[var(--color-q-accent-soft)]"
              >
                <div
                  className="inline-flex self-start items-center px-2.5 py-1 rounded-full font-mono text-[10px] tracking-widest uppercase"
                  style={{
                    background: "var(--color-q-accent-soft)",
                    color: "var(--color-q-accent-2)",
                  }}
                >
                  {t.type}
                </div>
                <div>
                  <h4 className="font-sans text-sm font-semibold text-[var(--color-q-text)] leading-snug mb-2">
                    {t.title}
                  </h4>
                  <p className="text-xs text-[var(--color-q-text-dim)] leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

function Schedule() {
  const events = [
    {
      day: "Fri Nov 6",
      time: "6:00 PM",
      title: "Opening Ceremony",
      desc: "Welcome remarks, sponsor introductions, team formation, and orientation to IBM Quantum resources.",
    },
    {
      day: "Fri Nov 6",
      time: "8:00 PM",
      title: "Hacking Begins",
      desc: "Kickoff. Teams start working on their quantum projects. Mentors available throughout the night.",
    },
    {
      day: "Sat Nov 7",
      time: "All Day",
      title: "Workshops & Talks",
      desc: "Introductory Qiskit workshop, talk on post-quantum cryptography, and deep-dive into IBM Quantum's hardware stack. Exact times TBA.",
    },
    {
      day: "Sun Nov 8",
      time: "9:00 AM",
      title: "Submissions Due",
      desc: "All project submissions must be finalized by 9 AM. Submit via the event portal with a short writeup and GitHub link.",
    },
    {
      day: "Sun Nov 8",
      time: "10:00 AM",
      title: "Demos & Judging",
      desc: "Teams present their projects to judges. Q&A session and live circuit demonstrations.",
    },
    {
      day: "Sun Nov 8",
      time: "12:00 PM",
      title: "Awards & Closing",
      desc: "Winner announcements, prize distribution, closing remarks. Event ends at noon.",
    },
  ]

  return (
    <section id="schedule" className="py-32 px-6 relative overflow-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-16">
          <span className="font-mono text-xs text-[var(--color-q-accent-2)] tracking-widest uppercase">
            02 / schedule
          </span>
          <div className="flex-1 h-px bg-[var(--color-q-border)]" />
        </div>

        <h2 className="font-serif text-4xl font-light text-[var(--color-q-text)] mb-14 leading-tight">
          Nov 6{" "}
          <span className="text-[var(--color-q-muted)] font-light">—</span>{" "}
          Nov 8
        </h2>

        <div className="relative">
          {/* Timeline spine */}
          <div
            className="absolute left-[7px] top-2 bottom-2 w-px"
            style={{
              background:
                "linear-gradient(180deg, var(--color-q-accent), var(--color-q-accent-2))",
              opacity: 0.5,
            }}
          />

          <div className="space-y-0">
            {events.map((e, i) => (
              <div key={i} className="flex gap-6 group">
                {/* Dot */}
                <div className="relative flex-shrink-0 mt-1">
                  <div
                    className="w-[15px] h-[15px] rounded-full border-2 bg-[#08080b] transition-all group-hover:scale-125"
                    style={{ borderColor: "var(--color-q-accent-2)" }}
                  />
                </div>

                {/* Content */}
                <div className="pb-10 flex-1">
                  <div className="flex flex-wrap items-baseline gap-3 mb-1">
                    <span className="font-mono text-xs text-[var(--color-q-muted)] tracking-widest">
                      {e.day}
                    </span>
                    <span
                      className="font-mono text-sm font-medium"
                      style={{ color: "var(--color-q-accent-2)" }}
                    >
                      {e.time}
                    </span>
                  </div>
                  <h3 className="font-sans text-base font-semibold text-[var(--color-q-text)] mb-2">
                    {e.title}
                  </h3>
                  <p className="text-sm text-[var(--color-q-text-dim)] leading-relaxed">
                    {e.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Register ────────────────────────────────────────────────────────────────

function Register() {
  const [agreed, setAgreed] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [affiliation, setAffiliation] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)

  const inputClass =
    "w-full bg-[var(--color-q-dark)] border border-[var(--color-q-border)] rounded-xl px-4 py-3 font-sans text-sm text-[var(--color-q-text)] placeholder-[var(--color-q-muted)] focus:outline-none focus:border-[var(--color-q-accent)] transition-colors"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed || !name || !email) return
    setSubmitted(true)
  }

  return (
    <section id="register" className="py-32 px-6 relative overflow-hidden">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-16">
          <span className="font-mono text-xs text-[var(--color-q-accent-2)] tracking-widest uppercase">
            03 / register
          </span>
          <div className="flex-1 h-px bg-[var(--color-q-border)]" />
        </div>

        <h2 className="font-serif text-4xl font-light text-[var(--color-q-text)] mb-4 leading-tight">
          Secure your spot.
          <br />
          <span style={{ color: "var(--color-q-accent-2)" }}>
            Build the future.
          </span>
        </h2>
        <p className="text-[var(--color-q-text-dim)] mb-12">
          Registration is free and open to all students and quantum
          enthusiasts. Bring your laptop — IBM Quantum access and cloud
          credits provided.
        </p>

        {submitted ? (
          <div className="rounded-2xl border border-[var(--color-q-accent-2)] bg-[var(--color-q-accent-2-soft)] p-10 text-center">
            <div className="w-10 h-10 rounded-full border border-[var(--color-q-accent-2)] mx-auto mb-4 flex items-center justify-center">
              <span className="text-[var(--color-q-accent-2)] text-sm">✓</span>
            </div>
            <h3 className="font-serif text-xl text-[var(--color-q-text)] mb-2">
              Registration received
            </h3>
            <p className="font-mono text-sm text-[var(--color-q-text-dim)]">
              We'll be in touch at{" "}
              <span className="text-[var(--color-q-text)]">{email}</span> with
              details.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="font-mono text-xs text-[var(--color-q-text-dim)] mb-2 block tracking-widest uppercase">
                  Full Name *
                </label>
                <input
                  className={inputClass}
                  placeholder="Ada Lovelace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="font-mono text-xs text-[var(--color-q-text-dim)] mb-2 block tracking-widest uppercase">
                  Email *
                </label>
                <input
                  className={inputClass}
                  type="email"
                  placeholder="ada@sc.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-[var(--color-q-text-dim)] mb-2 block tracking-widest uppercase">
                Affiliation
              </label>
              <input
                className={inputClass}
                placeholder="University of South Carolina — CS / Physics / ECE …"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
              />
            </div>

            {/* Privacy policy */}
            <div className="rounded-xl border border-[var(--color-q-border)] bg-[var(--color-q-dark)] p-5">
              <button
                type="button"
                onClick={() => setPolicyOpen((o) => !o)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="font-mono text-xs text-[var(--color-q-text-dim)] tracking-widest uppercase">
                  Photo & Media Release Policy
                </span>
                <span className="font-mono text-xs text-[var(--color-q-muted)]">
                  {policyOpen ? "▲" : "▼"}
                </span>
              </button>

              {policyOpen && (
                <div className="mt-4 text-xs text-[var(--color-q-text-dim)] leading-relaxed border-t border-[var(--color-q-border)] pt-4 max-h-48 overflow-y-auto pr-2">
                  <p className="mb-3">
                    I read, acknowledge, and agree to this event photo release
                    policy. I understand and agree I may be videotaped,
                    recorded, interviewed, and/or photographed during the
                    Qiskit Fall Fest at any time by IBM and by other
                    participants and individuals ("third parties") who may or
                    may not be affiliated with the event, including media.
                  </p>
                  <p className="mb-3">
                    I grant to IBM and third parties the unrestricted,
                    world-wide, royalty-free license to use, commercially
                    exploit, produce, reproduce, distribute, transmit,
                    publish, perform, display, broadcast, and exhibit in any
                    and all media now known or hereinafter developed for any
                    purposes my name, image, likeness, voice, texts, posts and
                    any statements in whole or in part recorded during the
                    event at any time.
                  </p>
                  <p className="mb-3">
                    I agree I have no right of inspection or approval, and no
                    compensation will be given for the above license and
                    rights.
                  </p>
                  <p>
                    I acknowledge that I have read this agreement, fully
                    understand its terms, and agree to this publicity release
                    freely and voluntarily.
                  </p>
                </div>
              )}

              <label className="flex items-start gap-3 mt-4 cursor-pointer group">
                <div
                  onClick={() => setAgreed((a) => !a)}
                  className="mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    borderColor: agreed
                      ? "var(--color-q-accent)"
                      : "var(--color-q-border)",
                    background: agreed ? "var(--color-q-accent)" : "transparent",
                  }}
                >
                  {agreed && (
                    <span className="text-white text-xs leading-none">✓</span>
                  )}
                </div>
                <span className="text-xs text-[var(--color-q-text-dim)] leading-relaxed">
                  I have read, acknowledge, and agree to the photo and media
                  release policy above. *
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!agreed || !name || !email}
              className="w-full py-4 rounded-full font-mono text-sm font-medium tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background:
                  agreed && name && email
                    ? "linear-gradient(135deg, var(--color-q-accent), var(--color-q-accent-2))"
                    : "var(--color-q-border)",
                color: agreed && name && email ? "#08080b" : "var(--color-q-muted)",
              }}
            >
              Register for Qiskit Fall Fest 2026
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const CONTACT_EMAIL = "qiskitfallfest@sc.edu"

  return (
    <footer className="border-t border-[var(--color-q-border)] px-6 py-14">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center gap-3 mb-10">
          <span className="font-mono text-[11px] text-[var(--color-q-accent-2)] tracking-widest uppercase">
            Get in touch
          </span>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-serif text-2xl md:text-3xl font-light text-[var(--color-q-text)] hover:text-[var(--color-q-accent-2)] transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="font-mono text-xs text-[var(--color-q-muted)] max-w-md">
            Questions about registration, sponsorship, or the event — reach
            out any time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[var(--color-q-border-soft)]">
          <span className="font-mono text-xs text-[var(--color-q-muted)]">
            Qiskit Fall Fest 2026 · University of South Carolina
          </span>
          <span className="font-mono text-xs text-[var(--color-q-muted)]">
            Powered by IBM Quantum
          </span>
        </div>
      </div>
    </footer>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div style={{ background: "#08080b", minHeight: "100vh" }}>
      {/* one continuous ambient gradient field behind the whole page —
          seamless flow between sections instead of separate colored blobs */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 15% 10%, #7c6cf615 0%, transparent 60%), " +
            "radial-gradient(ellipse 50% 40% at 85% 35%, #4fd8c412 0%, transparent 60%), " +
            "radial-gradient(ellipse 60% 50% at 20% 75%, #7c6cf610 0%, transparent 60%), " +
            "radial-gradient(ellipse 50% 40% at 90% 95%, #4fd8c40d 0%, transparent 60%)",
          zIndex: 0,
        }}
      />
      <div className="relative" style={{ zIndex: 1 }}>
        <Nav />
        <Hero />
        <About />
        <Schedule />
        <Register />
        <Footer />
      </div>
    </div>
  )
}
