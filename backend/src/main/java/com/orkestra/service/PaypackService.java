package com.orkestra.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class PaypackService {

    private static final Logger log = LoggerFactory.getLogger(PaypackService.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${paypack.base-url:https://payments.paypack.rw/api}")
    private String baseUrl;

    @Value("${paypack.client-id:}")
    private String clientId;

    @Value("${paypack.client-secret:}")
    private String clientSecret;

    @Value("${paypack.webhook-mode:production}")
    private String webhookMode;

    @Value("${paypack.webhook-secret:}")
    private String webhookSecret;

    @Value("${paypack.simulate-when-unconfigured:false}")
    private boolean simulateWhenUnconfigured;

    @Value("${paypack.test-amount-rwf:5}")
    private long testAmountRwf;

    @Value("${paypack.use-test-amount:false}")
    private boolean useTestAmount;

    @Value("${paypack.merchant-phones:0789738349,0789403583}")
    private String merchantPhonesRaw;

    private List<String> merchantPhones;

    private volatile String accessToken;
    private volatile String refreshToken;
    private volatile Instant tokenExpiresAt = Instant.EPOCH;

    public record CashinResult(String ref, String status, long amount, boolean simulated) {}

    @PostConstruct
    void initMerchantPhones() {
        merchantPhones = Arrays.stream(merchantPhonesRaw.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(PaypackService::normalizePhone)
                .distinct()
                .collect(Collectors.toList());
        if (merchantPhones.isEmpty()) {
            merchantPhones = List.of("0789738349", "0789403583");
        }
    }

    public boolean isConfigured() {
        return StringUtils.hasText(clientId) && StringUtils.hasText(clientSecret);
    }

    public long resolveChargeAmount(long bookingAmountRwf) {
        if (useTestAmount) {
            return testAmountRwf;
        }
        return bookingAmountRwf;
    }

    public String paypackReference(String ref) {
        return "PAYPACK-" + ref;
    }

    public CashinResult cashin(long amountRwf, String customerPhone) {
        String phone = normalizePhone(customerPhone);
        validateMtnRwanda(phone);
        if (!isConfigured()) {
            if (simulateWhenUnconfigured) {
                String ref = UUID.randomUUID().toString();
                log.warn("Paypack not configured — simulated cashin RWF {} from {}", amountRwf, phone);
                return new CashinResult(ref, "pending", amountRwf, true);
            }
            throw new IllegalStateException(
                    "Paypack is not configured. Set PAYPACK_CLIENT_ID and PAYPACK_CLIENT_SECRET in backend/.env");
        }

        HttpHeaders headers = authHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Webhook-Mode", webhookMode);
        headers.set("Idempotency-Key", UUID.randomUUID().toString().replace("-", "").substring(0, 32));

        Map<String, Object> body = Map.of("amount", amountRwf, "number", phone);
        try {
            ResponseEntity<String> res = restTemplate.exchange(
                    baseUrl + "/transactions/cashin",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class);
            JsonNode json = objectMapper.readTree(res.getBody());
            String ref = json.path("ref").asText();
            String status = json.path("status").asText("pending");
            long amount = json.path("amount").asLong(amountRwf);
            log.info("Paypack cashin initiated ref={} amount={} phone={}", ref, amount, phone);
            return new CashinResult(ref, status, amount, false);
        } catch (RestClientException | java.io.IOException e) {
            log.error("Paypack cashin failed for {}", phone, e);
            throw new IllegalStateException("Could not start mobile money payment: " + e.getMessage());
        }
    }

    public String findTransactionStatus(String paypackRef) {
        return resolveTransactionStatus(paypackRef);
    }

    /**
     * Resolves Paypack status via find API, then events API (needed while status is still pending).
     */
    public String resolveTransactionStatus(String paypackRef) {
        if (!isConfigured()) {
            return simulateWhenUnconfigured ? "successful" : "unknown";
        }
        String fromFind = fetchStatusFromFind(paypackRef);
        if (isTerminalStatus(fromFind)) {
            return fromFind;
        }
        String fromEvents = fetchStatusFromEvents(paypackRef);
        if (isTerminalStatus(fromEvents)) {
            return fromEvents;
        }
        return fromFind != null && !fromFind.isBlank() ? fromFind : fromEvents;
    }

    public boolean isSuccessfulStatus(String status) {
        if (status == null) {
            return false;
        }
        String s = status.trim().toLowerCase();
        return s.equals("successful")
                || s.equals("success")
                || s.equals("completed")
                || s.equals("paid");
    }

    public boolean isFailedStatus(String status) {
        if (status == null) {
            return false;
        }
        String s = status.trim().toLowerCase();
        return s.equals("failed")
                || s.equals("failure")
                || s.equals("cancelled")
                || s.equals("canceled")
                || s.equals("rejected");
    }

    private boolean isTerminalStatus(String status) {
        return isSuccessfulStatus(status) || isFailedStatus(status);
    }

    private String fetchStatusFromFind(String paypackRef) {
        try {
            HttpHeaders headers = authHeaders();
            ResponseEntity<String> res = restTemplate.exchange(
                    baseUrl + "/transactions/find/" + paypackRef,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class);
            JsonNode json = objectMapper.readTree(res.getBody());
            String status = json.path("status").asText("pending");
            log.debug("Paypack find ref={} status={}", paypackRef, status);
            return status;
        } catch (Exception e) {
            log.warn("Paypack find failed for {}: {}", paypackRef, e.getMessage());
            return "pending";
        }
    }

    private String fetchStatusFromEvents(String paypackRef) {
        try {
            HttpHeaders headers = authHeaders();
            String url = baseUrl + "/events/transactions?ref=" + paypackRef + "&kind=CASHIN&limit=20";
            ResponseEntity<String> res = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
            JsonNode json = objectMapper.readTree(res.getBody());
            JsonNode events = json.path("transactions");
            if (events.isArray()) {
                String latest = "pending";
                for (JsonNode event : events) {
                    String eventKind = event.path("event_kind").asText(event.path("event-kind").asText(""));
                    if (!eventKind.toLowerCase().contains("processed")) {
                        continue;
                    }
                    JsonNode data = event.has("data") ? event.path("data") : event;
                    String st = data.path("status").asText("");
                    if (isTerminalStatus(st)) {
                        log.info("Paypack events ref={} processed status={}", paypackRef, st);
                        return st;
                    }
                    if (!st.isBlank()) {
                        latest = st;
                    }
                }
                return latest;
            }
            String rootStatus = json.path("status").asText("pending");
            log.debug("Paypack events ref={} rootStatus={}", paypackRef, rootStatus);
            return rootStatus;
        } catch (Exception e) {
            log.warn("Paypack events lookup failed for {}: {}", paypackRef, e.getMessage());
            return "pending";
        }
    }

    public boolean verifyWebhookSignature(String rawBody, String signatureHeader) {
        if (!StringUtils.hasText(webhookSecret) || !StringUtils.hasText(signatureHeader)) {
            return !StringUtils.hasText(webhookSecret);
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String computed = java.util.Base64.getEncoder().encodeToString(hash);
            return computed.equals(signatureHeader);
        } catch (Exception e) {
            log.warn("Webhook signature verification failed", e);
            return false;
        }
    }

    public String merchantPhone() {
        return merchantPhones.get(0);
    }

    public List<String> merchantPhones() {
        return List.copyOf(merchantPhones);
    }

    public String merchantPhonesDisplay() {
        if (merchantPhones.size() <= 1) {
            return merchantPhone();
        }
        if (merchantPhones.size() == 2) {
            return merchantPhones.get(0) + " or " + merchantPhones.get(1);
        }
        String allButLast = String.join(", ", merchantPhones.subList(0, merchantPhones.size() - 1));
        return allButLast + ", or " + merchantPhones.get(merchantPhones.size() - 1);
    }

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        headers.setBearerAuth(getAccessToken());
        return headers;
    }

    private synchronized String getAccessToken() {
        if (accessToken != null && Instant.now().isBefore(tokenExpiresAt.minusSeconds(60))) {
            return accessToken;
        }
        if (accessToken != null && StringUtils.hasText(refreshToken)) {
            try {
                refreshAccessToken();
                return accessToken;
            } catch (Exception e) {
                log.warn("Paypack token refresh failed, re-authorizing", e);
            }
        }
        authorize();
        return accessToken;
    }

    private void authorize() {
        Map<String, String> body = Map.of("client_id", clientId, "client_secret", clientSecret);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        ResponseEntity<String> res = restTemplate.exchange(
                baseUrl + "/auth/agents/authorize",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                String.class);
        parseTokenResponse(res.getBody());
    }

    private void refreshAccessToken() throws java.io.IOException {
        ResponseEntity<String> res = restTemplate.exchange(
                baseUrl + "/auth/agents/refresh/" + refreshToken,
                HttpMethod.GET,
                new HttpEntity<>(new HttpHeaders()),
                String.class);
        parseTokenResponse(res.getBody());
    }

    private void parseTokenResponse(String body) throws RestClientException {
        try {
            JsonNode json = objectMapper.readTree(body);
            this.accessToken = json.path("access").asText(null);
            this.refreshToken = json.path("refresh").asText(this.refreshToken);
            this.tokenExpiresAt = Instant.now().plusSeconds(14 * 60);
            if (!StringUtils.hasText(accessToken)) {
                throw new IllegalStateException("Paypack auth failed: no access token");
            }
        } catch (java.io.IOException e) {
            throw new IllegalStateException("Paypack auth response invalid", e);
        }
    }

    static String normalizePhone(String phone) {
        if (phone == null) {
            throw new IllegalArgumentException("Phone number is required");
        }
        String digits = phone.replaceAll("\\D", "");
        if (digits.startsWith("250") && digits.length() >= 12) {
            return "0" + digits.substring(3);
        }
        if (digits.length() == 9) {
            return "0" + digits;
        }
        if (digits.length() == 10 && digits.startsWith("7")) {
            return "0" + digits;
        }
        if (digits.length() == 10 && digits.startsWith("0")) {
            return digits;
        }
        throw new IllegalArgumentException("Enter a valid Rwanda mobile number (e.g. 0789738349)");
    }

    static void validateMtnRwanda(String normalizedPhone) {
        if (normalizedPhone == null || !normalizedPhone.matches("07(8|9)\\d{7}")) {
            throw new IllegalArgumentException(
                    "Enter a valid MTN Rwanda MoMo number (078… or 079…)");
        }
    }
}
