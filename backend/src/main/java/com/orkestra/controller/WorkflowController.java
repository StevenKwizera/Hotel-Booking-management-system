package com.orkestra.controller;

import com.orkestra.dto.ApiDtos;
import com.orkestra.service.WorkflowService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workflows")
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return workflowService.workflowStatus();
    }

    @GetMapping("/arrivals/today")
    public List<ApiDtos.BookingDto> arrivals() {
        return workflowService.todayArrivals();
    }

    @GetMapping("/arrivals/guest-arrived")
    public List<ApiDtos.BookingDto> guestArrivals() {
        return workflowService.guestArrivalsToday();
    }

    @PostMapping("/arrival/{bookingCode}")
    public ApiDtos.MessageResponse recordArrival(@PathVariable String bookingCode) {
        return workflowService.recordGuestArrival(bookingCode);
    }

    @GetMapping("/departures/today")
    public List<ApiDtos.BookingDto> departures() {
        return workflowService.todayDepartures();
    }

    @PostMapping("/check-in/{bookingCode}")
    public ApiDtos.BookingDto checkIn(
            @PathVariable String bookingCode,
            @RequestBody(required = false) Map<String, String> body) {
        String room = body != null ? body.get("roomNumber") : null;
        return workflowService.receptionistCheckIn(bookingCode, room);
    }

    @GetMapping("/checkout-queue")
    public List<ApiDtos.BookingDto> checkoutQueue() {
        return workflowService.checkoutQueue();
    }

    @GetMapping("/checkout-bill/{bookingCode}")
    public ApiDtos.CheckoutBillDto checkoutBill(@PathVariable String bookingCode) {
        return workflowService.calculateCheckoutBill(bookingCode);
    }

    @PostMapping("/verify-charges/{bookingCode}")
    public ApiDtos.CheckoutBillDto verifyCharges(@PathVariable String bookingCode) {
        return workflowService.verifyCheckoutCharges(bookingCode);
    }

    @PostMapping("/issue-invoice/{bookingCode}")
    public ApiDtos.InvoiceDto issueInvoice(@PathVariable String bookingCode) {
        return workflowService.issueInvoice(bookingCode);
    }

    @PostMapping("/check-out/{bookingCode}")
    public ApiDtos.BookingDto checkOut(@PathVariable String bookingCode) {
        return workflowService.receptionistCheckOut(bookingCode);
    }

    @PostMapping("/checkout-request/{bookingCode}")
    public ApiDtos.MessageResponse guestCheckoutRequest(@PathVariable String bookingCode) {
        return workflowService.guestRequestCheckout(bookingCode);
    }

    @GetMapping("/invoice/{bookingCode}")
    public ApiDtos.InvoiceDto invoice(@PathVariable String bookingCode) {
        return workflowService.generateInvoice(bookingCode);
    }
}
