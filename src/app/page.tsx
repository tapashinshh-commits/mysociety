import {
  Users,
  ShoppingBag,
  AlertTriangle,
  Calendar,
  MessageCircle,
  Shield,
  Truck,
  ClipboardList,
  Vote,
  Bell,
  MapPin,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold text-lg">
              M
            </div>
            <span className="text-xl font-bold text-foreground">
              My<span className="text-primary">Society</span>
            </span>
          </div>
          <a
            href="/auth"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:py-28">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <MapPin size={14} />
            Apna Mohalla, Apni Duniya
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            Your Society,{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Your Community
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            Connect with neighbors, track your doodhwala, manage complaints,
            organize events, and build a stronger community — all in one app.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/auth"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Join Your Society
              <ArrowRight size={18} />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-surface"
            >
              See Features
            </a>
          </div>
          <p className="mt-4 text-sm text-muted">
            Free forever for residents. No hardware needed.
          </p>
        </div>
      </section>

      {/* Problems We Solve */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground">
            Sound Familiar?
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-muted">
            Every society faces these problems. MySociety solves them all.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                problem: '"Doodhwala aaya kya?"',
                solution: "Real-time vendor tracking — know when they arrive",
              },
              {
                problem: '"Lift band hai 3 din se"',
                solution: "Transparent complaint board — everyone can see status",
              },
              {
                problem: '"Maintenance kahan gaya?"',
                solution: "Society Khata — every rupee tracked publicly",
              },
              {
                problem: '"Kisi ke paas drill hai?"',
                solution: "Help board — ask neighbors, get help in minutes",
              },
              {
                problem: '"Guard ne delivery nahi di"',
                solution: "Phone-based visitor management — no tablet needed",
              },
              {
                problem: '"200 flats, 5 padosi jaante hain"',
                solution: "Community feed — connect, chat, make friends",
              },
            ].map((item) => (
              <div
                key={item.problem}
                className="rounded-xl border border-border bg-background p-6 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <p className="mb-3 text-lg font-semibold text-foreground">
                  {item.problem}
                </p>
                <div className="flex items-start gap-2">
                  <CheckCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-success"
                  />
                  <p className="text-sm text-muted">{item.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground">
            Everything Your Society Needs
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-muted">
            Three powerful modules that cover every aspect of society life.
          </p>

          {/* Module 1: Community */}
          <div className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users size={22} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Community — Padosi Network
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: MessageCircle,
                  title: "Local Feed",
                  desc: "Posts, discussions, photos with your society",
                },
                {
                  icon: Calendar,
                  title: "Events",
                  desc: "Cricket, Holi, yoga — organize & RSVP",
                },
                {
                  icon: ShoppingBag,
                  title: "Buy & Sell",
                  desc: "Sell old items to trusted neighbors",
                },
                {
                  icon: Bell,
                  title: "Alerts",
                  desc: "Power cut, water issue — instant notification",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-surface p-5"
                >
                  <f.icon size={20} className="mb-3 text-primary" />
                  <h4 className="mb-1 font-semibold text-foreground">
                    {f.title}
                  </h4>
                  <p className="text-sm text-muted">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Module 2: Services */}
          <div className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <Truck size={22} className="text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Local Services — Vendor & Help Hub
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Truck,
                  title: "Vendor Tracker",
                  desc: "Doodhwala, sabziwala, dhobi — live status",
                },
                {
                  icon: Users,
                  title: "Maid Network",
                  desc: "Directory, attendance, backup on leave days",
                },
                {
                  icon: AlertTriangle,
                  title: "Emergency SOS",
                  desc: "One tap — alert entire society instantly",
                },
                {
                  icon: MapPin,
                  title: "Service Directory",
                  desc: "Plumber, electrician, tutor — rated by neighbors",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-surface p-5"
                >
                  <f.icon size={20} className="mb-3 text-secondary" />
                  <h4 className="mb-1 font-semibold text-foreground">
                    {f.title}
                  </h4>
                  <p className="text-sm text-muted">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Module 3: Management */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Shield size={22} className="text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Management — Society Khata
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: ClipboardList,
                  title: "Complaint Board",
                  desc: "Raise, track, resolve — publicly visible",
                },
                {
                  icon: Shield,
                  title: "Visitor Log",
                  desc: "Pre-approve guests, guard gets list on phone",
                },
                {
                  icon: Vote,
                  title: "Polls & Voting",
                  desc: "Democratic decisions — no more AGM fights",
                },
                {
                  icon: ClipboardList,
                  title: "Finance Tracker",
                  desc: "Maintenance, expenses, fund balance — transparent",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-surface p-5"
                >
                  <f.icon size={20} className="mb-3 text-accent" />
                  <h4 className="mb-1 font-semibold text-foreground">
                    {f.title}
                  </h4>
                  <p className="text-sm text-muted">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground">
            Why MySociety Over Others?
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 font-semibold text-foreground">
                    Feature
                  </th>
                  <th className="py-3 px-4 font-semibold text-muted">
                    MyGate
                  </th>
                  <th className="py-3 px-4 font-semibold text-muted">ADDA</th>
                  <th className="py-3 px-4 font-semibold text-primary">
                    MySociety
                  </th>
                </tr>
              </thead>
              <tbody className="text-muted">
                {[
                  ["Community & Chat", "No", "Basic", "Full"],
                  ["Vendor Tracking", "No", "No", "Built-in"],
                  ["Emergency SOS", "No", "No", "One-tap"],
                  ["Maid Management", "No", "No", "Directory + Attendance"],
                  ["Financial Transparency", "No", "Basic", "Complete Khata"],
                  ["Gate Management", "Tablet needed", "No", "Phone-based"],
                  ["Hindi Support", "No", "No", "Full"],
                  ["Cost to Society", "Rs 3K-15K/mo", "Rs 1K-5K/mo", "Free"],
                ].map(([feature, mygate, adda, us]) => (
                  <tr key={feature} className="border-b border-border">
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {feature}
                    </td>
                    <td className="py-3 px-4">{mygate}</td>
                    <td className="py-3 px-4">{adda}</td>
                    <td className="py-3 px-4 font-semibold text-primary">
                      {us}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Ready to Transform Your Society?
          </h2>
          <p className="mb-8 text-lg text-muted">
            Join MySociety today. Free for all residents. No hardware, no
            hassle.
          </p>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Get Started — It&apos;s Free
            <ArrowRight size={20} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-white text-sm font-bold">
                M
              </div>
              <span className="font-semibold text-foreground">MySociety</span>
            </div>
            <p className="text-sm text-muted">
              Built by{" "}
              <a
                href="https://www.techsystemlab.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                TechSystem Lab
              </a>
            </p>
            <p className="text-sm text-muted">
              &copy; {new Date().getFullYear()} MySociety. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
