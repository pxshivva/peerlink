import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Users, Zap, Star, TrendingUp, CheckCircle } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  const stats = [
    { label: "Students Joined", value: "2,450+" },
    { label: "Skills Exchanged", value: "8,920+" },
    { label: "Hours Taught", value: "12,340+" },
  ];

  const steps = [
    {
      icon: BookOpen,
      title: "List Your Skills",
      description: "Share what you're good at—from math tutoring to graphic design.",
    },
    {
      icon: Users,
      title: "Connect & Learn",
      description: "Browse skills others offer and request help when you need it.",
    },
    {
      icon: Zap,
      title: "Exchange Credits",
      description: "Earn 1 credit per hour taught, spend 1 credit per hour learned.",
    },
  ];

  const featuredSkills = [
    {
      name: "Algebra Help",
      category: "Math",
      provider: "Sarah M.",
      rating: 4.9,
      reviews: 24,
    },
    {
      name: "Video Editing",
      category: "Creative",
      provider: "Alex J.",
      rating: 4.8,
      reviews: 18,
    },
    {
      name: "Python Basics",
      category: "Programming",
      provider: "Jordan L.",
      rating: 5.0,
      reviews: 32,
    },
    {
      name: "Essay Writing",
      category: "Writing",
      provider: "Casey R.",
      rating: 4.7,
      reviews: 15,
    },
  ];

  const testimonials = [
    {
      name: "Emma T.",
      school: "Central High",
      quote: "PeerLink helped me finally understand calculus. The tutoring was personalized and free!",
      avatar: "ET",
    },
    {
      name: "Marcus D.",
      school: "Lincoln Academy",
      quote: "I taught Python to 5 students and learned graphic design. Best use of my time!",
      avatar: "MD",
    },
    {
      name: "Sophia K.",
      school: "Riverside High",
      quote: "The platform is so easy to use. Found a tutor within minutes and completed my first session.",
      avatar: "SK",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PL</span>
            </div>
            <span className="font-bold text-lg">PeerLink</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost">Sign In</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button>Get Started</Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="section-spacing bg-gradient-to-b from-background to-muted/20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-slide-up">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Share Skills.
                <br />
                <span className="gradient-text">Grow Together.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Trade what you know for what you need. No money. Just credits. A student-run platform where learning is collaborative and accessible.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={getLoginUrl()}>
                <Button size="lg" className="gap-2">
                  Offer a Skill <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href={getLoginUrl()}>
                <Button size="lg" variant="outline" className="gap-2">
                  Get Help <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 border-t border-border">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <p className="text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-spacing">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps and join thousands of students exchanging skills.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="card-premium p-8 space-y-4 hover:shadow-lg transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Skills */}
      <section className="section-spacing bg-subtle">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Featured Skills</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore popular skills being taught right now on PeerLink.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredSkills.map((skill) => (
              <div key={skill.name} className="card-premium p-6 space-y-4 hover:shadow-lg transition-all">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{skill.name}</h3>
                  <p className="text-sm text-muted-foreground">{skill.category}</p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">by {skill.provider}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{skill.rating}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">{skill.reviews} reviews</p>

                <Button className="w-full" variant="outline" size="sm">
                  View Profile
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-spacing">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Students Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real feedback from students using PeerLink to learn and teach.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="card-premium p-8 space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-muted-foreground italic">"{testimonial.quote}"</p>

                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.school}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="section-spacing bg-subtle">
        <div className="container">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">Built on Trust</h2>
              <p className="text-lg text-muted-foreground">
                PeerLink prioritizes student safety with verified profiles, ratings, and community guidelines.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Verified Profiles",
                  description: "All students verify their school email to join the community.",
                },
                {
                  title: "Ratings & Reviews",
                  description: "Every session is reviewed. Build your reputation through quality teaching.",
                },
                {
                  title: "Safe Meetings",
                  description: "Always meet in safe, public, or school-approved environments.",
                },
                {
                  title: "Community Guidelines",
                  description: "Clear rules ensure a respectful and productive learning environment.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <CheckCircle className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-spacing bg-gradient-to-r from-primary/10 to-secondary/10 border-t border-b border-border">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold">Join the PeerLink Network</h2>
              <p className="text-lg text-muted-foreground">
                Start sharing skills and learning from peers today. It takes less than 2 minutes to get started.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={getLoginUrl()}>
                <Button size="lg" className="gap-2">
                  Sign Up Now <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href={getLoginUrl()}>
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              No credit card required. Free for all students.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PL</span>
                </div>
                <span className="font-bold">PeerLink</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A student-run platform for skill exchange.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition">Security</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition">Guidelines</a></li>
                <li><a href="#" className="hover:text-foreground transition">Support</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; 2026 PeerLink. All rights reserved.</p>
            <p>
              PeerLink is a student-run platform. Always meet in safe, public or school-approved environments.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
