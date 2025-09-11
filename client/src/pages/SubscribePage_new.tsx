import { Button } from "@/components/ui/button";

export default function SubscribePage() {
  return (
    <div className="container mx-auto p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Subscriptions Coming Soon</h1>
        <p className="text-muted-foreground mb-8">
          We're working on implementing crypto-based subscriptions. 
          For now, you can purchase coins to chat with characters.
        </p>
        <Button 
          onClick={() => window.location.href = '/coins'}
          size="lg"
        >
          Buy Coins Instead
        </Button>
      </div>
    </div>
  );
}
