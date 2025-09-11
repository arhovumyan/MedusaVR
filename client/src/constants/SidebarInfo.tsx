//SidebarInfo.tsx
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  BarChart, 
  BarChart3,
  Bookmark,
  MessageCircle,
  Bot,
  Image,
  Flame,
  HandCoins,
  Goal,
  BookHeart,
  FileImage,
  BookOpen,
} from "lucide-react";

export const sidebarItems = [
  { icon: <Bookmark size={20} />,      text: "For You",        route: "/" },
  { icon: <User size={20} />,          text: "Profile",        route: "/user-profile" }, // Will be handled dynamically
  { icon: <MessageCircle size={20} />, text: "Chat",           route: "/chat" },
  { icon: <Bot size={20} />,           text: "Characters",     route: "/user-characters" },
  { icon: <Image size={20} />,         text: "Gallery",        route: "/showcase" },
  { icon: <FileImage size={20} />,     text: "User Gallery",   route: "/user-gallery" },
  { icon: <Flame size={20} />,         text: "Favorites",      route: "/favorites" },
  { icon: <BookOpen size={20} />,      text: "Guides",         route: "/guides" },
  { icon: <HandCoins size={20} />,     text: "Coins",          route: "/coins" },
  { icon: <Goal size={20} />,          text: "Membership",     route: "/subscribe" },
  { divider: true },
  { icon: <BookHeart size={20} />,     text: "Create a Model", route: "/create-character" },
  { icon: <FileImage size={20} />,     text: "Generate images", route: "/generate-images" },
];

