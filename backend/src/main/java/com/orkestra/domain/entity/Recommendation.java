package com.orkestra.domain.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "recommendations")
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_user_id", nullable = false)
    private UserAccount guestUser;

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String description;

    private int confidence;

    private boolean applied;

    private boolean saved;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UserAccount getGuestUser() { return guestUser; }
    public void setGuestUser(UserAccount guestUser) { this.guestUser = guestUser; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getConfidence() { return confidence; }
    public void setConfidence(int confidence) { this.confidence = confidence; }
    public boolean isApplied() { return applied; }
    public void setApplied(boolean applied) { this.applied = applied; }
    public boolean isSaved() { return saved; }
    public void setSaved(boolean saved) { this.saved = saved; }
}
