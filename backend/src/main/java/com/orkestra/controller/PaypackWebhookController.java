package com.orkestra.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orkestra.service.BookingPaymentService;
import com.orkestra.service.PaypackService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/paypack")
public class PaypackWebhookController {

    private static final Logger log = LoggerFactory.getLogger(PaypackWebhookController.class);

    private final PaypackService paypackService;
    private final BookingPaymentService bookingPaymentService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PaypackWebhookController(PaypackService paypackService, BookingPaymentService bookingPaymentService) {
        this.paypackService = paypackService;
        this.bookingPaymentService = bookingPaymentService;
    }

    @RequestMapping(value = "/webhook", method = {RequestMethod.POST, RequestMethod.HEAD})
    public ResponseEntity<Void> webhook(
            @RequestBody(required = false) String rawBody,
            @RequestHeader(value = "X-Paypack-Signature", required = false) String signature) {
        if (rawBody == null || rawBody.isBlank()) {
            return ResponseEntity.ok().build();
        }
        if (!paypackService.verifyWebhookSignature(rawBody, signature)) {
            log.warn("Rejected Paypack webhook — invalid signature");
            return ResponseEntity.status(401).build();
        }
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            if (!"transaction:processed".equals(root.path("kind").asText())) {
                return ResponseEntity.ok().build();
            }
            JsonNode data = root.path("data");
            String ref = data.path("ref").asText();
            String status = data.path("status").asText();
            long amount = data.path("amount").asLong();
            bookingPaymentService.completePaypackPayment(ref, amount, status);
            log.info("Paypack webhook processed ref={} status={}", ref, status);
        } catch (Exception e) {
            log.error("Paypack webhook processing failed", e);
            return ResponseEntity.internalServerError().build();
        }
        return ResponseEntity.ok().build();
    }
}
