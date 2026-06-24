package com.orkestra.service;

import com.orkestra.domain.enums.RoomType;

/** Nightly room rates (RWF) — Standard 100, Deluxe 170, Suite 200. */
public final class RoomRates {

    public static final int STANDARD = 100;
    public static final int DELUXE = 170;
    public static final int SUITE = 200;

    private RoomRates() {}

    public static int rateFor(RoomType type) {
        if (type == null) {
            return STANDARD;
        }
        return switch (type) {
            case STANDARD -> STANDARD;
            case DELUXE -> DELUXE;
            case SUITE -> SUITE;
        };
    }
}
