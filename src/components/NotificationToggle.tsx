import { forwardRef } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/contexts/AuthContext";

export const NotificationToggle = forwardRef<HTMLButtonElement>((_, ref) => {
  const { user } = useAuth();
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } =
    usePushNotifications();

  if (!isSupported || !user) return null;

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={loading}
      title={isSubscribed ? "Disable notifications" : "Enable notifications"}
      className="relative"
    >
      {isSubscribed ? (
        <Bell className="h-5 w-5 text-primary" />
      ) : (
        <BellOff className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );
});

NotificationToggle.displayName = "NotificationToggle";
