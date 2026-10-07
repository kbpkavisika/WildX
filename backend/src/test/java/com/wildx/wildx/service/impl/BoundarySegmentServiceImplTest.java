package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.BoundarySegmentRequest;
import com.wildx.wildx.dto.BoundarySegmentResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.BoundarySegment;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.repository.BoundarySegmentRepository;
import com.wildx.wildx.service.ParkService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BoundarySegmentServiceImplTest {
    private final ParkService parks = mock(ParkService.class);
    private final BoundarySegmentRepository segments = mock(BoundarySegmentRepository.class);
    private final BoundarySegmentServiceImpl service = new BoundarySegmentServiceImpl(parks, segments);
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();

    @Test
    void createsSegmentWithNormalizedCodeAndCoordinates() {
        when(parks.require(1L)).thenReturn(park);
        when(segments.existsByParkIdAndCodeIgnoreCase(1L, "KUMB")).thenReturn(false);
        when(segments.save(any())).thenAnswer(call -> {
            BoundarySegment s = call.getArgument(0);
            s.setId(10L);
            return s;
        });

        var result = service.createSegment(1L, new BoundarySegmentRequest("Kumbukgaha", " kumb ", 6.315, 81.41));
        assertThat(result).isEqualTo(new BoundarySegmentResponse(10L, 1L, "Kumbukgaha", "KUMB", 6.315, 81.41));
    }

    @Test
    void rejectsDuplicateCodeOnCreateAndUpdate() {
        when(parks.require(1L)).thenReturn(park);
        when(segments.existsByParkIdAndCodeIgnoreCase(1L, "KUMB")).thenReturn(true);
        assertThatThrownBy(() -> service.createSegment(1L, new BoundarySegmentRequest("Kumbukgaha", "KUMB", 6.315, 81.41)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Segment code already exists in this park");

        BoundarySegment existing = new BoundarySegment();
        existing.setId(10L);
        existing.setPark(park);
        existing.setCode("KUMB");
        existing.setName("Kumbukgaha");
        existing.setCenterLat(6.315);
        existing.setCenterLng(81.41);

        when(segments.findByIdAndParkId(10L, 1L)).thenReturn(Optional.of(existing));
        when(segments.existsByParkIdAndCodeIgnoreCaseAndIdNot(1L, "PAL", 10L)).thenReturn(true);

        assertThatThrownBy(() -> service.updateSegment(1L, 10L, new BoundarySegmentRequest("Palatupana", "PAL", 6.27, 81.44)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Segment code already exists in this park");
    }

    @Test
    void listsUpdatesAndDeletesSegments() {
        BoundarySegment segment = new BoundarySegment();
        segment.setId(10L);
        segment.setPark(park);
        segment.setName("Kumbukgaha");
        segment.setCode("KUMB");
        segment.setCenterLat(6.315);
        segment.setCenterLng(81.41);

        when(segments.findByParkIdOrderByNameAscIdAsc(1L)).thenReturn(List.of(segment));
        assertThat(service.segments(1L)).extracting(BoundarySegmentResponse::code).containsExactly("KUMB");

        when(segments.findByIdAndParkId(10L, 1L)).thenReturn(Optional.of(segment));
        when(segments.existsByParkIdAndCodeIgnoreCaseAndIdNot(1L, "KUMB_NORTH", 10L)).thenReturn(false);

        var updated = service.updateSegment(1L, 10L, new BoundarySegmentRequest("Kumbukgaha North", "kumb_north", 6.32, 81.42));
        assertThat(updated.code()).isEqualTo("KUMB_NORTH");
        assertThat(updated.name()).isEqualTo("Kumbukgaha North");

        service.deleteSegment(1L, 10L);
        verify(segments).delete(segment);
        verify(segments).flush();
    }

    @Test
    void requireAndFindOperationsWorkExpectedly() {
        when(segments.findByIdAndParkId(99L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.require(99L, 1L))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Boundary segment not found");

        assertThat(service.findByCode(1L, "")).isEmpty();
        assertThat(service.findByCode(1L, null)).isEmpty();

        BoundarySegment s1 = new BoundarySegment();
        s1.setId(1L);
        s1.setPark(park);
        s1.setName("Kumbukgaha");
        s1.setCode("KUMB");
        s1.setCenterLat(6.315);
        s1.setCenterLng(81.41);

        BoundarySegment s2 = new BoundarySegment();
        s2.setId(2L);
        s2.setPark(park);
        s2.setName("Palatupana");
        s2.setCode("PAL");
        s2.setCenterLat(6.27);
        s2.setCenterLng(81.44);

        when(segments.findByParkIdAndCodeIgnoreCase(1L, "KUMB")).thenReturn(Optional.of(s1));
        assertThat(service.findByCode(1L, "kumb")).contains(s1);

        when(segments.findByParkIdOrderByNameAscIdAsc(1L)).thenReturn(List.of(s1, s2));
        var nearest = service.findNearest(1L, 6.314, 81.412);
        assertThat(nearest).contains(s1);
    }
}
