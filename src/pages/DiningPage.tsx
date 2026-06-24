import { useAuth } from "@/context/AuthContext";
import { GuestMealOrderPanel } from "@/components/dining/GuestMealOrderPanel";
import { ReceptionMealOrdersPanel } from "@/components/dining/ReceptionMealOrdersPanel";
import { Card, CardHeader } from "@/components/ui/Card";

export function DiningPage() {
  const { user } = useAuth();
  const isGuest = user?.role === "guest";
  const isReception =
    user?.role === "receptionist" || user?.role === "admin" || user?.role === "management";
  const isStaff = user?.role === "staff";

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-amber-200/40 p-0 dark:border-amber-500/20">
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80"
            alt="Hotel restaurant"
            className="h-40 w-full object-cover sm:h-48"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="font-display text-2xl font-semibold text-white">Dining & room service</h1>
            <p className="mt-1 max-w-xl text-sm text-white/90">
              {isGuest
                ? "Browse the menu with photos, order to your room, pay after approval"
                : "Manage guest meal orders from approval through kitchen and delivery"}
            </p>
          </div>
        </div>
      </Card>

      {isGuest && <GuestMealOrderPanel />}
      {(isReception || isStaff) && <ReceptionMealOrdersPanel />}
      {!isGuest && !isReception && !isStaff && (
        <Card>
          <CardHeader title="Dining" subtitle="Meal ordering is available for guests and hotel staff" />
        </Card>
      )}
    </div>
  );
}
