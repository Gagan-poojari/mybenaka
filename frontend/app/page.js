import CTA from "./components/landing/CTA";
import Features from "./components/landing/Features";
import Footer from "./components/landing/Footer";
import HeroSection from "./components/landing/HeroSection";
import Navbar from "./components/landing/NavBar";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
