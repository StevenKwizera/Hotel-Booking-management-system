package com.orkestra.domain.entity;

import com.orkestra.domain.enums.FeedbackCategory;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "guest_feedback")
public class GuestFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String feedbackCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_user_id")
    private UserAccount guestUser;

    @Column(nullable = false)
    private String guestName;

    private String guestEmail;

    private String room;

    @Column(nullable = false)
    private int rating;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FeedbackCategory category = FeedbackCategory.STAY;

    private String subject;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(length = 2000)
    private String staffReply;

    private String repliedByName;

    private Instant repliedAt;

    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getFeedbackCode() { return feedbackCode; }
    public void setFeedbackCode(String feedbackCode) { this.feedbackCode = feedbackCode; }
    public UserAccount getGuestUser() { return guestUser; }
    public void setGuestUser(UserAccount guestUser) { this.guestUser = guestUser; }
    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }
    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }
    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public FeedbackCategory getCategory() { return category; }
    public void setCategory(FeedbackCategory category) { this.category = category; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getStaffReply() { return staffReply; }
    public void setStaffReply(String staffReply) { this.staffReply = staffReply; }
    public String getRepliedByName() { return repliedByName; }
    public void setRepliedByName(String repliedByName) { this.repliedByName = repliedByName; }
    public Instant getRepliedAt() { return repliedAt; }
    public void setRepliedAt(Instant repliedAt) { this.repliedAt = repliedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
