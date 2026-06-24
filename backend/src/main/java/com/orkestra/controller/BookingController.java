package com.orkestra.controller;

import com.orkestra.dto.ApiDtos;
import com.orkestra.service.BookingService;
import com.orkestra.service.WorkflowService;
import java.util.Map;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final WorkflowService workflowService;

    public BookingController(BookingService bookingService, WorkflowService workflowService) {
        this.bookingService = bookingService;
        this.workflowService = workflowService;
    }

    @GetMapping
    public List<ApiDtos.BookingDto> list() {
        return bookingService.list();
    }

    @GetMapping("/availability")
    public ApiDtos.AvailabilityDto availability() {
        return bookingService.availability();
    }

    @GetMapping("/rooms")
    public ApiDtos.RoomSearchResultDto searchRooms(
            @RequestParam(required = false) String checkIn,
            @RequestParam(required = false) String checkOut,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false, defaultValue = "false") boolean availableOnly) {
        return bookingService.searchRooms(checkIn, checkOut, roomType, availableOnly);
    }

    @PostMapping
    public ApiDtos.BookingDto create(@Valid @RequestBody ApiDtos.CreateBookingRequest req) {
        return bookingService.create(req);
    }

    @GetMapping("/quote")
    public ApiDtos.BookingQuoteDto quote(
            @RequestParam String checkIn,
            @RequestParam String checkOut,
            @RequestParam String roomType,
            @RequestParam String roomNumber,
            @RequestParam(defaultValue = "2") int guestCount) {
        return bookingService.quote(checkIn, checkOut, roomType, roomNumber, guestCount);
    }

    @PostMapping("/request")
    public ApiDtos.BookingDto requestBooking(@Valid @RequestBody ApiDtos.RequestBookingRequest req) {
        return bookingService.requestBooking(req);
    }

    @PostMapping("/book-and-pay")
    public ApiDtos.BookingConfirmationDto bookAndPay(@Valid @RequestBody ApiDtos.BookWithPaymentRequest req) {
        return bookingService.bookAndPay(req);
    }

    @PostMapping("/{code}/approve")
    public ApiDtos.BookingDto approve(@PathVariable String code) {
        return bookingService.approveBooking(code);
    }

    @PostMapping("/{code}/reject")
    public ApiDtos.BookingDto reject(
            @PathVariable String code, @RequestBody(required = false) ApiDtos.RejectBookingRequest req) {
        return bookingService.rejectBooking(code, req != null ? req.reason() : null);
    }

    @PostMapping("/{code}/pay-paypack")
    public ApiDtos.PaypackPaymentInitDto payWithPaypack(
            @PathVariable String code, @Valid @RequestBody ApiDtos.PaypackBookingPaymentRequest req) {
        return bookingService.payApprovedBookingWithPaypack(code, req);
    }

    @PostMapping("/payments/{paymentCode}/sync-paypack")
    public ApiDtos.PaymentDto syncPaypack(@PathVariable String paymentCode) {
        return bookingService.syncPaypackPayment(paymentCode);
    }

    @PatchMapping("/{code}")
    public ApiDtos.BookingDto update(
            @PathVariable String code, @RequestBody ApiDtos.UpdateBookingRequest req) {
        return bookingService.update(code, req);
    }

    @PatchMapping("/{code}/cancel")
    public ApiDtos.BookingDto cancel(@PathVariable String code) {
        return bookingService.cancel(code);
    }

    @PostMapping("/{code}/verify")
    public ApiDtos.BookingDto verify(@PathVariable String code) {
        return bookingService.verifyReservation(code);
    }

    @PostMapping("/{code}/check-in")
    public ApiDtos.BookingDto checkIn(
            @PathVariable String code,
            @RequestBody(required = false) Map<String, String> body) {
        String room = body != null ? body.get("roomNumber") : null;
        return workflowService.receptionistCheckIn(code, room);
    }

    @PostMapping("/{code}/check-out")
    public ApiDtos.BookingDto checkOut(@PathVariable String code) {
        return workflowService.receptionistCheckOut(code);
    }
}
