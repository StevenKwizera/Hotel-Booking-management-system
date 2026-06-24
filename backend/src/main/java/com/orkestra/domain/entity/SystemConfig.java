package com.orkestra.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "system_config")
public class SystemConfig {

    @Id
    private Long id = 1L;

    @Column(nullable = false)
    private String hotelName = "Net Luna Villa";

    @Column(nullable = false)
    private String branchDisplayName = "Kigali";

    @Column(nullable = false)
    private boolean otpAdmin = true;

    @Column(nullable = false)
    private boolean otpManagement = true;

    @Column(nullable = false)
    private boolean otpFinance = true;

    @Column(nullable = false)
    private int sessionTimeoutMinutes = 30;

    @Column(nullable = false)
    private boolean auditLoggingEnabled = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getHotelName() { return hotelName; }
    public void setHotelName(String hotelName) { this.hotelName = hotelName; }
    public String getBranchDisplayName() { return branchDisplayName; }
    public void setBranchDisplayName(String branchDisplayName) { this.branchDisplayName = branchDisplayName; }
    public boolean isOtpAdmin() { return otpAdmin; }
    public void setOtpAdmin(boolean otpAdmin) { this.otpAdmin = otpAdmin; }
    public boolean isOtpManagement() { return otpManagement; }
    public void setOtpManagement(boolean otpManagement) { this.otpManagement = otpManagement; }
    public boolean isOtpFinance() { return otpFinance; }
    public void setOtpFinance(boolean otpFinance) { this.otpFinance = otpFinance; }
    public int getSessionTimeoutMinutes() { return sessionTimeoutMinutes; }
    public void setSessionTimeoutMinutes(int sessionTimeoutMinutes) { this.sessionTimeoutMinutes = sessionTimeoutMinutes; }
    public boolean isAuditLoggingEnabled() { return auditLoggingEnabled; }
    public void setAuditLoggingEnabled(boolean auditLoggingEnabled) { this.auditLoggingEnabled = auditLoggingEnabled; }
}
