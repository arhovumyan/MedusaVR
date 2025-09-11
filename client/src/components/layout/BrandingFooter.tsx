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
    Sparkles,
} from "lucide-react";
import { Link } from "wouter";

export function BrandingFooter() {
    return (
        <footer className="relative overflow-hidden">
            {/* Background with gradient and glow effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-black"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 via-transparent to-transparent"></div>
            
            <div className="relative bg-gradient-to-br from-zinc-800/40 to-zinc-900/60 backdrop-blur-xl border-t border-orange-500/20 shadow-2xl">
                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-8 sm:py-12 lg:py-16">
                    
                    {/* Main content - Three column layout maintained on all screen sizes */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-12">
                        
                        {/* Platform Links - Left */}
                        <div>
                            <h4 className="mb-2 sm:mb-4 text-orange-300 font-semibold text-xs sm:text-sm uppercase tracking-wide text-center">Platform</h4>
                            <ul className="space-y-1 sm:space-y-2 text-zinc-400">
                                {[
                                    { name: "Characters", icon: Users, route: "/gallery" },
                                    { name: "Features", icon: Sparkles, route: "/features" },
                                    { name: "Creators", icon: Users, route: "/creators" },
                                    { name: "Generate", icon: Video, route: "/generate-images" },
                                    { name: "Premium", icon: Heart, route: "/subscribe" },
                                    { name: "Showcase", icon: ExternalLink, route: "/showcase" },
                                    { name: "Following", icon: Users, route: "/following" },
                                    { name: "Favorites", icon: Heart, route: "/favorites" }
                                ].map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.route} className="hover:text-orange-300 transition-colors duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm justify-center">
                                            <item.icon className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                                            <span className="truncate text-xs sm:text-sm">{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Enhanced Branding Section - Center */}
                        <div className="text-center space-y-3 sm:space-y-6">
                            <div className="space-y-2 sm:space-y-4">
                                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-orange-500/30 rounded-lg sm:rounded-xl blur-sm sm:blur-lg"></div>
                                        <div className="relative w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                                            <Video size={16} className="sm:w-6 sm:h-6 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                                        MedusaVR
                                    </h3>
                                </div>
                                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xs sm:max-w-md mx-auto px-1">
                                    The ultimate AI companion platform. Chat, create, and connect with advanced AI characters.
                                </p>
                            </div>
                            
                            {/* Company info with better styling */}
                            <div className="space-y-2 sm:space-y-4">
                                <div className="text-xs text-zinc-600">
                                    Medusa AI Inc.
                                </div>
                                
                                {/* Centered Trusted & Secure and Payment buttons */}
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs text-zinc-500">
                                        <Shield className="w-2 h-2 sm:w-3 sm:h-3 text-orange-400" />
                                        <span className="font-medium text-xs">Trusted & Secure</span>
                                    </div>
                                    <div className="text-xs text-zinc-500 mb-1 sm:mb-2 font-medium">Secure Payments</div>
                                    <div className="flex items-center justify-center space-x-1 sm:space-x-3">
                                        <button className="px-2 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 hover:from-zinc-700/80 hover:to-zinc-600/80 rounded sm:rounded-lg text-xs text-zinc-300 font-medium border border-zinc-600/50 transition-all duration-200 hover:border-orange-500/30">
                                            VISA
                                        </button>
                                        <button className="px-2 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 hover:from-zinc-700/80 hover:to-zinc-600/80 rounded sm:rounded-lg text-xs text-zinc-300 font-medium border border-zinc-600/50 transition-all duration-200 hover:border-orange-500/30">
                                            MC
                                        </button>
                                        <button className="px-2 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 hover:from-zinc-700/80 hover:to-zinc-600/80 rounded sm:rounded-lg text-xs text-zinc-300 font-medium border border-zinc-600/50 transition-all duration-200 hover:border-orange-500/30">
                                            AMEX
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resources Links - Right */}
                        <div>
                            <h4 className="mb-2 sm:mb-4 text-orange-300 font-semibold text-xs sm:text-sm uppercase tracking-wide text-center">Resources</h4>
                            <ul className="space-y-1 sm:space-y-2 text-zinc-400">
                                {[
                                    { name: "Support", icon: HelpCircle, route: "mailto:vrfans11@gmail.com" },
                                    { name: "Become a Creator", icon: Users, route: "/create-character" },
                                    { name: "Community Guidelines", icon: Shield, route: "/legal/community-guidelines" },
                                    { name: "Content Policy", icon: Shield, route: "/legal/blocked-content-policy" },
                                    { name: "Legal", icon: ExternalLink, route: "/legal" },
                                    { name: "FAQ", icon: HelpCircle, route: "/guides" },
                                    { name: "Download App", icon: Download, route: "#" }
                                ].map((item) => (
                                    <li key={item.name}>
                                        {item.route.startsWith('mailto:') ? (
                                            <a href={item.route} className="hover:text-orange-300 transition-colors duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm justify-center">
                                                <item.icon className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                                                <span className="truncate text-xs sm:text-sm">{item.name}</span>
                                            </a>
                                        ) : item.route === "#" ? (
                                            <span className="text-zinc-500 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm justify-center cursor-not-allowed">
                                                <item.icon className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                                                <span className="truncate text-xs sm:text-sm">{item.name}</span>
                                            </span>
                                        ) : (
                                            <Link href={item.route} className="hover:text-orange-300 transition-colors duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm justify-center">
                                                <item.icon className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                                                <span className="truncate text-xs sm:text-sm">{item.name}</span>
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    {/* Copyright */}
                    <div className="mt-8 sm:mt-12 pt-4 sm:pt-8 border-t border-orange-500/20 text-center">
                        <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                            © 2025 MedusaVR. All rights reserved. Made with <Heart className="w-2 h-2 sm:w-3 sm:h-3 text-orange-400" /> by the MedusaVR team.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}