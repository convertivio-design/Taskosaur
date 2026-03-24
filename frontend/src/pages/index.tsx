import { useRouter } from "next/router";
import { motion } from "framer-motion";

const PIPELINE_STAGES = [
  {
    label: "Prospect",
    color: "border-slate-600",
    accent: "bg-slate-700",
    cards: [
      { name: "Acme Corp", info: "CEO · 120 employees", score: 72 },
      { name: "BlueWave Inc", info: "CMO · 45 employees", score: 58 },
    ],
  },
  {
    label: "MQL",
    color: "border-violet-600",
    accent: "bg-violet-900/40",
    cards: [
      { name: "Syntech Ltd", info: "VP Sales · 300 employees", score: 81 },
      { name: "Orbis Media", info: "Founder · 12 employees", score: 77 },
    ],
  },
  {
    label: "SQL",
    color: "border-violet-400",
    accent: "bg-violet-800/40",
    cards: [
      { name: "Nexgen AI", info: "CTO · 80 employees", score: 91 },
    ],
  },
  {
    label: "Nurture",
    color: "border-cyan-600",
    accent: "bg-cyan-900/30",
    cards: [
      { name: "DataStream Co", info: "Dir. Marketing · 55 employees", score: 63 },
      { name: "Luminary Labs", info: "CMO · 200 employees", score: 69 },
    ],
  },
  {
    label: "Won",
    color: "border-emerald-500",
    accent: "bg-emerald-900/30",
    cards: [
      { name: "Apex Systems", info: "CEO · 500 employees", score: 97 },
    ],
  },
];

const AI_CHAT = [
  {
    role: "user" as const,
    text: "Move all leads stale > 14 days to Nurture sequence",
  },
  {
    role: "ai" as const,
    text: "Done. 23 leads moved to Nurture. Sending re-engagement email template...",
  },
  {
    role: "user" as const,
    text: "Create a follow-up task for all MQL leads from last week",
  },
  {
    role: "ai" as const,
    text: "8 tasks created and assigned to your SDR team.",
  },
];

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 85
      ? "text-emerald-400 bg-emerald-900/50"
      : score >= 70
      ? "text-violet-300 bg-violet-900/50"
      : "text-slate-400 bg-slate-800";
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${color}`}>
      {score}
    </span>
  );
}

function RobotIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-cyan-400 shrink-0"
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="11" />
      <line x1="8" y1="15" x2="8" y2="15" />
      <line x1="16" y1="15" x2="16" y2="15" />
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-800/8 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 pt-20 pb-16 max-w-7xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          AI-Powered Pipeline Automation
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]"
        >
          Marketing Automation,{" "}
          <span className="bg-gradient-to-r from-violet-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">
            Reimagined
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-center text-lg text-gray-400 leading-relaxed"
        >
          AI-powered campaign pipelines. Automate follow-ups, qualify leads,
          and close deals &mdash; all from one place.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => router.push("/login?demo=true")}
            className="group relative inline-flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-all hover:bg-violet-500 hover:shadow-violet-800/60 hover:-translate-y-0.5 active:translate-y-0"
          >
            Enter Demo
            <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </button>
          <a
            href="https://github.com/convertivio-design/Taskosaur"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900/60 px-7 py-3.5 text-sm font-semibold text-gray-300 backdrop-blur transition-all hover:border-gray-500 hover:text-white hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-70">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.607.069-.607 1.003.07 1.531 1.031 1.531 1.031.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            View Source on GitHub
          </a>
        </motion.div>

        {/* Demo credentials hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-4 text-xs text-gray-600 text-center"
        >
          Demo login: <span className="text-gray-400 font-mono">demo@convertivio.io</span> &nbsp;/&nbsp; <span className="text-gray-400 font-mono">Demo1234!</span>
        </motion.p>

        {/* Kanban Pipeline Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-20 w-full"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-600 mb-6">
            Live Pipeline View
          </p>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map((stage, stageIdx) => (
              <div
                key={stage.label}
                className={`flex-shrink-0 w-52 rounded-xl border ${stage.color} bg-gray-900/70 backdrop-blur p-3 flex flex-col gap-2`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-300 tracking-wide">
                    {stage.label}
                  </span>
                  <span className="text-[10px] text-gray-600 bg-gray-800 rounded-full px-1.5 py-0.5">
                    {stage.cards.length}
                  </span>
                </div>
                {stage.cards.map((card, cardIdx) => (
                  <motion.div
                    key={card.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.6 + stageIdx * 0.1 + cardIdx * 0.08,
                    }}
                    className={`rounded-lg p-2.5 ${stage.accent} border border-white/5`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-medium text-white leading-tight">
                        {card.name}
                      </span>
                      <ScoreBadge score={card.score} />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-500">{card.info}</p>
                    <div className="mt-2 h-0.5 rounded-full bg-gray-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${card.score}%` }}
                        transition={{ duration: 0.8, delay: 0.8 + stageIdx * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
          {/* Stage flow labels */}
          <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-gray-700 font-medium tracking-widest uppercase select-none">
            {PIPELINE_STAGES.map((s, i) => (
              <span key={s.label} className="flex items-center gap-2">
                <span>{s.label}</span>
                {i < PIPELINE_STAGES.length - 1 && (
                  <span className="text-gray-800">&rarr;</span>
                )}
              </span>
            ))}
          </div>
        </motion.div>

        {/* AI Assistant Panel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 w-full max-w-xl"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-600 mb-4">
            AI Assistant
          </p>
          <div className="rounded-2xl border border-cyan-900/50 bg-gray-900/80 backdrop-blur shadow-xl shadow-cyan-950/30 overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center gap-2.5 border-b border-gray-800 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              </div>
              <span className="text-xs text-gray-500 font-medium">AI Pipeline Assistant</span>
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            {/* Messages */}
            <div className="flex flex-col gap-3 p-4">
              {AI_CHAT.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.role === "user" ? 16 : -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 1.0 + idx * 0.18 }}
                  className={`flex items-start gap-2 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {msg.role === "ai" && (
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-900/60 border border-cyan-700/40">
                      <RobotIcon />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-700/60 text-violet-100 border border-violet-600/30"
                        : "bg-gray-800 text-cyan-100 border border-cyan-900/40"
                    }`}
                  >
                    {msg.role === "ai" && (
                      <span className="text-cyan-400 font-semibold mr-1">&#10003;</span>
                    )}
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Fake input */}
            <div className="flex items-center gap-2 border-t border-gray-800 px-4 py-3">
              <div className="flex-1 rounded-lg bg-gray-800/80 border border-gray-700 px-3 py-2 text-xs text-gray-600 select-none">
                Ask AI to automate anything...
              </div>
              <button className="rounded-lg bg-cyan-700/60 border border-cyan-600/40 p-2 text-cyan-300 hover:bg-cyan-600/60 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="mt-16 flex flex-wrap justify-center gap-3"
        >
          {[
            { icon: "⚡", label: "Automated Sequences" },
            { icon: "🎯", label: "Lead Scoring" },
            { icon: "🤖", label: "AI Follow-ups" },
            { icon: "📊", label: "Pipeline Analytics" },
            { icon: "🔗", label: "CRM Integrations" },
          ].map((pill) => (
            <div
              key={pill.label}
              className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900/60 px-4 py-2 text-xs text-gray-400"
            >
              <span>{pill.icon}</span>
              {pill.label}
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-16 text-center text-xs text-gray-700 tracking-wide"
        >
          Built with{" "}
          <span className="text-gray-600">NestJS</span>
          {" · "}
          <span className="text-gray-600">Next.js</span>
          {" · "}
          <span className="text-gray-600">PostgreSQL</span>
          {" · "}
          <span className="text-gray-600">OpenAI</span>
        </motion.p>
      </div>
    </div>
  );
}
