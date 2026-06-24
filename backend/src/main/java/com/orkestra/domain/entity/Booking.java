package com.orkestra.domain.entity;

import com.orkestra.domain.enums.BookingStatus;
import com.orkestra.domain.enums.RoomType;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String bookingCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_user_id")
    private UserAccount guestUser;

    @Column(nullable = false)
    private String guestName;

    private String guestEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    private String roomLabel;

    @Enumerated(EnumType.STRING)
    private RoomType roomType;

    private int guestCount = 1;

    @Column(nullable = false)
    private LocalDate checkIn;

    @Column(nullable = false)
    private LocalDate checkOut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    private long amountRwf;

    private long grossAmountRwf;

    private long discountRwf;

    private boolean earlyBookingDiscount;

    private boolean repeatGuestDiscount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    private Instant createdAt = Instant.now();

    private boolean checkoutRequested = false;

    private boolean chargesVerified = false;

    private Instant invoiceIssuedAt;

    private boolean guestArrived = false;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getBookingCode() { return bookingCode; }
    public void setBookingCode(String bookingCode) { this.bookingCode = bookingCode; }
    public UserAccount getGuestUser() { return guestUser; }
    public void setGuestUser(UserAccount guestUser) { this.guestUser = guestUser; }
    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }
    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }
    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }
    public String getRoomLabel() { return roomLabel; }
    public void setRoomLabel(String roomLabel) { this.roomLabel = roomLabel; }
    public RoomType getRoomType() { return roomType; }
    public void setRoomType(RoomType roomType) { this.roomType = roomType; }
    public int getGuestCount() { return guestCount; }
    public void setGuestCount(int guestCount) { this.guestCount = guestCount; }
    public LocalDate getCheckIn() { return checkIn; }
    public void setCheckIn(LocalDate checkIn) { this.checkIn = checkIn; }
    public LocalDate getCheckOut() { return checkOut; }
    public void setCheckOut(LocalDate checkOut) { this.checkOut = checkOut; }
    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }
    public long getAmountRwf() { return amountRwf; }
    public void setAmountRwf(long amountRwf) { this.amountRwf = amountRwf; }
    public long getGrossAmountRwf() { return grossAmountRwf; }
    public void setGrossAmountRwf(long grossAmountRwf) { this.grossAmountRwf = grossAmountRwf; }
    public long getDiscountRwf() { return discountRwf; }
    public void setDiscountRwf(long discountRwf) { this.discountRwf = discountRwf; }
    public boolean isEarlyBookingDiscount() { return earlyBookingDiscount; }
    public void setEarlyBookingDiscount(boolean earlyBookingDiscount) { this.earlyBookingDiscount = earlyBookingDiscount; }
    public boolean isRepeatGuestDiscount() { return repeatGuestDiscount; }
    public void setRepeatGuestDiscount(boolean repeatGuestDiscount) { this.repeatGuestDiscount = repeatGuestDiscount; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public Instant getCreatedAt() { return createdAt; }
    public boolean isCheckoutRequested() { return checkoutRequested; }
    public void setCheckoutRequested(boolean checkoutRequested) { this.checkoutRequested = checkoutRequested; }
    public boolean isChargesVerified() { return chargesVerified; }
    public void setChargesVerified(boolean chargesVerified) { this.chargesVerified = chargesVerified; }
    public Instant getInvoiceIssuedAt() { return invoiceIssuedAt; }
    public void setInvoiceIssuedAt(Instant invoiceIssuedAt) { this.invoiceIssuedAt = invoiceIssuedAt; }
    public boolean isGuestArrived() { return guestArrived; }
    public void setGuestArrived(boolean guestArrived) { this.guestArrived = guestArrived; }
}
