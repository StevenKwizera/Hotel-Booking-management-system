package com.orkestra.service;

import com.orkestra.domain.enums.MealCategory;
import com.orkestra.dto.ApiDtos;
import java.util.List;
import java.util.Optional;

public final class MenuCatalog {

    /** Test-friendly menu prices (RWF) — each item ≤ 300 for safe Paypack trials. */
    private static final List<ApiDtos.MenuItemDto> ITEMS = List.of(
            item("bf-continental", "Continental Breakfast", MealCategory.BREAKFAST, 50,
                    "Pastries, juice, coffee or tea, and seasonal fruit."),
            item("bf-rwandan", "Rwandan Breakfast", MealCategory.BREAKFAST, 100,
                    "Igikoma, scrambled eggs, brochette, and African tea."),
            item("bf-american", "American Breakfast", MealCategory.BREAKFAST, 150,
                    "Eggs any style, bacon, toast, hash browns, and coffee."),
            item("bf-fruit", "Fresh Fruit Plate", MealCategory.BREAKFAST, 50,
                    "Seasonal tropical fruit platter."),
            item("bf-pancakes", "Pancakes & Maple", MealCategory.BREAKFAST, 100,
                    "Stack of pancakes with maple syrup and butter."),
            item("ln-chicken", "Grilled Chicken & Chips", MealCategory.LUNCH, 100,
                    "Herb-marinated chicken with fries and garden salad."),
            item("ln-brochette", "Beef Brochette Platter", MealCategory.LUNCH, 150,
                    "Rwandan-style brochettes with pilau rice and kachumbari."),
            item("ln-veg-curry", "Vegetarian Curry", MealCategory.LUNCH, 50,
                    "Mixed vegetables in coconut curry with steamed rice."),
            item("ln-club", "Club Sandwich", MealCategory.LUNCH, 100,
                    "Triple-decker with chicken, egg, bacon, and fries."),
            item("ln-salad", "Chef Salad Bowl", MealCategory.LUNCH, 50,
                    "Greens, grilled chicken, avocado, and vinaigrette."),
            item("dn-tilapia", "Pan-fried Tilapia", MealCategory.DINNER, 150,
                    "Lake tilapia with lemon butter, vegetables, and potatoes."),
            item("dn-beef-stew", "Beef Stew & Ugali", MealCategory.DINNER, 100,
                    "Slow-cooked beef stew served with ugali and greens."),
            item("dn-pasta", "Pasta Carbonara", MealCategory.DINNER, 100,
                    "Creamy pasta with bacon, parmesan, and garlic bread."),
            item("dn-soup", "Soup of the Day", MealCategory.DINNER, 50,
                    "Chef's daily soup with artisan bread roll."),
            item("dn-dessert", "Chocolate Lava Cake", MealCategory.DINNER, 50,
                    "Warm chocolate cake with vanilla ice cream."));

    private MenuCatalog() {}

    private static ApiDtos.MenuItemDto item(
            String id, String name, MealCategory category, long priceRwf, String description) {
        return new ApiDtos.MenuItemDto(id, name, category.name().toLowerCase(), priceRwf, description);
    }

    public static List<ApiDtos.MenuItemDto> all() {
        return ITEMS;
    }

    public static List<ApiDtos.MenuItemDto> byCategory(MealCategory category) {
        String key = category.name().toLowerCase();
        return ITEMS.stream().filter(i -> i.category().equals(key)).toList();
    }

    public static Optional<ApiDtos.MenuItemDto> find(String menuItemId) {
        return ITEMS.stream().filter(i -> i.id().equals(menuItemId)).findFirst();
    }
}
