import { Suspense } from "react";
import { Headphones, Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import InteractiveParticleSphere from "@/components/InteractiveParticleSphere";
import heroVideo from "@/assets/hero-video.mp4";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Full-screen Video Background */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-40"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
      </div>

      {/* Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-accent/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "-2s" }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center backdrop-blur-sm">
            <Headphones className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-white">TelecomAI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
          <Link to="/auth?mode=signup">
            <Button variant="glow" size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-88px)] px-6">
        {/* Empty space for video focus */}
        <div className="flex-1" />

        {/* CTA Buttons */}
        <div 
          className="flex flex-col sm:flex-row items-center gap-4"
          style={{ animation: "fade-up 0.8s ease-out 0.3s forwards", opacity: 0 }}
        >
          <Link to="/auth?mode=signup">
            <Button 
              variant="hero" 
              size="xl" 
              className="group relative overflow-hidden"
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Start Now
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button 
              variant="glass" 
              size="xl"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Sign In
            </Button>
          </Link>
        </div>

        {/* Floating Stats/Badges */}
        <div 
          className="mt-16 flex items-center gap-8 md:gap-16"
          style={{ animation: "fade-up 0.8s ease-out 0.5s forwards", opacity: 0 }}
        >
          <div className="flex flex-col items-center">
            <span className="text-3xl md:text-4xl font-bold text-white">24/7</span>
            <span className="text-xs text-white/50 uppercase tracking-widest mt-1">Available</span>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-3xl md:text-4xl font-bold text-white">AI</span>
            <span className="text-xs text-white/50 uppercase tracking-widest mt-1">Powered</span>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-3xl md:text-4xl font-bold text-white">∞</span>
            <span className="text-xs text-white/50 uppercase tracking-widest mt-1">Scalable</span>
          </div>
        </div>

        {/* Interactive Sphere - Bottom Position */}
        <div 
          className="mt-auto mb-24 relative"
          style={{ animation: "fade-up 0.8s ease-out 0.7s forwards", opacity: 0 }}
        >
          <Suspense fallback={
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/30 animate-pulse" />
            </div>
          }>
            <InteractiveParticleSphere size="normal" />
          </Suspense>
          
          {/* Glow ring around sphere */}
          <div className="absolute inset-0 -z-10 scale-110">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl animate-pulse" />
          </div>
        </div>
      </main>

      {/* Bottom Gradient Fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />

      {/* Minimal Footer */}
      <footer className="relative z-20 fixed bottom-0 left-0 right-0 px-6 md:px-12 py-4">
        <div className="flex items-center justify-center">
          <p className="text-xs text-white/30">
            © 2026 TelecomAI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;