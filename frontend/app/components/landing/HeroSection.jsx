'use client'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#0d0d0d] via-[#1a1a1a] to-[#0d0d0d] text-white px-6">
      <Link href="/" className="text-2xl font-extrabold text-white tracking-tight fixed top-7 left-9">
        <span className="text-[#ff6a00]">My</span>Benaka
      </Link>
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-7xl font-extrabold leading-tight"
      >
        Empowering <span className="text-[#ff6a00]">Dreams</span>
        <br /> through Smarter Loans
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl"
      >
        MyBenaka helps individuals and businesses get the right financial support —
        fast, transparent, and tailored to your needs.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-10 flex gap-4"
      >
        <Link href={"/login"}>
          <button className="bg-[#ff6a00] hover:bg-[#ff9a3d] text-white font-semibold px-6 py-3 rounded-full flex items-center gap-2 transition cursor-pointer">
            Login <ArrowRight className="w-5 h-5" />
          </button>
        </Link>
        {/* <button className="border border-gray-400 hover:border-[#ff6a00] text-gray-200 font-semibold px-6 py-3 rounded-full transition">
          Learn More
        </button> */}
      </motion.div>

      <div className="absolute bottom-6 text-gray-500 text-sm">
        © {new Date().getFullYear()} MyBenaka.in • All Rights Reserved
      </div>
    </section>
  )
}
