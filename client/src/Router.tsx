import { Switch, Route, useLocation } from "wouter";
import { Suspense, lazy, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LikesProvider } from "./hooks/useLikes";
import { FavoritesProvider } from "./hooks/useFavorites";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Lazy load all pages
const ForYouPage = lazy(() => import("@/pages/ForYouPage"));
const FollowingPage = lazy(() => import("@/pages/following"));
const CreatorsPage = lazy(() => import("@/pages/creators"));
const CreatorProfilePage = lazy(() => import("@/pages/creator-profile"));
const RecentChatsPage = lazy(() => import("@/pages/recent-chats"));
const SubscribePage = lazy(() => import("@/pages/SubscribePage"));
const SubscriptionManagePage = lazy(() => import("@/pages/SubscriptionManagePage"));
const SubscriptionSuccessPage = lazy(() => import("@/pages/SubscriptionSuccessPage"));
const SubscriptionCancelPage = lazy(() => import("@/pages/SubscriptionCancelPage"));
const CoinsPage = lazy(() => import("@/pages/CoinsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotFound = lazy(() => import("@/pages/not-found"));
const ChatPage = lazy(() => import("./pages/Chat/ChatPage"));
const CharacterProfile = lazy(() => import("./pages/CharacterProfile"));
const CharacterPage = lazy(() => import("./pages/CharacterPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage").then(module => ({ default: module.default })));
const UserGalleryPage = lazy(() => import("./pages/UserGalleryPage"));
const CharacterGallery = lazy(() => import("./pages/CharacterGallery"));
const UserCharacterGalleryPage = lazy(() => import("./pages/UserCharacterGalleryPage"));
const AllUserImagesPage = lazy(() => import("./pages/AllUserImagesPage"));
const ShowcasePage = lazy(() => import("./pages/ShowcasePage"));
const EmailVerificationPage = lazy(() => import("./pages/EmailVerificationPage"));
const CreateCharacter = lazy(() => import("./pages/CreateCharacter"));
const CreateCharacterEnhanced = lazy(() => import("./pages/CreateCharacterEnhanced"));
const UserCharacters = lazy(() => import("./pages/UserCharacters"));
const TestPage = lazy(() => import("./pages/TestPage"));
const TagPage = lazy(() => import("./pages/TagPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const AuthDebugPage = lazy(() => import("./pages/AuthDebugPage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const PaymentCancelPage = lazy(() => import("./pages/PaymentCancelPage"));
const GenerateImagesPage = lazy(() => import("./pages/GenerateImagesPage"));
const CharacterGalleryPage = lazy(() => import("./pages/CharacterGalleryPage"));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));

// Legal pages
const LegalPage = lazy(() => import("./pages/LegalPage"));
const CommunityGuidelinesPage = lazy(() => import("./pages/legal/CommunityGuidelinesPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/legal/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/legal/TermsOfServicePage"));
const ContentPolicyPage = lazy(() => import("./pages/legal/ContentPolicyPage"));
const BlockedContentPolicyPage = lazy(() => import("./pages/legal/BlockedContentPolicyPage"));
const CookiePolicyPage = lazy(() => import("./pages/legal/CookiePolicyPage"));
const DMCANoticePage = lazy(() => import("./pages/legal/DMCANoticePage"));
const ExemptionStatementPage = lazy(() => import("./pages/legal/ExemptionStatementPage"));
const ContentProviderCompliancePage = lazy(() => import("./pages/legal/ContentProviderCompliancePage"));
const ContentSafetyCompliancePage = lazy(() => import("./pages/legal/ContentSafetyCompliancePage"));
const LiabilityDisclaimerPage = lazy(() => import("./pages/legal/LiabilityDisclaimerPage"));

// Blog/Guides pages
const GuidesPage = lazy(() => import("./pages/GuidesPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));

// Elegant loading fallback
const PageSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white flex items-center justify-center">
    <LoadingSpinner size="xl" text="Loading page..." />
  </div>
);

// Reusable safe lazy route
const SafeLazyRoute = ({ Component }: { Component: React.LazyExoticComponent<() => JSX.Element> }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageSkeleton />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

// Component to handle scroll to top on route change
function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Scroll to top whenever the route changes
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

export default function Router() {
  return (
    <LikesProvider>
      <FavoritesProvider>
        <ScrollToTop />
        <Switch>
          <Route path="/verify-email" component={() => <SafeLazyRoute Component={EmailVerificationPage} />} />
          <Route path="/" component={() => <SafeLazyRoute Component={ForYouPage} />} />
          <Route path="/test-chat" component={() => <SafeLazyRoute Component={ChatPage} />} />
          <Route path="/chat" component={() => <SafeLazyRoute Component={RecentChatsPage} />} />
          <Route path="/ForYouPage" component={() => <SafeLazyRoute Component={ForYouPage} />} />
          <Route path="/following" component={() => <SafeLazyRoute Component={FollowingPage} />} />
          <Route path="/creators" component={() => <SafeLazyRoute Component={CreatorsPage} />} />
          <Route path="/creators/:id" component={() => <SafeLazyRoute Component={CreatorProfilePage} />} />
          <Route path="/characters/:id" component={() => <SafeLazyRoute Component={CharacterPage} />} />
          <Route path="/generate-images" component={() => <SafeLazyRoute Component={GenerateImagesPage} />} />
          <Route path="/character-gallery/:characterId" component={() => <SafeLazyRoute Component={CharacterGalleryPage} />} />
          <Route path="/chat/:characterId" component={() => <SafeLazyRoute Component={ChatPage} />} />
          <Route path="/recent-chats" component={() => <SafeLazyRoute Component={RecentChatsPage} />} />
          <Route path="/subscribe" component={() => <SafeLazyRoute Component={SubscribePage} />} />
          <Route path="/subscription/manage" component={() => <SafeLazyRoute Component={SubscriptionManagePage} />} />
          <Route path="/subscription/success" component={() => <SafeLazyRoute Component={SubscriptionSuccessPage} />} />
          <Route path="/subscription/cancel" component={() => <SafeLazyRoute Component={SubscriptionCancelPage} />} />
          <Route path="/coins" component={() => <SafeLazyRoute Component={CoinsPage} />} />
          <Route path="/payment/success" component={() => <SafeLazyRoute Component={PaymentSuccessPage} />} />
          <Route path="/payment/cancel" component={() => <SafeLazyRoute Component={PaymentCancelPage} />} />
          <Route path="/settings" component={() => <SafeLazyRoute Component={SettingsPage} />} />
          <Route path="/showcase" component={() => <SafeLazyRoute Component={ShowcasePage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/gallery" component={() => <SafeLazyRoute Component={CharacterGallery as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/user-gallery" component={() => <SafeLazyRoute Component={UserGalleryPage as unknown as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/user-gallery/character/:characterId" component={() => <SafeLazyRoute Component={UserCharacterGalleryPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/all-user-images" component={() => <SafeLazyRoute Component={AllUserImagesPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/search" component={() => <SafeLazyRoute Component={SearchPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/features" component={() => <SafeLazyRoute Component={FeaturesPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/tags/:tagName" component={() => <SafeLazyRoute Component={TagPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/favorites" component={() => <SafeLazyRoute Component={FavoritesPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/not-found" component={() => <SafeLazyRoute Component={NotFoundPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/user-profile" component={() => <SafeLazyRoute Component={UserProfilePage} />} />
          <Route path="/user-profile/:id" component={() => <SafeLazyRoute Component={UserProfilePage} />} />
          <Route path="/user-gallery" component={() => <SafeLazyRoute Component={UserGalleryPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/create-character" component={() => <SafeLazyRoute Component={CreateCharacterEnhanced as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/create-character-old" component={() => <SafeLazyRoute Component={CreateCharacter as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/user-characters" component={() => <SafeLazyRoute Component={UserCharacters} />} />
          <Route path="/test" component={() => <SafeLazyRoute Component={TestPage} />} />
          <Route path="/auth-debug" component={() => <SafeLazyRoute Component={AuthDebugPage} />} />
          
          {/* Guides/Blog routes */}
          <Route path="/guides" component={() => <SafeLazyRoute Component={GuidesPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/guides/:slug" component={() => <SafeLazyRoute Component={BlogPostPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          
          {/* Legal routes */}
          <Route path="/legal" component={() => <SafeLazyRoute Component={LegalPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/legal/community-guidelines" component={() => <SafeLazyRoute Component={CommunityGuidelinesPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/legal/privacy-policy" component={() => <SafeLazyRoute Component={PrivacyPolicyPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/legal/terms-of-service" component={() => <SafeLazyRoute Component={TermsOfServicePage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/legal/content-policy" component={() => <SafeLazyRoute Component={ContentPolicyPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/legal/blocked-content-policy" component={() => <SafeLazyRoute Component={BlockedContentPolicyPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/legal/cookie-policy" component={() => <SafeLazyRoute Component={CookiePolicyPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/legal/dmca-notice" component={() => <SafeLazyRoute Component={DMCANoticePage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/legal/2257-exemption-statement" component={() => <SafeLazyRoute Component={ExemptionStatementPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/legal/content-provider-compliance" component={() => <SafeLazyRoute Component={ContentProviderCompliancePage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/legal/content-safety-compliance" component={() => <SafeLazyRoute Component={ContentSafetyCompliancePage as React.LazyExoticComponent<() => JSX.Element>} />} />
          <Route path="/legal/liability-disclaimer" component={() => <SafeLazyRoute Component={LiabilityDisclaimerPage as React.LazyExoticComponent<() => JSX.Element>} />} />
          
          <Route path="*" component={() => <SafeLazyRoute Component={NotFoundPage} />} />
        </Switch>
      </FavoritesProvider>
    </LikesProvider>
  );
}
