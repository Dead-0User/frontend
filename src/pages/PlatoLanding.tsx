import React, { useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// --- Components ---

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    {/* Logo placeholder - using text as requested for minimal vibe */}
                    <span className="text-xl font-bold tracking-tight text-gray-900">Plato</span>
                </div>
                <div className="hidden md:flex md:items-center md:gap-8">
                    <button onClick={() => document.getElementById('problem')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-gray-600 hover:text-gray-900">Why Plato?</button>
                    <button onClick={() => document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-gray-600 hover:text-gray-900">Solution</button>
                    <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</button>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        className="hidden text-gray-900 hover:bg-gray-50 md:flex"
                        onClick={() => navigate("/login")}
                    >
                        Log in
                    </Button>
                    <Button
                        className="bg-orange-600 text-white hover:bg-orange-700 active:scale-95 transition-all"
                        onClick={() => navigate("/signup")}
                    >
                        Get Started
                    </Button>
                </div>
            </div>
        </nav>
    );
};

const HeroSection = () => {
    const navigate = useNavigate();
    return (
        <section className="relative overflow-hidden pt-24 pb-8 lg:pt-32 lg:pb-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl leading-[1.1]"
                    >
                        Know how your restaurant is doing — <span className="text-orange-600">without asking anyone.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                        className="mt-6 text-lg leading-8 text-gray-600"
                    >
                        The operating system for modern restaurants. Replace chaos with clarity.
                        Control your outlets, inventory, and staff from one screen.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        className="mt-10 flex items-center justify-center gap-x-6"
                    >
                        <Button
                            size="lg"
                            className="h-12 px-8 bg-orange-600 text-base font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-95 transition-all duration-200"
                            onClick={() => navigate("/signup")}
                        >
                            Request Demo
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-12 px-8 text-base font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 active:scale-95 transition-all duration-200"
                            onClick={() => navigate("/signup")}
                        >
                            Get Started
                        </Button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

const TrustSection = () => (
    <section className="border-y border-gray-100 py-10 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
            <p className="text-sm font-medium uppercase tracking-widest text-gray-500">
                Built for modern restaurants, cloud kitchens, and growing food brands
            </p>
        </div>
    </section>
);

const ProblemSection = () => (
    <section id="problem" className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-base font-semibold leading-7 text-orange-600">The Problem</h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    Running a restaurant shouldn't feel like fighting a fire.
                </p>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                    You're drowning in spreadsheets, chasing managers for updates, and guessing your food costs.
                    When you have multiple outlets, the chaos multiplies. Tools weren't built for your scale—until now.
                </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                    {[
                        {
                            title: "Scattered Data",
                            description: "Sales in one app, inventory in another, staff scheduling in WhatsApp. No single source of truth.",
                        },
                        {
                            title: "Blind Spots & Theft",
                            description: "If you aren't physically there, you don't know what's happening. Ingredients go missing, cash varies.",
                        },
                        {
                            title: "Growth is Painful",
                            description: "Opening a new outlet adds exponential complexity. Systems break as you scale.",
                        },
                    ].map((feature) => (
                        <motion.div
                            key={feature.title}
                            className="flex flex-col items-start"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                                <X className="h-5 w-5 flex-none text-red-500" aria-hidden="true" />
                                {feature.title}
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                <p className="flex-auto">{feature.description}</p>
                            </dd>
                        </motion.div>
                    ))}
                </dl>
            </div>
        </div>
    </section>
);

const SolutionSection = () => (
    <section id="solution" className="py-24 sm:py-32 bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
                <h2 className="text-base font-semibold leading-7 text-orange-500">The Solution</h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    One Screen. Full Clarity.
                </p>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                    Plato is your single source of truth. Open it and instantly understand your business health.
                    Inventory, sales, staff, and profit—all in real-time.
                </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                    {[
                        {
                            title: "Real-time Visibility",
                            description: "See sales as they happen. Track stock levels live. Know exactly what's cooking.",
                        },
                        {
                            title: "Centralized Control",
                            description: "Push menu updates to all outlets instantly. Manage permissions and pricing centrally.",
                        },
                        {
                            title: "Automatic Insights",
                            description: "Plato calculates your food cost, wastage, and margins automatically. No more manual math.",
                        },
                    ].map((feature) => (
                        <motion.div
                            key={feature.title}
                            className="flex flex-col"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                <Check className="h-5 w-5 flex-none text-orange-500" aria-hidden="true" />
                                {feature.title}
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                                <p className="flex-auto">{feature.description}</p>
                            </dd>
                        </motion.div>
                    ))}
                </dl>
            </div>
        </div>
    </section>
);

const ComparisonSection = () => (
    <section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
                <p className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    Stop Managing the Chaos. <br /> <span className="text-orange-600">Eliminate it.</span>
                </p>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                    We don't just sell software. We sell peace of mind.
                </p>
            </div>

            <div className="mx-auto mt-16 max-w-5xl rounded-3xl ring-1 ring-gray-200 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none">
                <div className="p-8 sm:p-10 lg:flex-auto">
                    <h3 className="text-2xl font-bold tracking-tight text-gray-900 overflow-hidden">What you replace with Plato</h3>
                    <p className="mt-6 text-base leading-7 text-gray-600">
                        Simplify your entire tech stack and mental load.
                    </p>
                    <div className="mt-10 flex items-center gap-x-4">
                        <h4 className="flex-none text-sm font-semibold leading-6 text-orange-600">Goodbye to</h4>
                        <div className="h-px flex-auto bg-gray-100" />
                    </div>
                    <ul role="list" className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6">
                        {[
                            "Daily 'What's the sales?' phone calls",
                            "Messy Excel spreadsheets",
                            "Disparate theft & wastage logs",
                            "Guessing ingredient costs",
                            "Printer jams & missed tickets",
                            "End-of-month panic"
                        ].map((item) => (
                            <li key={item} className="flex gap-x-3">
                                <X className="h-6 w-5 flex-none text-gray-400" aria-hidden="true" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
                    <div className="h-full rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
                        <div className="mx-auto max-w-xs px-8">
                            <p className="text-base font-semibold text-gray-600">With Plato, you get</p>
                            <p className="mt-6 flex items-baseline justify-center gap-x-2">
                                <span className="text-5xl font-bold tracking-tight text-gray-900">Control</span>
                            </p>
                            <a
                                href="/signup"
                                className="mt-10 block w-full rounded-md bg-orange-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                            >
                                Get Access Now
                            </a>
                            <p className="mt-6 text-xs leading-5 text-gray-600">
                                Instant setup • No credit card required to start
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const GrowthSection = () => (
    <section className="py-24 bg-orange-50/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    Built to Scale with You
                </h2>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                    Whether you have 1 cloud kitchen or 100 franchise outlets, Plato works the same way.
                    Zero friction. Complexity does not increase with scale.
                </p>
            </div>
            <div className="mt-12 flex justify-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="text-4xl font-bold text-orange-600 mb-2">1</div>
                        <div className="text-sm font-medium text-gray-500">Outlet</div>
                    </div>
                    <div className="flex items-center justify-center">
                        <ArrowRight className="text-gray-300 h-8 w-8 hidden md:block" />
                        <div className="h-8 w-1 bg-gray-200 md:hidden block my-2 mx-auto"></div>
                    </div>
                    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="text-4xl font-bold text-orange-600 mb-2">100+</div>
                        <div className="text-sm font-medium text-gray-500">Outlets</div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const PricingSection = () => (
    <section id="pricing" className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Simple, Honest Pricing.</h2>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                    No hidden fees. No commissions per order. Just one flat rate for your peace of mind.
                </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-gray-200 lg:mx-0 lg:flex lg:max-w-none">
                <div className="p-8 sm:p-10 lg:flex-auto">
                    <h3 className="text-2xl font-bold tracking-tight text-gray-900">Standard License</h3>
                    <p className="mt-6 text-base leading-7 text-gray-600">
                        Everything you need to run your restaurant, included.
                    </p>
                    <div className="mt-10 flex items-center gap-x-4">
                        <h4 className="flex-none text-sm font-semibold leading-6 text-orange-600">What's included</h4>
                        <div className="h-px flex-auto bg-gray-100" />
                    </div>
                    <ul role="list" className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6">
                        {[
                            "Unlimited Staff Accounts",
                            "Inventory & Recipe Management",
                            "Real-time Analytics",
                            "Access to Mobile Apps",
                            "24/7 Priority Support",
                            "Free Updates Forever"
                        ].map((feature) => (
                            <li key={feature} className="flex gap-x-3">
                                <Check className="h-6 w-5 flex-none text-orange-600" aria-hidden="true" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
                    <div className="h-full rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
                        <div className="mx-auto max-w-xs px-8">
                            <p className="text-base font-semibold text-gray-600">Yearly Plan</p>
                            <p className="mt-6 flex items-baseline justify-center gap-x-2">
                                <span className="text-5xl font-bold tracking-tight text-gray-900">₹10,000</span>
                                <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600">/year</span>
                            </p>
                            <Button
                                onClick={() => document.getElementById('footer-cta')?.scrollIntoView({ behavior: 'smooth' })}
                                className="mt-10 w-full bg-orange-600 text-white hover:bg-orange-700"
                            >
                                Get Started
                            </Button>
                            <p className="mt-6 text-xs leading-5 text-gray-600">
                                Invoices available for GST input credit
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const FooterCTA = () => {
    const navigate = useNavigate();
    return (
        <section id="footer-cta" className="relative isolate overflow-hidden bg-gray-900 py-16 sm:py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
                    <div className="max-w-xl lg:max-w-lg">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to take control?</h2>
                        <p className="mt-4 text-lg leading-8 text-gray-300">
                            Join the hundreds of restaurant owners who found peace of mind with Plato.
                            Stop guessing, start knowing.
                        </p>
                        <div className="mt-6 flex max-w-md gap-x-4">
                            <Button
                                onClick={() => navigate("/signup")}
                                size="lg"
                                className="bg-orange-600 text-white hover:bg-orange-500 font-semibold"
                            >
                                Get Early Access
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-white/10 pt-8 md:flex md:items-center md:justify-between">
                    <p className="mt-8 text-xs leading-5 text-gray-400 md:order-1 md:mt-0">
                        &copy; 2024 Plato Systems. All rights reserved.
                    </p>
                </div>
            </div>
        </section>
    )
};

// --- Main Page Component ---

const PlatoLanding = () => {
    // Add smooth scroll behavior to html
    useEffect(() => {
        document.documentElement.style.scrollBehavior = 'smooth';
        return () => {
            document.documentElement.style.scrollBehavior = 'auto';
        };
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-orange-100 selection:text-orange-900">
            <Navbar />
            <main>
                <HeroSection />
                <TrustSection />
                <ProblemSection />
                <SolutionSection />
                <ComparisonSection />
                <GrowthSection />
                <PricingSection />
                <FooterCTA />
            </main>
        </div>
    );
};

export default PlatoLanding;
