package com.orkestra.domain.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps legacy DB values (MTN_MOMO, CARD, etc.) to Paypack after payment provider consolidation. */
@Converter(autoApply = false)
public class PaymentMethodConverter implements AttributeConverter<PaymentMethod, String> {

    @Override
    public String convertToDatabaseColumn(PaymentMethod attribute) {
        return attribute == null ? PaymentMethod.PAYPACK.name() : attribute.name();
    }

    @Override
    public PaymentMethod convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return PaymentMethod.PAYPACK;
        }
        try {
            return PaymentMethod.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return PaymentMethod.PAYPACK;
        }
    }
}
