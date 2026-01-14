"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Plane, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 selection:bg-zinc-900 selection:text-white font-sans">
      {/* --- GRID BACKGROUND (Subtle Engineering Paper Look) --- */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>

      {/* --- NAVBAR --- */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 border-b border-zinc-100 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-1 rounded-sm">
            <Plane className="w-4 h-4 transform -rotate-45" />
          </div>
          <span className="text-lg font-bold tracking-tight">Outcome</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/markets">
            <Button
              variant="default"
              className="bg-black hover:bg-zinc-800 text-white rounded-none h-10 px-6 font-medium"
            >
              Launch Market
            </Button>
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-24 pb-32 text-center px-4">
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-200 rounded-full bg-zinc-50/50 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
            </span>
            <span className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">
              Mantle Network
            </span>
          </div>
        </motion.div>

        {/* Main Title - Big, Bold, Heavy */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter text-zinc-950 max-w-5xl leading-[0.9]"
        >
          PREDICT THE <br />
          <span className="text-zinc-400">UNCERTAIN.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 text-xl text-zinc-500 max-w-2xl leading-relaxed font-light"
        >
          The decentralized aviation prediction market.
          <br />
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/markets">
            <Button
              size="lg"
              className="h-14 px-10 text-base bg-black hover:bg-zinc-800 text-white rounded-full shadow-xl shadow-zinc-200"
            >
              Start Trading <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="h-14 px-10 text-base border-zinc-200 text-zinc-600 hover:bg-zinc-50 rounded-full"
          >
            Read Whitepaper
          </Button>
        </motion.div>

        {/* --- LIVE TICKER (Minimalist List) --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-24 w-full max-w-4xl"
        >
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 text-xs text-zinc-400 font-mono uppercase tracking-widest text-left">
              <span className="col-span-3">Identifier</span>
              <span className="col-span-3">Route</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-2">AI Signal</span>
              <span className="col-span-2 text-right">Yield</span>
            </div>

            {/* Row 1 */}
            <div className="group grid grid-cols-12 px-6 py-5 border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer items-center text-left">
              <div className="col-span-3 font-bold text-zinc-900 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                UA 920
              </div>
              <div className="col-span-3 text-zinc-500 font-medium text-sm">
                LHR — IAD
              </div>
              <div className="col-span-2">
                <Badge
                  variant="outline"
                  className="border-zinc-200 text-zinc-600 font-normal"
                >
                  Delayed
                </Badge>
              </div>
              <div className="col-span-2 font-mono font-bold text-black">
                82% <span className="text-zinc-400 text-[10px] ml-1">PROB</span>
              </div>
              <div className="col-span-2 text-right font-mono text-emerald-600">
                +140%
              </div>
            </div>

            {/* Row 2 */}
            <div className="group grid grid-cols-12 px-6 py-5 border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer items-center text-left">
              <div className="col-span-3 font-bold text-zinc-900 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                BA 117
              </div>
              <div className="col-span-3 text-zinc-500 font-medium text-sm">
                JFK — LHR
              </div>
              <div className="col-span-2">
                <Badge
                  variant="outline"
                  className="border-zinc-200 text-zinc-600 font-normal"
                >
                  On Time
                </Badge>
              </div>
              <div className="col-span-2 font-mono font-bold text-black">
                12% <span className="text-zinc-400 text-[10px] ml-1">PROB</span>
              </div>
              <div className="col-span-2 text-right font-mono text-emerald-600">
                +45%
              </div>
            </div>

            {/* Row 3 */}
            <div className="group grid grid-cols-12 px-6 py-5 hover:bg-zinc-50 transition-colors cursor-pointer items-center text-left">
              <div className="col-span-3 font-bold text-zinc-900 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                AF 006
              </div>
              <div className="col-span-3 text-zinc-500 font-medium text-sm">
                CDG — JFK
              </div>
              <div className="col-span-2">
                <Badge
                  variant="outline"
                  className="border-zinc-200 text-zinc-600 font-normal"
                >
                  Boarding
                </Badge>
              </div>
              <div className="col-span-2 font-mono font-bold text-black">
                45% <span className="text-zinc-400 text-[10px] ml-1">PROB</span>
              </div>
              <div className="col-span-2 text-right font-mono text-emerald-600">
                +80%
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* --- FEATURES GRID (Bento Box Style) --- */}
      <section
        id="features"
        className="py-32 px-6 bg-zinc-50 border-t border-zinc-200"
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Institutional Grade.
            </h2>
            <p className="text-zinc-500 max-w-xl">
              We stripped away the noise. No gamification, just pure data,
              privacy, and liquidity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-8 bg-white border border-zinc-200 hover:shadow-lg transition-shadow duration-300">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center mb-6">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-black mb-3">
                Predictive AI
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Our gradient boosting models analyze 10 years of flight data to
                generate initial odds that reflect reality, not just sentiment.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-white border border-zinc-200 hover:shadow-lg transition-shadow duration-300">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center mb-6">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-black mb-3">
                Zero-Knowledge
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Trade without revealing your alpha. We generate ZK proofs
                client-side so your strategy remains invisible to the chain.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-white border border-zinc-200 hover:shadow-lg transition-shadow duration-300">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center mb-6">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-black mb-3">
                Oasis Oracle
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                Trustless resolution. Markets settle automatically based on
                Aviation Edge data verified inside a Trusted Execution
                Environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-zinc-200 bg-white text-center">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
          <Plane className="w-4 h-4" />
          <span className="font-bold tracking-tight">Outcome</span>
        </div>
        <p className="text-zinc-400 text-xs">
          Built for the AI & Privacy Hackathon 2025. Running on Mantle Network.
        </p>
      </footer>
    </div>
  );
}
