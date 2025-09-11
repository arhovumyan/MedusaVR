import {
    X,
    Video,
    Heart,
    ExternalLink,
    Shield,
    HelpCircle,
    Download,
    Users,
    MessageCircle,
    Globe,
    Mail,
} from "lucide-react";
import { Link } from "wouter";

export function BrandingFooter() {
    return (
        <footer className="relative overflow-hidden">
            {/* Background with gradient and glow effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-black"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 via-transparent to-transparent"></div>
            
            <div className="relative bg-gradient-to-br from-zinc-800/40 to-zinc-900/60 backdrop-blur-xl border-t border-orange-500/20 shadow-2xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                    
                    {/* Main content - Responsive layout with desktop 3-column grid */}
                    <div className="space-y-8 lg:space-y-0">
            
                        {/* Desktop 3-column layout, Mobile stacked */}
                        <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start space-y-8 lg:space-y-0">
                            
                            {/* Platform Links - Left Column on Desktop */}
                            <div className="order-2 lg:order-1">
                                <h4 className="mb-4 text-orange-300 font-semibold text-sm uppercase tracking-wide text-center lg:text-left">Platform</h4>
                                <ul className="space-y-2 text-zinc-400">
                                    {[
                                        { name: "Characters", icon: Users, route: "/gallery" },
                                        { name: "Creators", icon: Users, route: "/creators" },
                                        { name: "Chats", icon: MessageCircle, route: "/chat" },
                                        { name: "Premium", icon: Heart, route: "/subscribe" },
                                        { name: "Gallery", icon: Video, route: "/gallery" },
                                        { name: "Showcase", icon: ExternalLink, route: "/showcase" },
                                        { name: "Following", icon: Users, route: "/following" },
                                        { name: "Favorites", icon: Heart, route: "/favorites" }
                                    ].map((item) => (
                                        <li key={item.name}>
                                            <Link href={item.route} className="hover:text-orange-300 transition-colors duration-200 flex items-center gap-2 text-sm lg:justify-start justify-center">
                                                <item.icon className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Enhanced Branding Section - Center Column on Desktop */}
                            <div className="text-center space-y-6 order-1 lg:order-2">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center space-x-3">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-orange-500/30 rounded-xl blur-lg"></div>
                                            <div className="relative w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                                                <Video size={24} className="text-white" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                                            MedusaVR
                                        </h3>
                                    </div>
                                    <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
                                        The ultimate AI companion platform. Chat, create, and connect with advanced AI characters in immersive conversations.
                                    </p>
                                </div>
                                
                                {/* Company info with better styling */}
                                <div className="space-y-4">
                                    <div className="text-xs text-zinc-600">
                                        Medusa AI Incorporated
                                    </div>
                                    
                                    {/* Centered Trusted & Secure and Payment buttons */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                                            <Shield className="w-3 h-3 text-orange-400" />
                                            <span className="font-medium">Trusted & Secure</span>
                                        </div>
                                        <div className="text-xs text-zinc-500 mb-2 font-medium">Secure Payments</div>
                                        <div className="flex items-center justify-center space-x-3">
                                            <button className="px-4 py-2 bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 hover:from-zinc-700/80 hover:to-zinc-600/80 rounded-lg text-xs text-zinc-300 font-medium border border-zinc-600/50 transition-all duration-200 hover:border-orange-500/30">
                                                VISA
                                            </button>
                                            <button className="px-4 py-2 bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 hover:from-zinc-700/80 hover:to-zinc-600/80 rounded-lg text-xs text-zinc-300 font-medium border border-zinc-600/50 transition-all duration-200 hover:border-orange-500/30">
                                                MC
                                            </button>
                                            <button className="px-4 py-2 bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 hover:from-zinc-700/80 hover:to-zinc-600/80 rounded-lg text-xs text-zinc-300 font-medium border border-zinc-600/50 transition-all duration-200 hover:border-orange-500/30">
                                                AMEX
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Resources Links - Right Column on Desktop */}
                            <div className="order-3 lg:order-3">
                                <h4 className="mb-4 text-orange-300 font-semibold text-sm uppercase tracking-wide text-center lg:text-left">Resources</h4>
                                <ul className="space-y-2 text-zinc-400">
                                    {[
                                        { name: "Support", icon: HelpCircle },
                                        { name: "Become a Creator", icon: Users },
                                        { name: "Community Guidelines", icon: Shield },
                                        { name: "Content Policy", icon: Shield },
                                        { name: "Legal", icon: ExternalLink },
                                        { name: "FAQ", icon: HelpCircle },
                                        { name: "Download App", icon: Download }
                                    ].map((item) => (
                                        <li key={item.name}>
                                            <a href="#" className="hover:text-orange-300 transition-colors duration-200 flex items-center gap-2 text-sm lg:justify-start justify-center">
                                                <item.icon className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{item.name}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    {/* Copyright */}
                    <div className="mt-12 pt-8 border-t border-orange-500/20 text-center">
                        <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                            © 2025 MedusaVR. All rights reserved. Made with <Heart className="w-3 h-3 text-orange-400" /> by the MedusaVR team.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}