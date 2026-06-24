package com.orkestra.service;

import com.orkestra.domain.entity.MealOrder;
import com.orkestra.domain.entity.MealOrderLine;
import com.orkestra.domain.entity.Notification;
import com.orkestra.domain.entity.Payment;
import com.orkestra.domain.entity.UserAccount;
import com.orkestra.domain.enums.MealOrderStatus;
import com.orkestra.domain.enums.NotificationCategory;
import com.orkestra.domain.enums.PaymentMethod;
import com.orkestra.domain.enums.PaymentStatus;
import com.orkestra.domain.enums.UserRole;
import com.orkestra.dto.ApiDtos;
import com.orkestra.repository.MealOrderRepository;
import com.orkestra.repository.NotificationRepository;
import com.orkestra.repository.PaymentRepository;
import com.orkestra.repository.UserAccountRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class MealOrderService {

    private final MealOrderRepository mealOrderRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationRepository notificationRepository;
    private final UserAccountRepository userAccountRepository;
    private final CurrentUserService currentUser;
    private final AuditService auditService;
    private final PaypackService paypackService;
    private final BookingPaymentService bookingPaymentService;

    public MealOrderService(
            MealOrderRepository mealOrderRepository,
            PaymentRepository paymentRepository,
            NotificationRepository notificationRepository,
            UserAccountRepository userAccountRepository,
            CurrentUserService currentUser,
            AuditService auditService,
            PaypackService paypackService,
            BookingPaymentService bookingPaymentService) {
        this.mealOrderRepository = mealOrderRepository;
        this.paymentRepository = paymentRepository;
        this.notificationRepository = notificationRepository;
        this.userAccountRepository = userAccountRepository;
        this.currentUser = currentUser;
        this.auditService = auditService;
        this.paypackService = paypackService;
        this.bookingPaymentService = bookingPaymentService;
    }

    public List<ApiDtos.MenuItemDto> menu(String category) {
        if (category != null && !category.isBlank()) {
            return MenuCatalog.byCategory(DtoMapper.parseMealCategory(category));
        }
        return MenuCatalog.all();
    }

    public List<ApiDtos.MealOrderDto> list() {
        UserAccount user = currentUser.requireUser();
        List<MealOrder> orders = user.getRole() == UserRole.GUEST
                ? mealOrderRepository.findByGuestUserIdOrderByCreatedAtDesc(user.getId())
                : mealOrderRepository.findAllByOrderByCreatedAtDesc();
        return orders.stream().map(DtoMapper::toMealOrder).toList();
    }

    @Transactional
    public ApiDtos.MealOrderDto create(ApiDtos.CreateMealOrderRequest req) {
        UserAccount guest = currentUser.requireUser();
        if (guest.getRole() != UserRole.GUEST) {
            throw new IllegalArgumentException("Only guests can place meal orders");
        }
        if (req.items() == null || req.items().isEmpty()) {
            throw new IllegalArgumentException("Add at least one menu item");
        }
        if (!StringUtils.hasText(req.room())) {
            throw new IllegalArgumentException("Room number is required");
        }

        MealOrder order = new MealOrder();
        order.setOrderCode("MO-" + System.currentTimeMillis() % 100000);
        order.setGuestUser(guest);
        order.setGuestName(guest.getName());
        order.setGuestEmail(guest.getEmail());
        order.setRoom(req.room().trim());
        order.setMealCategory(DtoMapper.parseMealCategory(req.mealCategory()));
        order.setGuestNotes(StringUtils.hasText(req.guestNotes()) ? req.guestNotes().trim() : null);
        order.setStatus(MealOrderStatus.PENDING);

        long total = 0;
        for (ApiDtos.MealOrderLineRequest lineReq : req.items()) {
            if (lineReq.quantity() < 1) {
                throw new IllegalArgumentException("Quantity must be at least 1");
            }
            var menuItem = MenuCatalog.find(lineReq.menuItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Unknown menu item: " + lineReq.menuItemId()));
            if (!menuItem.category().equals(order.getMealCategory().name().toLowerCase())) {
                throw new IllegalArgumentException(menuItem.name() + " is not on the "
                        + order.getMealCategory().name().toLowerCase() + " menu");
            }
            long lineTotal = menuItem.priceRwf() * lineReq.quantity();
            MealOrderLine line = new MealOrderLine();
            line.setMenuItemId(menuItem.id());
            line.setItemName(menuItem.name());
            line.setUnitPriceRwf(menuItem.priceRwf());
            line.setQuantity(lineReq.quantity());
            line.setLineTotalRwf(lineTotal);
            order.addLine(line);
            total += lineTotal;
        }
        order.setTotalRwf(total);
        order = mealOrderRepository.save(order);

        notify(guest, "Meal order submitted — " + order.getOrderCode(),
                capitalize(order.getMealCategory().name()) + " for room " + order.getRoom()
                        + " — RWF " + total + ". Awaiting reception approval.",
                NotificationCategory.SERVICE);
        notifyRoles(List.of(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.MANAGEMENT),
                "New meal order — " + order.getOrderCode(),
                guest.getName() + " · Room " + order.getRoom() + " · "
                        + capitalize(order.getMealCategory().name()) + " · RWF " + total,
                NotificationCategory.SERVICE);

        auditService.log(guest.getEmail(), "Meal order submitted: " + order.getOrderCode());
        return DtoMapper.toMealOrder(order);
    }

    @Transactional
    public ApiDtos.MealOrderDto approve(String orderCode) {
        UserAccount actor = requireFrontDesk();
        MealOrder order = findOrder(orderCode);
        if (order.getStatus() != MealOrderStatus.PENDING) {
            throw new IllegalArgumentException("Only pending orders can be approved");
        }
        order.setStatus(MealOrderStatus.APPROVED);
        order.setUpdatedAt(Instant.now());
        order = mealOrderRepository.save(order);

        UserAccount guest = order.getGuestUser();
        if (guest != null) {
            notify(guest, "Meal order approved — pay now",
                    order.getOrderCode() + " was approved. Pay RWF " + order.getTotalRwf()
                            + " via Paypack MoMo before the kitchen starts preparing your meal.",
                    NotificationCategory.PAYMENT);
        }
        auditService.log(actor.getEmail(), "Approved meal order: " + orderCode);
        return DtoMapper.toMealOrder(order);
    }

    @Transactional
    public ApiDtos.MealOrderDto reject(String orderCode, ApiDtos.RejectMealOrderRequest req) {
        UserAccount actor = requireFrontDesk();
        if (!StringUtils.hasText(req.reason()) || req.reason().trim().length() < 5) {
            throw new IllegalArgumentException("Please provide an explanation (at least 5 characters)");
        }
        MealOrder order = findOrder(orderCode);
        if (order.getStatus() != MealOrderStatus.PENDING) {
            throw new IllegalArgumentException("Only pending orders can be rejected");
        }
        order.setStatus(MealOrderStatus.REJECTED);
        order.setRejectionReason(req.reason().trim());
        order.setUpdatedAt(Instant.now());
        order = mealOrderRepository.save(order);

        UserAccount guest = order.getGuestUser();
        if (guest != null) {
            notify(guest, "Meal order not approved",
                    order.getOrderCode() + " was declined. Reason: " + order.getRejectionReason(),
                    NotificationCategory.SERVICE);
        }
        auditService.log(actor.getEmail(), "Rejected meal order: " + orderCode + " — " + req.reason().trim());
        return DtoMapper.toMealOrder(order);
    }

    @Transactional
    public ApiDtos.PaypackPaymentInitDto payWithPaypack(String orderCode, ApiDtos.MealPaypackPaymentRequest req) {
        UserAccount guest = currentUser.requireUser();
        if (guest.getRole() != UserRole.GUEST) {
            throw new IllegalArgumentException("Only guests can pay for meal orders");
        }
        MealOrder order = findOrder(orderCode);
        if (order.getGuestUser() == null || !order.getGuestUser().getId().equals(guest.getId())) {
            throw new IllegalArgumentException("Not your order");
        }
        if (order.getStatus() != MealOrderStatus.APPROVED) {
            throw new IllegalArgumentException("Order must be approved by reception before payment");
        }

        long chargeAmount = paypackService.resolveChargeAmount(order.getTotalRwf());
        PaypackService.CashinResult cashin = paypackService.cashin(chargeAmount, req.phoneNumber());
        String receiptEmail = req.confirmationEmail().trim().toLowerCase();

        Payment payment = new Payment();
        payment.setPaymentCode("PAY-" + System.currentTimeMillis() % 100000);
        payment.setGuestUser(guest);
        payment.setGuestName(guest.getName());
        payment.setMealOrder(order);
        payment.setAmountRwf(chargeAmount);
        payment.setMethod(PaymentMethod.PAYPACK);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setIremboReference(paypackService.paypackReference(cashin.ref()));
        payment.setConfirmationEmail(receiptEmail);
        payment = paymentRepository.saveAndFlush(payment);

        order.setPaymentCode(payment.getPaymentCode());
        mealOrderRepository.save(order);

        if (cashin.simulated()) {
            bookingPaymentService.simulateCompleteIfNeeded(payment);
        }

        String message = cashin.simulated()
                ? "Test payment simulated — kitchen will prepare your order."
                : "Approve the MoMo prompt on " + PaypackService.normalizePhone(req.phoneNumber())
                        + ". Payment RWF " + chargeAmount + " will be sent to merchant "
                        + paypackService.merchantPhonesDisplay() + ".";

        auditService.log(guest.getEmail(), "Meal order Paypack initiated: " + orderCode);
        return new ApiDtos.PaypackPaymentInitDto(
                payment.getPaymentCode(),
                cashin.ref(),
                chargeAmount,
                order.getTotalRwf(),
                cashin.status(),
                message,
                chargeAmount != order.getTotalRwf());
    }

    @Transactional
    public ApiDtos.PaymentDto syncPaypackPayment(String paymentCode) {
        UserAccount user = currentUser.requireUser();
        Payment payment = paymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        if (user.getRole() == UserRole.GUEST
                && payment.getGuestUser() != null
                && !payment.getGuestUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not your payment");
        }
        if (payment.getStatus() == PaymentStatus.PENDING
                && payment.getIremboReference() != null
                && payment.getIremboReference().startsWith("PAYPACK-")) {
            String ref = payment.getIremboReference().substring("PAYPACK-".length());
            String status = paypackService.resolveTransactionStatus(ref);
            if (paypackService.isSuccessfulStatus(status)) {
                bookingPaymentService.completePaypackPayment(ref, payment.getAmountRwf(), status);
                payment = paymentRepository.findByPaymentCode(paymentCode).orElse(payment);
            }
        }
        return DtoMapper.toPayment(payment);
    }

    @Transactional
    public void completeMealPayment(String paymentCode, long amountPaid, String paypackStatus) {
        if (!paypackService.isSuccessfulStatus(paypackStatus)) {
            return;
        }
        Payment payment = paymentRepository.findByPaymentCode(paymentCode).orElse(null);
        if (payment == null || payment.getMealOrder() == null) {
            return;
        }
        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            return;
        }
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setFinanceVerified(true);
        paymentRepository.save(payment);

        MealOrder order = payment.getMealOrder();
        order.setStatus(MealOrderStatus.SENT_TO_KITCHEN);
        order.setPaymentCode(paymentCode);
        order.setUpdatedAt(Instant.now());
        mealOrderRepository.save(order);

        UserAccount guest = order.getGuestUser();
        if (guest != null) {
            notify(guest, "Meal order paid — kitchen notified",
                    "Payment RWF " + amountPaid + " received for " + order.getOrderCode()
                            + ". The chef is preparing your " + order.getMealCategory().name().toLowerCase() + ".",
                    NotificationCategory.PAYMENT);
        }
        notifyRoles(List.of(UserRole.RECEPTIONIST, UserRole.STAFF),
                "Prepare meal — " + order.getOrderCode(),
                order.getGuestName() + " · Room " + order.getRoom() + " · "
                        + capitalize(order.getMealCategory().name()) + " · RWF " + order.getTotalRwf()
                        + " paid — send to chef and arrange service.",
                NotificationCategory.SERVICE);
        auditService.log(guest != null ? guest.getEmail() : "system",
                "Meal order paid: " + order.getOrderCode() + " — RWF " + amountPaid);
    }

    @Transactional
    public ApiDtos.MealOrderDto sendToKitchen(String orderCode) {
        UserAccount actor = requireFrontDeskOrStaff();
        MealOrder order = findOrder(orderCode);
        if (order.getStatus() != MealOrderStatus.PAID && order.getStatus() != MealOrderStatus.APPROVED) {
            if (order.getStatus() == MealOrderStatus.SENT_TO_KITCHEN
                    || order.getStatus() == MealOrderStatus.PREPARING) {
                return DtoMapper.toMealOrder(order);
            }
            throw new IllegalArgumentException("Order must be paid before sending to kitchen");
        }
        order.setStatus(MealOrderStatus.SENT_TO_KITCHEN);
        order.setUpdatedAt(Instant.now());
        order = mealOrderRepository.save(order);
        notifyKitchen(order);
        auditService.log(actor.getEmail(), "Meal order sent to kitchen: " + orderCode);
        return DtoMapper.toMealOrder(order);
    }

    @Transactional
    public ApiDtos.MealOrderDto startPreparing(String orderCode) {
        UserAccount actor = requireFrontDeskOrStaff();
        MealOrder order = advanceFrom(orderCode, MealOrderStatus.SENT_TO_KITCHEN, MealOrderStatus.PREPARING);
        notifyGuestStatus(order, "Your meal is being prepared");
        auditService.log(actor.getEmail(), "Meal order preparing: " + orderCode);
        return DtoMapper.toMealOrder(order);
    }

    @Transactional
    public ApiDtos.MealOrderDto markReady(String orderCode) {
        UserAccount actor = requireFrontDeskOrStaff();
        MealOrder order = advanceFrom(orderCode, MealOrderStatus.PREPARING, MealOrderStatus.READY);
        notifyRoles(List.of(UserRole.RECEPTIONIST, UserRole.STAFF),
                "Meal ready to serve — " + order.getOrderCode(),
                "Room " + order.getRoom() + " — assign someone to deliver.",
                NotificationCategory.SERVICE);
        notifyGuestStatus(order, "Your meal is ready — a server will bring it shortly");
        auditService.log(actor.getEmail(), "Meal order ready: " + orderCode);
        return DtoMapper.toMealOrder(order);
    }

    @Transactional
    public ApiDtos.MealOrderDto assignServer(String orderCode, ApiDtos.AssignMealServerRequest req) {
        UserAccount actor = requireFrontDeskOrStaff();
        if (!StringUtils.hasText(req.serverName())) {
            throw new IllegalArgumentException("Server name is required");
        }
        MealOrder order = findOrder(orderCode);
        if (order.getStatus() != MealOrderStatus.READY && order.getStatus() != MealOrderStatus.SERVING) {
            throw new IllegalArgumentException("Order must be ready before assigning a server");
        }
        String serverName = req.serverName().trim();
        order.setServerName(serverName);
        order.setStatus(MealOrderStatus.SERVING);
        order.setUpdatedAt(Instant.now());
        MealOrder saved = mealOrderRepository.save(order);

        notifyGuestStatus(saved, serverName + " is bringing your meal to room " + saved.getRoom());
        userAccountRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.STAFF)
                .filter(u -> serverName.equalsIgnoreCase(u.getName()))
                .findFirst()
                .ifPresent(staff -> notify(staff, "Serve meal — " + saved.getOrderCode(),
                        "Deliver to room " + saved.getRoom() + " · " + saved.getGuestName(),
                        NotificationCategory.SERVICE));
        auditService.log(actor.getEmail(), "Meal server assigned: " + orderCode + " → " + serverName);
        return DtoMapper.toMealOrder(saved);
    }

    @Transactional
    public ApiDtos.MealOrderDto markServed(String orderCode) {
        UserAccount actor = requireFrontDeskOrStaff();
        MealOrder order = advanceFrom(orderCode, MealOrderStatus.SERVING, MealOrderStatus.SERVED);
        notifyGuestStatus(order, "Enjoy your meal! Thank you for dining with us.");
        auditService.log(actor.getEmail(), "Meal order served: " + orderCode);
        return DtoMapper.toMealOrder(order);
    }

    private MealOrder advanceFrom(String orderCode, MealOrderStatus expected, MealOrderStatus next) {
        MealOrder order = findOrder(orderCode);
        if (order.getStatus() != expected) {
            throw new IllegalArgumentException("Order must be " + expected.name().toLowerCase().replace("_", " ")
                    + " (current: " + order.getStatus().name().toLowerCase().replace("_", " ") + ")");
        }
        order.setStatus(next);
        order.setUpdatedAt(Instant.now());
        return mealOrderRepository.save(order);
    }

    private void notifyKitchen(MealOrder order) {
        notifyRoles(List.of(UserRole.STAFF, UserRole.RECEPTIONIST),
                "Chef: new meal order — " + order.getOrderCode(),
                order.getGuestName() + " · Room " + order.getRoom() + " · "
                        + capitalize(order.getMealCategory().name()),
                NotificationCategory.SERVICE);
    }

    private void notifyGuestStatus(MealOrder order, String message) {
        UserAccount guest = order.getGuestUser();
        if (guest != null) {
            notify(guest, "Meal order update — " + order.getOrderCode(), message, NotificationCategory.SERVICE);
        }
    }

    private MealOrder findOrder(String orderCode) {
        return mealOrderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Meal order not found: " + orderCode));
    }

    private UserAccount requireFrontDesk() {
        UserAccount user = currentUser.requireUser();
        if (user.getRole() != UserRole.RECEPTIONIST
                && user.getRole() != UserRole.ADMIN
                && user.getRole() != UserRole.MANAGEMENT) {
            throw new IllegalArgumentException("Only reception or management can perform this action");
        }
        return user;
    }

    private UserAccount requireFrontDeskOrStaff() {
        UserAccount user = currentUser.requireUser();
        if (user.getRole() != UserRole.RECEPTIONIST
                && user.getRole() != UserRole.ADMIN
                && user.getRole() != UserRole.MANAGEMENT
                && user.getRole() != UserRole.STAFF) {
            throw new IllegalArgumentException("Not authorized for kitchen operations");
        }
        return user;
    }

    private void notify(UserAccount user, String title, String body, NotificationCategory category) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setBody(body);
        n.setCategory(category);
        n.setRead(false);
        notificationRepository.save(n);
    }

    private void notifyRoles(List<UserRole> roles, String title, String body, NotificationCategory category) {
        for (UserRole role : roles) {
            for (UserAccount user : userAccountRepository.findByRole(role)) {
                notify(user, title, body, category);
            }
        }
    }

    private static String capitalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return raw;
        }
        String lower = raw.toLowerCase().replace('_', ' ');
        return lower.substring(0, 1).toUpperCase() + lower.substring(1);
    }
}
