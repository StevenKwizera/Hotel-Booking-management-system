package com.orkestra.domain.entity;

import com.orkestra.domain.enums.GuestTier;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "guest_profiles")
public class GuestProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserAccount user;

    private String phone;

    @Enumerated(EnumType.STRING)
    private GuestTier tier = GuestTier.STANDARD;

    private int visitCount = 0;

    private long balanceRwf = 0;

    @ElementCollection
    @CollectionTable(name = "guest_preferences", joinColumns = @JoinColumn(name = "guest_id"))
    @Column(name = "preference")
    private List<String> preferences = new ArrayList<>();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UserAccount getUser() { return user; }
    public void setUser(UserAccount user) { this.user = user; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public GuestTier getTier() { return tier; }
    public void setTier(GuestTier tier) { this.tier = tier; }
    public int getVisitCount() { return visitCount; }
    public void setVisitCount(int visitCount) { this.visitCount = visitCount; }
    public long getBalanceRwf() { return balanceRwf; }
    public void setBalanceRwf(long balanceRwf) { this.balanceRwf = balanceRwf; }
    public List<String> getPreferences() { return preferences; }
    public void setPreferences(List<String> preferences) { this.preferences = preferences; }
}
