package com.wildx.wildx.controller;

import com.wildx.wildx.dto.BoundarySegmentResponse;
import com.wildx.wildx.service.BoundarySegmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/parks/{parkId}/segments")
@RequiredArgsConstructor
public class PublicBoundarySegmentController {
    private final BoundarySegmentService segments;

    @GetMapping
    public List<BoundarySegmentResponse> segments(@PathVariable Long parkId) {
        return segments.segments(parkId);
    }
}
