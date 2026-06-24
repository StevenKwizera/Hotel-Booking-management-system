package com.orkestra.domain.entity;

import com.orkestra.domain.enums.Priority;
import com.orkestra.domain.enums.ServiceStatus;
import com.orkestra.domain.enums.ServiceType;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "service_requests")
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String requestCode;

    @Enumerated(EnumType.STRING)
    private ServiceType type;

    private String room;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    private ServiceStatus status = ServiceStatus.OPEN;

    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.MEDIUM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_user_id")
    private UserAccount guestUser;

    private String guestEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    private Instant createdAt = Instant.now();

    private String assignedStaffName;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getRequestCode() { return requestCode; }
    public void setRequestCode(String requestCode) { this.requestCode = requestCode; }
    public ServiceType getType() { return type; }
    public void setType(ServiceType type) { this.type = type; }
    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public ServiceStatus getStatus() { return status; }
    public void setStatus(ServiceStatus status) { this.status = status; }
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public UserAccount getGuestUser() { return guestUser; }
    public void setGuestUser(UserAccount guestUser) { this.guestUser = guestUser; }
    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public Instant getCreatedAt() { return createdAt; }
    public String getAssignedStaffName() { return assignedStaffName; }
    public void setAssignedStaffName(String assignedStaffName) { this.assignedStaffName = assignedStaffName; }
}
