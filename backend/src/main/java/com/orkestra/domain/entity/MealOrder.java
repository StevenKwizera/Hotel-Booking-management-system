package com.orkestra.domain.entity;

import com.orkestra.domain.enums.MealCategory;
import com.orkestra.domain.enums.MealOrderStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "meal_orders")
public class MealOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_user_id")
    private UserAccount guestUser;

    @Column(nullable = false)
    private String guestName;

    private String guestEmail;

    @Column(nullable = false)
    private String room;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MealCategory mealCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MealOrderStatus status = MealOrderStatus.PENDING;

    private long totalRwf;

    @Column(length = 1000)
    private String guestNotes;

    @Column(length = 1000)
    private String rejectionReason;

    private String serverName;

    private String paymentCode;

    @OneToMany(mappedBy = "mealOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MealOrderLine> lines = new ArrayList<>();

    private Instant createdAt = Instant.now();

    private Instant updatedAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }
    public UserAccount getGuestUser() { return guestUser; }
    public void setGuestUser(UserAccount guestUser) { this.guestUser = guestUser; }
    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }
    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }
    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }
    public MealCategory getMealCategory() { return mealCategory; }
    public void setMealCategory(MealCategory mealCategory) { this.mealCategory = mealCategory; }
    public MealOrderStatus getStatus() { return status; }
    public void setStatus(MealOrderStatus status) { this.status = status; }
    public long getTotalRwf() { return totalRwf; }
    public void setTotalRwf(long totalRwf) { this.totalRwf = totalRwf; }
    public String getGuestNotes() { return guestNotes; }
    public void setGuestNotes(String guestNotes) { this.guestNotes = guestNotes; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public String getServerName() { return serverName; }
    public void setServerName(String serverName) { this.serverName = serverName; }
    public String getPaymentCode() { return paymentCode; }
    public void setPaymentCode(String paymentCode) { this.paymentCode = paymentCode; }
    public List<MealOrderLine> getLines() { return lines; }
    public void setLines(List<MealOrderLine> lines) { this.lines = lines; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public void addLine(MealOrderLine line) {
        lines.add(line);
        line.setMealOrder(this);
    }
}
