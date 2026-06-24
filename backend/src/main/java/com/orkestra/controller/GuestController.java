package com.orkestra.controller;

import com.orkestra.dto.ApiDtos;
import com.orkestra.service.GuestService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/guests")
public class GuestController {

    private final GuestService guestService;

    public GuestController(GuestService guestService) {
        this.guestService = guestService;
    }

    @GetMapping
    public List<ApiDtos.GuestDto> list() {
        return guestService.listProfiles();
    }

    @GetMapping("/recommendations")
    public List<ApiDtos.RecommendationDto> recommendations() {
        return guestService.recommendations();
    }

    @PostMapping("/recommendations/{id}/apply")
    public ApiDtos.RecommendationDto apply(@PathVariable String id) {
        return guestService.applyRec(id);
    }

    @PostMapping("/recommendations/{id}/save")
    public ApiDtos.RecommendationDto save(@PathVariable String id) {
        return guestService.saveRec(id);
    }

    @PutMapping("/preferences")
    public ApiDtos.MessageResponse updatePreferences(@RequestBody List<String> preferences) {
        guestService.updatePreferences(preferences);
        return new ApiDtos.MessageResponse("Preferences updated");
    }

    @PostMapping("/walk-in")
    public ApiDtos.GuestDto walkIn(@RequestBody ApiDtos.WalkInGuestRequest req) {
        return guestService.createWalkInGuest(req);
    }

    @GetMapping("/ai/insights")
    public List<ApiDtos.GuestInsightDto> aiInsights() {
        return guestService.aiInsights();
    }

    @GetMapping("/ai/stats")
    public ApiDtos.AiStatsDto aiStats() {
        return guestService.aiStats();
    }

    @PostMapping("/ai/refresh")
    public ApiDtos.MessageResponse refreshAi() {
        guestService.refreshPersonalization();
        return new ApiDtos.MessageResponse("Recommendations refreshed from current guest data");
    }

    @GetMapping("/ai/overview")
    public ApiDtos.AiOverviewDto aiOverview() {
        return guestService.aiOverview();
    }
}
