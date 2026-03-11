import { useOutletContext } from "react-router";
import Navbar from "../../components/Navbar";
import Button from "../../components/ui/Button";
import { Check, Zap, Building2, Sparkles } from "lucide-react";

export function meta() {
    return [
        { title: "Pricing – Roomie" },
        { name: "description", content: "Simple, transparent pricing for every team." },
    ];
}

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "forever",
        description: "Perfect for exploring Roomie and personal projects.",
        icon: <Sparkles className="w-5 h-5" />,
        cta: "Get Started",
        ctaVariant: "outline" as const,
        highlight: false,
        features: [
            "3 renders per month",
            "720p output resolution",
            "Community gallery access",
            "Basic floor plan support",
            "PNG export",
        ],
    },
    {
        name: "Pro",
        price: "$19",
        period: "per month",
        description: "For designers and architects who ship regularly.",
        icon: <Zap className="w-5 h-5" />,
        cta: "Start Free Trial",
        ctaVariant: "primary" as const,
        highlight: true,
        features: [
            "Unlimited renders",
            "4K output resolution",
            "Priority rendering queue",
            "Before/after comparison tool",
            "PNG, JPG, WebP export",
            "Share to community",
            "Project history (6 months)",
        ],
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "contact us",
        description: "For studios and firms with advanced needs.",
        icon: <Building2 className="w-5 h-5" />,
        cta: "Contact Sales",
        ctaVariant: "outline" as const,
        highlight: false,
        features: [
            "Everything in Pro",
            "Dedicated render nodes",
            "SSO & team management",
            "API access",
            "Custom branding",
            "SLA & uptime guarantee",
            "Unlimited project history",
            "Dedicated support",
        ],
    },
];

const faqs = [
    {
        q: "Can I cancel anytime?",
        a: "Yes. No lock-in contracts. Cancel from your account settings at any time and you won't be charged again.",
    },
    {
        q: "What counts as a 'render'?",
        a: "Each time you upload a floor plan and generate a 3D visualization counts as one render. Re-generating the same plan also counts.",
    },
    {
        q: "Do unused renders roll over?",
        a: "Free plan renders reset monthly and do not roll over. Pro plan is unlimited so there's nothing to roll over.",
    },
    {
        q: "Is there a student discount?",
        a: "Yes — students and educators get 50% off Pro. Reach out with your institutional email to verify.",
    },
];

export default function Pricing() {
    const { signIn, isSignedIn } = useOutletContext<AuthContext>();

    return (
        <div className="home">
            <Navbar />

            {/* Hero */}
            <section className="pt-32 pb-16 px-6 max-w-7xl mx-auto text-center">
                <div className="mb-6 inline-flex items-center px-3 py-1 rounded-md bg-white border border-zinc-200 shadow-sm">
                    <div className="w-4 h-4 rounded bg-orange-100 flex items-center justify-center mr-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Simple Pricing</p>
                </div>

                <h1 className="text-6xl md:text-7xl font-serif leading-tight text-black mb-6 max-w-3xl mx-auto">
                    Pay for what you use
                </h1>
                <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 max-w-xl mx-auto">
                    No hidden fees. No surprise charges. Scale up or down as your projects demand.
                </p>
            </section>

            {/* Plans */}
            <section className="pb-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl border p-8 flex flex-col transition-all duration-300 ${
                                plan.highlight
                                    ? "bg-black text-white border-black shadow-2xl scale-[1.03]"
                                    : "bg-white text-black border-zinc-200 shadow-sm hover:shadow-lg"
                            }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 ${plan.highlight ? "bg-white/10" : "bg-zinc-100"}`}>
                                <span className={plan.highlight ? "text-white" : "text-black"}>{plan.icon}</span>
                            </div>

                            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan.highlight ? "text-zinc-400" : "text-zinc-500"}`}>{plan.name}</p>
                            <div className="flex items-end gap-1 mb-1">
                                <span className="text-5xl font-serif font-bold">{plan.price}</span>
                                {plan.price !== "Custom" && (
                                    <span className={`text-sm mb-2 ${plan.highlight ? "text-zinc-400" : "text-zinc-500"}`}>/{plan.period}</span>
                                )}
                            </div>
                            {plan.price === "Custom" && (
                                <span className={`text-sm mb-2 ${plan.highlight ? "text-zinc-400" : "text-zinc-500"}`}>{plan.period}</span>
                            )}

                            <p className={`text-sm mt-2 mb-8 leading-relaxed ${plan.highlight ? "text-zinc-400" : "text-zinc-500"}`}>
                                {plan.description}
                            </p>

                            <ul className="space-y-3 mb-10 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-3 text-sm">
                                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? "text-primary" : "text-green-500"}`} />
                                        <span className={plan.highlight ? "text-zinc-300" : "text-zinc-700"}>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => !isSignedIn && signIn()}
                                className={`w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all duration-200 ${
                                    plan.highlight
                                        ? "bg-primary text-white hover:bg-orange-600"
                                        : "bg-zinc-100 text-black hover:bg-zinc-200 border border-zinc-200"
                                }`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 bg-white border-t border-zinc-100">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-4xl font-serif text-black mb-12 text-center">Frequently asked</h2>
                    <div className="space-y-6">
                        {faqs.map((faq) => (
                            <div key={faq.q} className="border border-zinc-200 rounded-xl p-6">
                                <p className="font-bold text-black mb-2">{faq.q}</p>
                                <p className="text-zinc-500 text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA strip */}
            <section className="py-24 px-6 max-w-7xl mx-auto text-center">
                <h2 className="text-5xl font-serif text-black mb-4">Ready to start building?</h2>
                <p className="text-zinc-500 text-sm uppercase tracking-widest font-mono mb-8">No credit card required on free plan.</p>
                <button
                    onClick={() => !isSignedIn && signIn()}
                    className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white text-sm font-bold uppercase tracking-wide rounded-xl hover:bg-orange-600 transition-all"
                >
                    Start for free
                </button>
            </section>
        </div>
    );
}