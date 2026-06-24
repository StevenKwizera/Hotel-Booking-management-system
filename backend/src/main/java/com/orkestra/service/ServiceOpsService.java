package com.orkestra.service;

import com.orkestra.domain.entity.*;
import com.orkestra.domain.enums.NotificationCategory;
import com.orkestra.domain.enums.ServiceStatus;
import com.orkestra.domain.enums.UserRole;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.BranchRepository;
import com.orkestra.repository.NotificationRepository;
import com.orkestra.repository.ServiceRequestRepository;
import com.orkestra.repository.UserAccountRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceOpsService {

    private final ServiceRequestRepository serviceRepository;
    private final BranchRepository branchRepository;
    private final NotificationRepository notificationRepository;
    private final UserAccountRepository userAccountRepository;
    private final CurrentUserService currentUser;
    private final AuditService auditService;

    public ServiceOpsService(
            ServiceRequestRepository serviceRepository,
            BranchRepository branchRepository,
            NotificationRepository notificationRepository,
            UserAccountRepository userAccountRepository,
            CurrentUserService currentUser,
            AuditService auditService) {
        this.serviceRepository = serviceRepository;
        this.branchRepository = branchRepository;
        this.notificationRepository = notificationRepository;
        this.userAccountRepository = userAccountRepository;
        this.currentUser = currentUser;
        this.auditService = auditService;
    }

    public List<ApiDtos.ServiceRequestDto> list() {
        UserAccount user = currentUser.requireUser();
        List<ServiceRequest> list = user.getRole() == UserRole.GUEST
                ? serviceRepository.findByGuestUserIdOrderByCreatedAtDesc(user.getId())
                : serviceRepository.findAllByOrderByCreatedAtDesc();
        return list.stream().map(DtoMapper::toService).toList();
    }

    @Transactional
    public ApiDtos.ServiceRequestDto create(ApiDtos.CreateServiceRequest req) {
        UserAccount user = currentUser.requireUser();
        Branch branch = branchRepository.findByCode("KIGALI").orElse(null);

        ServiceRequest sr = new ServiceRequest();
        sr.setRequestCode("SR-" + System.currentTimeMillis() % 100000);
        sr.setType(DtoMapper.parseServiceType(req.type()));
        sr.setRoom(req.room());
        sr.setDescription(req.description());
        sr.setPriority(DtoMapper.parsePriority(req.priority()));
        sr.setStatus(ServiceStatus.OPEN);
        sr.setGuestUser(user.getRole() == UserRole.GUEST ? user : null);
        sr.setGuestEmail(user.getEmail());
        sr.setBranch(branch);
        sr = serviceRepository.save(sr);

        if (user.getRole() == UserRole.GUEST) {
            notifyUser(user, "Service request submitted", sr.getRequestCode() + " — " + sr.getType().name(),
                    NotificationCategory.SERVICE);
        }

        notifyStaffNewTask(sr);
        auditService.log(user.getEmail(),
                "Service request created: " + sr.getRequestCode() + " — " + sr.getType().name()
                        + " Room " + sr.getRoom());

        return DtoMapper.toService(sr);
    }

    @Transactional
    public ApiDtos.ServiceRequestDto updateStatus(String code, String status) {
        UserAccount actor = currentUser.requireUser();
        ServiceRequest sr = findRequest(code);

        ServiceStatus newStatus = ServiceStatus.valueOf(status.toUpperCase().replace("-", "_"));
        sr.setStatus(newStatus);
        sr = serviceRepository.save(sr);

        if (sr.getGuestUser() != null) {
            notifyUser(sr.getGuestUser(), "Service update",
                    sr.getRequestCode() + " is now " + status, NotificationCategory.SERVICE);
        }

        String action = newStatus == ServiceStatus.COMPLETED
                ? "Service completed: " + code + " — " + sr.getType().name() + " Room " + sr.getRoom()
                : "Service status updated: " + code + " → " + status;
        auditService.log(actor.getEmail(), action);

        return DtoMapper.toService(sr);
    }

    @Transactional
    public ApiDtos.ServiceRequestDto assignStaff(String code, String staffName) {
        UserAccount actor = currentUser.requireUser();
        if (actor.getRole() == UserRole.GUEST) {
            throw new IllegalArgumentException("Guests cannot assign staff");
        }
        ServiceRequest sr = findRequest(code);
        String assignee = staffName != null && !staffName.isBlank() ? staffName.trim() : actor.getName();
        sr.setAssignedStaffName(assignee);
        if (sr.getStatus() == ServiceStatus.OPEN) {
            sr.setStatus(ServiceStatus.IN_PROGRESS);
        }
        ServiceRequest saved = serviceRepository.save(sr);

        if (saved.getGuestUser() != null) {
            notifyUser(saved.getGuestUser(), "Staff assigned",
                    saved.getRequestCode() + " — " + assignee + " is handling your request",
                    NotificationCategory.SERVICE);
        }

        userAccountRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.STAFF)
                .filter(u -> assignee.equalsIgnoreCase(u.getName()))
                .findFirst()
                .ifPresent(staff -> notifyUser(staff, "Task assigned to you",
                        saved.getRequestCode() + " — " + saved.getType().name() + " Room " + saved.getRoom(),
                        NotificationCategory.SERVICE));

        auditService.log(actor.getEmail(),
                "Service assigned: " + code + " → " + assignee + " (" + saved.getType().name() + " Room "
                        + saved.getRoom() + ")");

        return DtoMapper.toService(saved);
    }

    private ServiceRequest findRequest(String code) {
        return serviceRepository.findAll().stream()
                .filter(s -> s.getRequestCode().equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
    }

    private void notifyStaffNewTask(ServiceRequest sr) {
        String body = sr.getRequestCode() + " — " + sr.getType().name() + " Room " + sr.getRoom()
                + " (" + sr.getPriority().name().toLowerCase() + " priority)";
        for (UserAccount staff : userAccountRepository.findByRole(UserRole.STAFF)) {
            notifyUser(staff, "New service task", body, NotificationCategory.SERVICE);
        }
    }

    private void notifyUser(UserAccount user, String title, String body, NotificationCategory category) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setBody(body);
        n.setCategory(category);
        n.setRead(false);
        notificationRepository.save(n);
    }
}
