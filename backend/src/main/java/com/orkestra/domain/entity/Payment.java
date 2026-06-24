package com.orkestra.domain.entity;

import com.orkestra.domain.enums.PaymentMethod;
import com.orkestra.domain.enums.PaymentMethodConverter;
import com.orkestra.domain.enums.PaymentStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String paymentCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_user_id")
    private UserAccount guestUser;

    private String guestName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_order_id")
    private MealOrder mealOrder;

    private long amountRwf;

    @Convert(converter = PaymentMethodConverter.class)
    @Column(length = 32)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status = PaymentStatus.PENDING;

    private String iremboReference;

    /** Email address chosen by guest at payment — used for confirmation receipt (not login email). */
    @Column(name = "confirmation_email")
    private String confirmationEmail;

    @Column(nullable = false)
    private boolean financeVerified = false;

    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getPaymentCode() { return paymentCode; }
    public void setPaymentCode(String paymentCode) { this.paymentCode = paymentCode; }
    public UserAccount getGuestUser() { return guestUser; }
    public void setGuestUser(UserAccount guestUser) { this.guestUser = guestUser; }
    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }
    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }
    public MealOrder getMealOrder() { return mealOrder; }
    public void setMealOrder(MealOrder mealOrder) { this.mealOrder = mealOrder; }
    public long getAmountRwf() { return amountRwf; }
    public void setAmountRwf(long amountRwf) { this.amountRwf = amountRwf; }
    public PaymentMethod getMethod() { return method; }
    public void setMethod(PaymentMethod method) { this.method = method; }
    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }
    public String getIremboReference() { return iremboReference; }
    public void setIremboReference(String iremboReference) { this.iremboReference = iremboReference; }
    public String getConfirmationEmail() { return confirmationEmail; }
    public void setConfirmationEmail(String confirmationEmail) { this.confirmationEmail = confirmationEmail; }
    public boolean isFinanceVerified() { return financeVerified; }
    public void setFinanceVerified(boolean financeVerified) { this.financeVerified = financeVerified; }
    public Instant getCreatedAt() { return createdAt; }
}
