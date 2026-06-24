/** Food photography for dining menu cards (Unsplash, stable crop URLs). */
export const MEAL_CATEGORY_IMAGES: Record<"breakfast" | "lunch" | "dinner", string> = {
  breakfast:
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80",
  lunch:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
  dinner:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
};

export const MEAL_IMAGES: Record<string, string> = {
  "bf-continental":
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
  "bf-rwandan":
    "https://images.unsplash.com/photo-1493777903763-641961ad129e?auto=format&fit=crop&w=800&q=80",
  "bf-american":
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80",
  "bf-fruit":
    "https://images.unsplash.com/photo-1610348728780-84383c40ace2?auto=format&fit=crop&w=800&q=80",
  "bf-pancakes":
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7440?auto=format&fit=crop&w=800&q=80",
  "ln-chicken":
    "https://images.unsplash.com/photo-1598103442097-9b6fcb38214a?auto=format&fit=crop&w=800&q=80",
  "ln-brochette":
    "https://images.unsplash.com/photo-1555939593-155d05989cae?auto=format&fit=crop&w=800&q=80",
  "ln-veg-curry":
    "https://images.unsplash.com/photo-1455619452474-f8f096c79d49?auto=format&fit=crop&w=800&q=80",
  "ln-club":
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  "ln-salad":
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
  "dn-tilapia":
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
  "dn-beef-stew":
    "https://images.unsplash.com/photo-1604908177295-0a3f0a2e8e3b?auto=format&fit=crop&w=800&q=80",
  "dn-pasta":
    "https://images.unsplash.com/photo-1612874741230-82278e2b9b8d?auto=format&fit=crop&w=800&q=80",
  "dn-soup":
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
  "dn-dessert":
    "https://images.unsplash.com/photo-1606313564200-e75d5f8c8e4b?auto=format&fit=crop&w=800&q=80",
};

export function mealImageUrl(
  menuItemId: string,
  category: "breakfast" | "lunch" | "dinner" = "breakfast",
): string {
  return MEAL_IMAGES[menuItemId] ?? MEAL_CATEGORY_IMAGES[category];
}
