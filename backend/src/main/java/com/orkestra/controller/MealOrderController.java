package com.orkestra.controller;

import com.orkestra.dto.ApiDtos;
import com.orkestra.service.MealOrderService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/meal-orders")
public class MealOrderController {

    private final MealOrderService mealOrderService;

    public MealOrderController(MealOrderService mealOrderService) {
        this.mealOrderService = mealOrderService;
    }

    @GetMapping("/menu")
    public List<ApiDtos.MenuItemDto> menu(@RequestParam(required = false) String category) {
        return mealOrderService.menu(category);
    }

    @GetMapping
    public List<ApiDtos.MealOrderDto> list() {
        return mealOrderService.list();
    }

    @PostMapping
    public ApiDtos.MealOrderDto create(@RequestBody ApiDtos.CreateMealOrderRequest req) {
        return mealOrderService.create(req);
    }

    @PostMapping("/{orderCode}/approve")
    public ApiDtos.MealOrderDto approve(@PathVariable String orderCode) {
        return mealOrderService.approve(orderCode);
    }

    @PostMapping("/{orderCode}/reject")
    public ApiDtos.MealOrderDto reject(
            @PathVariable String orderCode, @RequestBody ApiDtos.RejectMealOrderRequest req) {
        return mealOrderService.reject(orderCode, req);
    }

    @PostMapping("/{orderCode}/pay-paypack")
    public ApiDtos.PaypackPaymentInitDto payPaypack(
            @PathVariable String orderCode, @RequestBody ApiDtos.MealPaypackPaymentRequest req) {
        return mealOrderService.payWithPaypack(orderCode, req);
    }

    @PostMapping("/payments/{paymentCode}/sync-paypack")
    public ApiDtos.PaymentDto syncPaypack(@PathVariable String paymentCode) {
        return mealOrderService.syncPaypackPayment(paymentCode);
    }

    @PostMapping("/{orderCode}/send-to-kitchen")
    public ApiDtos.MealOrderDto sendToKitchen(@PathVariable String orderCode) {
        return mealOrderService.sendToKitchen(orderCode);
    }

    @PostMapping("/{orderCode}/preparing")
    public ApiDtos.MealOrderDto preparing(@PathVariable String orderCode) {
        return mealOrderService.startPreparing(orderCode);
    }

    @PostMapping("/{orderCode}/ready")
    public ApiDtos.MealOrderDto ready(@PathVariable String orderCode) {
        return mealOrderService.markReady(orderCode);
    }

    @PostMapping("/{orderCode}/assign-server")
    public ApiDtos.MealOrderDto assignServer(
            @PathVariable String orderCode, @RequestBody ApiDtos.AssignMealServerRequest req) {
        return mealOrderService.assignServer(orderCode, req);
    }

    @PostMapping("/{orderCode}/served")
    public ApiDtos.MealOrderDto served(@PathVariable String orderCode) {
        return mealOrderService.markServed(orderCode);
    }
}
