package com.orkestra.controller;

import com.orkestra.dto.ApiDtos;
import com.orkestra.service.FeedbackService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping
    public List<ApiDtos.FeedbackDto> list() {
        return feedbackService.list();
    }

    @PostMapping
    public ApiDtos.FeedbackDto submit(@RequestBody ApiDtos.SubmitFeedbackRequest req) {
        return feedbackService.submit(req);
    }

    @PostMapping("/{feedbackCode}/reply")
    public ApiDtos.FeedbackDto reply(
            @PathVariable String feedbackCode,
            @RequestBody ApiDtos.ReplyFeedbackRequest req) {
        return feedbackService.reply(feedbackCode, req);
    }
}
