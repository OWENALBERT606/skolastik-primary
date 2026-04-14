import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react"

export function FooterSection() {
  return (
    <footer className="bg-muted mt-16 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-yellow-600">Political Insights</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your trusted source for in-depth political analysis, democratic discourse, and constitutional knowledge.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="icon" className="bg-transparent">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="bg-transparent">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="bg-transparent">
                <Linkedin className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="text-muted-foreground hover:text-yellow-600 transition-colors text-sm">
                Home
              </Link>
              <Link href="/categories" className="text-muted-foreground hover:text-yellow-600 transition-colors text-sm">
                Categories
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-yellow-600 transition-colors text-sm">
                About Us
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-yellow-600 transition-colors text-sm">
                Contact
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-yellow-600 transition-colors text-sm">
                Privacy Policy
              </Link>
            </nav>
          </div>

          {/* Topics */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Topics</h4>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/topics/electoral-systems"
                className="text-muted-foreground hover:text-yellow-600 transition-colors text-sm"
              >
                Electoral Systems
              </Link>
              <Link
                href="/topics/constitutional-law"
                className="text-muted-foreground hover:text-yellow-600 transition-colors text-sm"
              >
                Constitutional Law
              </Link>
              <Link
                href="/topics/media-democracy"
                className="text-muted-foreground hover:text-yellow-600 transition-colors text-sm"
              >
                Media & Democracy
              </Link>
              <Link
                href="/topics/political-theory"
                className="text-muted-foreground hover:text-yellow-600 transition-colors text-sm"
              >
                Political Theory
              </Link>
              <Link
                href="/topics/governance"
                className="text-muted-foreground hover:text-yellow-600 transition-colors text-sm"
              >
                Governance
              </Link>
            </nav>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Stay Informed</h4>
            <p className="text-muted-foreground text-sm">
              Subscribe to our newsletter for weekly political insights and analysis.
            </p>
            <div className="space-y-2">
              <Input type="email" placeholder="Enter your email" className="bg-background" />
              <Button className="w-full bg-yellow-600 hover:bg-yellow-600/90">Subscribe</Button>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>contact@politicalinsights.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Washington, DC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">© 2024 Political Insights. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/terms" className="text-muted-foreground hover:text-yellow-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-yellow-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="text-muted-foreground hover:text-yellow-600 transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
