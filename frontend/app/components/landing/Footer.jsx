export default function Footer() {
  return (
    <footer className="bg-[#0d0d0d] text-gray-400 py-10 text-center text-sm">
      <p>© {new Date().getFullYear()} MyBenaka.in • All Rights Reserved</p>
      <p className="mt-2">
        Built with ❤️ by <span className="text-[#ff6a00] font-semibold">MyBenaka Team</span>
      </p>
    </footer>
  )
}
