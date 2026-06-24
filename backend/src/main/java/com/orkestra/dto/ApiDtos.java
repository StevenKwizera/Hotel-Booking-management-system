package com.orkestra.dto;

import java.util.List;
import java.util.Map;

public final class ApiDtos {

    private ApiDtos() {}

    public record BookingDto(
            String id,
            String guestName,
            String guestEmail,
            String room,
            String checkIn,
            String checkOut,
            String status,
            long amount,
            long grossAmount,
            long discountRwf,
            boolean earlyBookingDiscount,
            boolean repeatGuestDiscount,
            String roomType,
            Integer guestCount,
            boolean checkoutRequested,
            boolean chargesVerified,
            boolean invoiceIssued,
            boolean guestArrived) {}

    public record CreateBookingRequest(
            String checkIn,
            String checkOut,
            String roomType,
            int guestCount,
            String guestName,
            String guestEmail,
            String roomNumber) {}

    public record BookingQuoteDto(
            String roomNumber,
            String roomType,
            String checkIn,
            String checkOut,
            int nights,
            int guestCount,
            long nightlyRateRwf,
            long subtotalRwf,
            long discountRwf,
            long totalRwf,
            boolean earlyBookingDiscount,
            boolean repeatGuestDiscount,
            boolean available) {}

    public record BookWithPaymentRequest(
            String checkIn,
            String checkOut,
            String roomType,
            int guestCount,
            String roomNumber,
            String paymentMethod) {}

    public record RequestBookingRequest(
            String checkIn,
            String checkOut,
            String roomType,
            int guestCount,
            String roomNumber) {}

    public record PaypackBookingPaymentRequest(
            String phoneNumber,
            @jakarta.validation.constraints.NotBlank(message = "Confirmation email is required")
            @jakarta.validation.constraints.Email(message = "Enter a valid confirmation email")
            String confirmationEmail) {}

    public record PaypackPaymentInitDto(
            String paymentId,
            String paypackRef,
            long amountRwf,
            long bookingAmountRwf,
            String status,
            String message,
            boolean testMode) {}

    public record RejectBookingRequest(String reason) {}

    public record BookingConfirmationDto(
            BookingDto booking,
            PaymentDto payment,
            String message) {}

    public record RoomListingDto(
            String roomNumber,
            String roomType,
            long nightlyRateRwf,
            boolean availableForDates,
            String status,
            String statusLabel,
            String description,
            List<String> amenities,
            int maxGuests,
            String bedType,
            int sizeSqm,
            String floor,
            long totalForStayRwf) {}

    public record RoomSearchResultDto(
            List<RoomListingDto> rooms,
            int availableCount,
            int totalCount,
            String checkIn,
            String checkOut) {}

    public record StaffPaymentRequest(
            String guestEmail,
            long amount,
            String method,
            String reference) {}

    public record WalkInGuestRequest(
            String name,
            @jakarta.validation.constraints.Email String email,
            String phone) {}

    public record AvailabilityDto(int availableRooms, int totalRooms) {}

    public record GuestDto(
            String id,
            String name,
            String email,
            String phone,
            int visits,
            String tier,
            List<String> preferences,
            long balance) {}

    public record PaymentDto(
            String id,
            String guestName,
            long amount,
            String method,
            String status,
            String date,
            boolean verified,
            String reference,
            String bookingCode,
            String checkIn,
            String checkOut,
            String room,
            String roomType,
            Integer guestCount,
            Long bookingTotalRwf,
            String confirmationEmail,
            String guestEmail) {}

    public record CreatePaymentRequest(long amount, String phoneNumber) {}

    public record BalanceDto(long balanceRwf) {}

    public record ServiceRequestDto(
            String id,
            String type,
            String room,
            String description,
            String status,
            String priority,
            String createdAt,
            String guestEmail,
            String assignedStaff) {}

    public record UpdateBookingRequest(
            String checkIn,
            String checkOut,
            Integer guestCount) {}

    public record RoleTaskDto(
            String id,
            String title,
            String description,
            String icon,
            String actionLabel,
            String path,
            String priority) {}

    public record RoleDashboardDto(
            String role,
            String greeting,
            String subtitle,
            List<KpiDto> kpis,
            List<RoleTaskDto> tasks) {}

    public record InvoiceDto(
            String bookingCode,
            String guestName,
            String guestEmail,
            String room,
            long roomChargesRwf,
            long servicesRwf,
            long totalRwf,
            long balanceRwf,
            String issuedAt) {}

    public record CheckoutBillDto(
            String bookingCode,
            String guestName,
            String guestEmail,
            String room,
            long roomChargesRwf,
            long servicesRwf,
            long totalRwf,
            long balanceDueRwf,
            int serviceCount,
            boolean checkoutRequested,
            boolean chargesVerified,
            boolean invoiceIssued,
            boolean canCompleteCheckout) {}

    public record CreateServiceRequest(
            String type,
            String room,
            String description,
            String priority) {}

    public record RecommendationDto(
            String id,
            String title,
            String description,
            int confidence,
            boolean applied,
            boolean saved) {}

    public record GuestInsightDto(
            String id,
            String guest,
            String suggestion,
            int confidence,
            String title) {}

    public record AiStatsDto(int activeModels, int predictionsToday, int avgConfidence) {}

    public record AiDataPointDto(String label, String value) {}

    public record AiPipelineStepDto(
            String id,
            String title,
            String summary,
            List<AiDataPointDto> signals,
            String status) {}

    public record GuestPatternDto(String pattern, String detail) {}

    public record GuestPredictionDto(String title, String detail, int confidence) {}

    public record GuestAiAnalysisDto(
            String guestName,
            boolean returningGuest,
            int visitCount,
            String preferredRoomType,
            String guestSegment,
            List<GuestPatternDto> patterns,
            List<GuestPredictionDto> predictions) {}

    public record OccupancyForecastPointDto(String day, int predictedOccupancyPct, String trend) {}

    public record DynamicPriceDto(
            String roomType, long baseRateRwf, long suggestedRateRwf, String reason) {}

    public record ServicePeakDto(
            String serviceType, String peakPeriod, long requestCount, String recommendation) {}

    public record ManagementAiInsightsDto(
            List<OccupancyForecastPointDto> occupancyForecast,
            List<DynamicPriceDto> dynamicPricing,
            List<ServicePeakDto> serviceOptimization,
            List<String> strategicInsights) {}

    public record AiOverviewDto(
            List<AiPipelineStepDto> pipeline,
            GuestAiAnalysisDto guestAnalysis,
            ManagementAiInsightsDto managementInsights) {}

    public record NotificationDto(
            String id,
            String title,
            String body,
            String category,
            String time,
            boolean read) {}

    public record SendNotificationRequest(
            String toEmail,
            String title,
            String body,
            String category) {}

    public record MessageRecipientDto(String id, String name, String email, String role) {}

    public record BranchDto(
            String id,
            String name,
            int rooms,
            double occupancy,
            String status) {}

    public record AuditLogDto(String user, String action, String time) {}

    public record KpiDto(String id, String label, String value, Double change, String trend, String icon) {}

    public record DashboardDto(List<KpiDto> kpis, Map<String, Object> extras) {}

    public record OccupancyPoint(String day, int occupancy, double revenue) {}

    public record SystemSettingsDto(
            String hotelName,
            String branchDisplayName,
            boolean otpAdmin,
            boolean otpManagement,
            boolean otpFinance,
            int sessionTimeoutMinutes,
            boolean auditLoggingEnabled) {}

    public record UpdateSystemSettingsRequest(
            String hotelName,
            String branchDisplayName,
            Boolean otpAdmin,
            Boolean otpManagement,
            Boolean otpFinance,
            Integer sessionTimeoutMinutes,
            Boolean auditLoggingEnabled) {}

    public record BackupRecordDto(
            String id,
            String createdAt,
            String createdBy,
            String label,
            long sizeBytes,
            int userCount,
            int bookingCount,
            int paymentCount,
            int auditCount) {}

    public record BackupResultDto(
            BackupRecordDto record,
            Map<String, Object> exportPayload) {}

    public record UpdateBranchRequest(String status, String name) {}

    public record StaffPerformanceDto(
            String staffName,
            int assigned,
            int completed,
            int inProgress,
            int open,
            int completionRatePct) {}

    public record RevenueByMethodDto(String method, long amountRwf, int count) {}

    public record FinanceRevenueDto(
            long todayRevenueRwf,
            long weekRevenueRwf,
            long monthRevenueRwf,
            int pendingCount,
            int flaggedCount,
            int verifiedCount,
            List<RevenueByMethodDto> byMethod) {}

    public record MessageResponse(String message) {}

    public record FeedbackDto(
            String id,
            String guestName,
            String guestEmail,
            String room,
            int rating,
            String category,
            String subject,
            String message,
            String createdAt,
            String staffReply,
            String repliedByName,
            String repliedAt) {}

    public record SubmitFeedbackRequest(
            int rating, String category, String subject, String room, String message) {}

    public record ReplyFeedbackRequest(String message) {}

    public record MenuItemDto(String id, String name, String category, long priceRwf, String description) {}

    public record MealOrderLineDto(String menuItemId, String itemName, int quantity, long unitPriceRwf, long lineTotalRwf) {}

    public record MealOrderDto(
            String id,
            String guestName,
            String guestEmail,
            String room,
            String mealCategory,
            String status,
            long totalRwf,
            String guestNotes,
            String rejectionReason,
            String serverName,
            String paymentCode,
            List<MealOrderLineDto> items,
            String createdAt) {}

    public record CreateMealOrderRequest(
            String mealCategory,
            String room,
            String guestNotes,
            List<MealOrderLineRequest> items) {}

    public record MealOrderLineRequest(String menuItemId, int quantity) {}

    public record RejectMealOrderRequest(String reason) {}

    public record AssignMealServerRequest(String serverName) {}

    public record MealPaypackPaymentRequest(
            String phoneNumber,
            @jakarta.validation.constraints.NotBlank(message = "Confirmation email is required")
            @jakarta.validation.constraints.Email(message = "Enter a valid confirmation email")
            String confirmationEmail) {}
}
