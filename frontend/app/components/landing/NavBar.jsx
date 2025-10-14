'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 w-full z-50 transition-all ${
        scrolled ? 'bg-[#0d0d0d]/90 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-extrabold text-white tracking-tight">
          <span className="text-[#ff6a00]">My</span>Benaka
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className="text-gray-300 hover:text-[#ff6a00] transition font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="border border-gray-400 hover:border-[#ff6a00] text-gray-300 hover:text-[#ff6a00] font-medium px-5 py-2 rounded-full transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="bg-[#ff6a00] hover:bg-[#ff9a3d] text-white font-semibold px-5 py-2 rounded-full transition"
          >
            Register
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-200 hover:text-[#ff6a00]"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#0d0d0d] border-t border-gray-800 px-6 py-4 space-y-4"
        >
          {navLinks.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className="block text-gray-300 hover:text-[#ff6a00] font-medium transition"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-4 border-t border-gray-800 flex flex-col gap-3">
            <Link
              href="/login"
              className="border border-gray-400 hover:border-[#ff6a00] text-gray-300 hover:text-[#ff6a00] font-medium px-5 py-2 rounded-full text-center transition"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-[#ff6a00] hover:bg-[#ff9a3d] text-white font-semibold px-5 py-2 rounded-full text-center transition"
              onClick={() => setMenuOpen(false)}
            >
              Register
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
