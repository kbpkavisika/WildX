package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.IncidentTypeRepository;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.type.Severity;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class IncidentTypeServiceImplTest {
    private final ParkService parks = mock(ParkService.class);
    private final IncidentTypeRepository types = mock(IncidentTypeRepository.class);
    private final IncidentTypeServiceImpl service = new IncidentTypeServiceImpl(parks, types);
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();

    @Test
    void createsTrimmedTypeInPark() {
        when(parks.require(1L)).thenReturn(park);
        when(types.saveAndFlush(any())).thenAnswer(call -> {
            IncidentType type = call.getArgument(0);
            type.setId(4L);
            return type;
        });
        var result = service.createType(1L, new IncidentTypeRequest(" Snare ", Severity.HIGH, true));
        assertThat(result).isEqualTo(new IncidentTypeResponse(4L, 1L, "Snare", Severity.HIGH, true));
    }

    @Test
    void listsUpdatesAndDeletesTypes() {
        IncidentType type = new IncidentType();
        type.setId(4L);
        type.setPark(park);
        type.setName("Carcass");
        type.setDefaultSeverity(Severity.MEDIUM);
        type.setActive(true);
        when(types.findByParkIdOrderByNameAscIdAsc(1L)).thenReturn(List.of(type));
        assertThat(service.types(1L)).extracting(IncidentTypeResponse::name).containsExactly("Carcass");
        when(types.findByIdAndParkId(4L, 1L)).thenReturn(Optional.of(type));
        var updated = service.updateType(1L, 4L, new IncidentTypeRequest("Carcass", Severity.CRITICAL, false));
        assertThat(updated.defaultSeverity()).isEqualTo(Severity.CRITICAL);
        assertThat(updated.active()).isFalse();
        service.deleteType(1L, 4L);
        verify(types).delete(type);
        verify(types, times(2)).flush();
    }

    @Test
    void rejectsTypesOfOtherParks() {
        when(types.findByIdAndParkId(4L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateType(1L, 4L, new IncidentTypeRequest("Snare", Severity.HIGH, true)))
                .isInstanceOf(NotFoundException.class).hasMessage("Incident type not found");
        assertThatThrownBy(() -> service.deleteType(1L, 4L)).hasMessage("Incident type not found");
        verify(types, never()).delete(any());
    }
}
