package com.orkestra.service;

import com.orkestra.domain.enums.RoomType;
import java.util.List;

/** Room contents & amenities by category — Net Luna Villa Kigali */
public final class RoomCatalog {

    private RoomCatalog() {}

    public record RoomProfile(
            String description,
            int maxGuests,
            String bedType,
            int sizeSqm,
            List<String> amenities) {}

    public static RoomProfile profileFor(RoomType type) {
        return switch (type) {
            case STANDARD -> new RoomProfile(
                    "Comfortable city-view room with essential amenities for business or leisure stays.",
                    2,
                    "Queen bed",
                    24,
                    List.of(
                            "Free high-speed Wi‑Fi",
                            "Smart TV with streaming",
                            "Air conditioning",
                            "Private bathroom with shower",
                            "Daily housekeeping",
                            "In-room safe",
                            "Desk & chair",
                            "Complimentary bottled water",
                            "Tea & coffee station"));
            case DELUXE -> new RoomProfile(
                    "Spacious deluxe room with premium bedding, lounge area, and Kigali skyline views.",
                    2,
                    "King bed + sofa",
                    32,
                    List.of(
                            "Free high-speed Wi‑Fi",
                            "55\" Smart TV",
                            "Air conditioning & climate control",
                            "Marble bathroom with bathtub",
                            "Mini bar",
                            "Nespresso machine",
                            "Work desk",
                            "Balcony or large windows",
                            "Bathrobes & slippers",
                            "Evening turndown service",
                            "Room service until 23:00"));
            case SUITE -> new RoomProfile(
                    "Luxury suite with separate living area, ideal for families or extended executive stays.",
                    2,
                    "King bed + living room",
                    52,
                    List.of(
                            "Free high-speed Wi‑Fi",
                            "Separate living & sleeping areas",
                            "Two Smart TVs",
                            "Air conditioning throughout",
                            "Walk-in shower & soaking tub",
                            "Full mini bar",
                            "Dining table for 4",
                            "Panoramic city or garden view",
                            "Premium toiletries",
                            "24/7 room service",
                            "Complimentary breakfast for 2",
                            "Late checkout on request",
                            "Airport pickup available"));
        };
    }

    public static String floorLabel(String roomNumber) {
        if (roomNumber == null || roomNumber.length() < 1) return "—";
        char first = roomNumber.charAt(0);
        return switch (first) {
            case '1' -> "Floor 1 — Standard wing";
            case '2' -> "Floor 2 — Deluxe wing";
            case '3' -> "Floor 3 — Suite wing";
            default -> "Net Luna Villa";
        };
    }
}
