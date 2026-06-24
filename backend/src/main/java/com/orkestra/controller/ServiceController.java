package com.orkestra.controller;

import com.orkestra.dto.ApiDtos;
import com.orkestra.service.ServiceOpsService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final ServiceOpsService serviceOpsService;

    public ServiceController(ServiceOpsService serviceOpsService) {
        this.serviceOpsService = serviceOpsService;
    }

    @GetMapping
    public List<ApiDtos.ServiceRequestDto> list() {
        return serviceOpsService.list();
    }

    @PostMapping
    public ApiDtos.ServiceRequestDto create(@RequestBody ApiDtos.CreateServiceRequest req) {
        return serviceOpsService.create(req);
    }

    @PatchMapping("/{code}/status")
    public ApiDtos.ServiceRequestDto updateStatus(
            @PathVariable String code, @RequestBody Map<String, String> body) {
        return serviceOpsService.updateStatus(code, body.get("status"));
    }

    @PatchMapping("/{code}/assign")
    public ApiDtos.ServiceRequestDto assign(
            @PathVariable String code, @RequestBody(required = false) Map<String, String> body) {
        String staff = body != null ? body.get("staffName") : null;
        return serviceOpsService.assignStaff(code, staff);
    }
}
