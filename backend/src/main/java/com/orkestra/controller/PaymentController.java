package com.orkestra.controller;

import com.orkestra.dto.ApiDtos;
import com.orkestra.service.PaymentService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public List<ApiDtos.PaymentDto> list() {
        return paymentService.list();
    }

    @GetMapping("/balance")
    public ApiDtos.BalanceDto balance() {
        return paymentService.balance();
    }

    @PostMapping
    public ApiDtos.PaypackPaymentInitDto pay(@RequestBody ApiDtos.CreatePaymentRequest req) {
        return paymentService.payWithPaypack(req);
    }

    @PostMapping("/staff")
    public ApiDtos.PaymentDto recordStaff(@RequestBody ApiDtos.StaffPaymentRequest req) {
        return paymentService.recordStaffPayment(req);
    }

    @PostMapping("/{code}/process")
    public ApiDtos.PaymentDto process(@PathVariable String code) {
        return paymentService.processPending(code);
    }

    @PostMapping("/{code}/refund")
    public ApiDtos.PaymentDto refund(@PathVariable String code) {
        return paymentService.refund(code);
    }

    @PostMapping("/{code}/verify")
    public ApiDtos.PaymentDto verify(@PathVariable String code) {
        return paymentService.verifyPayment(code);
    }

    @PostMapping("/{code}/flag")
    public ApiDtos.PaymentDto flag(@PathVariable String code) {
        return paymentService.flagPayment(code);
    }
}
