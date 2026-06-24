package com.orkestra.domain.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "meal_order_lines")
public class MealOrderLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meal_order_id", nullable = false)
    private MealOrder mealOrder;

    @Column(nullable = false)
    private String menuItemId;

    @Column(nullable = false)
    private String itemName;

    private long unitPriceRwf;

    private int quantity;

    private long lineTotalRwf;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public MealOrder getMealOrder() { return mealOrder; }
    public void setMealOrder(MealOrder mealOrder) { this.mealOrder = mealOrder; }
    public String getMenuItemId() { return menuItemId; }
    public void setMenuItemId(String menuItemId) { this.menuItemId = menuItemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public long getUnitPriceRwf() { return unitPriceRwf; }
    public void setUnitPriceRwf(long unitPriceRwf) { this.unitPriceRwf = unitPriceRwf; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public long getLineTotalRwf() { return lineTotalRwf; }
    public void setLineTotalRwf(long lineTotalRwf) { this.lineTotalRwf = lineTotalRwf; }
}
