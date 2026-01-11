import { HeroButton, GhostButton } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  Smartphone,
  BarChart3,
  Star,
  ArrowRight,
  Users,
  Clock,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-qr-ordering.jpg";

const Landing = () => {
  const features = [
    {
      icon: QrCode,
      title: "QR Code Generator",
      description: "Generate unlimited QR codes for each table in your restaurant"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Ordering",
      description: "Customers order directly from their phones with a smooth experience"
    },
    {
      icon: BarChart3,
      title: "Live Order Management",
      description: "Track orders in real-time from pending to completed"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      restaurant: "Bella Vista Bistro",
      content: "Our customers love the seamless ordering experience. Orders are up 40% since switching to QR menus.",
      rating: 5
    },
    {
      name: "Marco Rodriguez",
      restaurant: "Spice Garden",
      content: "Setup was incredibly easy. We were serving QR orders within 30 minutes of signing up.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">QRMenu</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <GhostButton>Login</GhostButton>
            </Link>
            <Link to="/signup">
              <HeroButton>Get Started</HeroButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  <Star className="w-4 h-4 mr-2 text-primary" />
                  Trusted by 1000+ restaurants
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Create your restaurant
                  <span className="text-primary"> QR menu</span> in minutes
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Transform your dining experience with contactless QR ordering.
                  Let customers browse your menu and place orders directly from their phones.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <HeroButton className="w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </HeroButton>
                </Link>
                <GhostButton className="w-full sm:w-auto">
                  <Users className="mr-2 h-5 w-5" />
                  View Demo
                </GhostButton>
              </div>

              <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Setup in 5 minutes
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Free to use
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="card-glass p-8 rounded-2xl">
                <img
                  src={heroImage}
                  alt="QR ordering system demo"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Everything you need for QR ordering
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              From menu creation to order fulfillment, we've got every aspect covered
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-glass hover-lift transition-smooth border-0">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Loved by restaurant owners
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              See what our customers are saying
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-glass border-0 hover-lift transition-smooth">
                <CardContent className="p-8 space-y-4">
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-foreground leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-muted-foreground">{testimonial.restaurant}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="card-glass p-8 md:p-12 rounded-2xl space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Ready to modernize your restaurant?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of restaurants already using QR ordering to improve their service
            </p>
            <Link to="/signup">
              <HeroButton size="lg" className="w-full sm:w-auto">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </HeroButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <QrCode className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">QRMenu</span>
              </div>
              <p className="text-muted-foreground">
                The easiest way to create QR menus for your restaurant.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-smooth">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Demo</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-smooth">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Status</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-smooth">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 QRMenu. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;