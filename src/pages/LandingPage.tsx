import { Suspense } from "react";
import { Mic, MessageSquare, Zap, Shield, Globe, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import InteractiveParticleSphere from "@/components/InteractiveParticleSphere";

const features = [
  {
    icon: Mic,
    title: "Voice Assistant",
    description: "Natural voice conversations with real-time speech recognition and synthesis",
  },
  {
    icon: MessageSquare,
    title: "Smart Chat",
    description: "Intelligent text-based support with context-aware responses",
  },
  {
    icon: Zap,
    title: "Instant Response",
    description: "Lightning-fast AI processing for immediate assistance",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Enterprise-grade security for all your conversations",
  },
  {
    icon: Globe,
    title: "24/7 Availability",
    description: "Always-on support whenever you need assistance",
  },
  {
    icon: Headphones,
    title: "Multi-Channel",
    description: "Seamless experience across voice and text interfaces",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Headphones className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold gradient-text">TelecomAI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/auth?mode=signup">
            <Button variant="glow" size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 pt-20 pb-32">
        <div className="max-w-6xl mx-auto text-center">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-8"
            style={{ animation: "fade-up 0.5s ease-out forwards" }}
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Powered by Advanced AI</span>
          </div>

          <h1 
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            style={{ animation: "fade-up 0.5s ease-out 0.1s forwards", opacity: 0 }}
          >
            Your Intelligent
            <br />
            <span className="gradient-text">Telecom Assistant</span>
          </h1>

          <p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
            style={{ animation: "fade-up 0.5s ease-out 0.2s forwards", opacity: 0 }}
          >
            Experience the future of customer support with our AI-powered voice and chat assistant. 
            Get instant help, 24/7, with natural conversations.
          </p>

          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ animation: "fade-up 0.5s ease-out 0.3s forwards", opacity: 0 }}
          >
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="xl">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="glass" size="xl">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Hero Particle Sphere */}
          <div 
            className="mt-16 relative flex justify-center"
            style={{ animation: "fade-up 0.5s ease-out 0.4s forwards", opacity: 0 }}
          >
            <Suspense fallback={
              <div className="w-64 h-64 md:w-72 md:h-72 rounded-full flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-primary/20 animate-pulse" />
              </div>
            }>
              <InteractiveParticleSphere size="normal" />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 md:px-12 py-24 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features for
              <span className="gradient-text"> Modern Support</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need for exceptional customer service, powered by cutting-edge AI technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl glass hover:bg-card/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{ animation: `fade-up 0.5s ease-out ${0.1 * index}s forwards`, opacity: 0 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl glass-strong glow-effect-sm">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your
              <span className="gradient-text"> Customer Experience?</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of businesses using TelecomAI to deliver exceptional support.
            </p>
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="xl">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-12 py-8 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Headphones className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">TelecomAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 TelecomAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
