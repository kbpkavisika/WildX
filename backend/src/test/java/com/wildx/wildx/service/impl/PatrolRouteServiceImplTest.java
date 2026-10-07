package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.PatrolRouteRequest;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.model.PatrolRoute;
import com.wildx.wildx.repository.PatrolRouteRepository;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PatrolRouteServiceImplTest {
    private final PatrolRouteRepository repository = mock(PatrolRouteRepository.class);
    private final ParkServiceImpl parks = mock(ParkServiceImpl.class);
    private final PatrolRouteServiceImpl service = new PatrolRouteServiceImpl(repository, parks);

    @Test
    void createsValidatedRouteWithinCallerPark() {
        Park park = Park.builder().id(1L).name("Yala").code("YALA").build();
        when(parks.require(1L)).thenReturn(park);
        when(repository.save(any())).thenAnswer(call -> {
            PatrolRoute route = call.getArgument(0);
            route.setId(3L);
            return route;
        });
        var route = service.create(1L, new PatrolRouteRequest(" North ", "{\"type\":\"LineString\",\"coordinates\":[[80,6],[81,7]]}"));
        assertThat(route.name()).isEqualTo("North");
        assertThat(route.id()).isEqualTo(3L);
        assertThat(route.parkId()).isEqualTo(1L);
    }

    @Test
    void rejectsInvalidGeometryBeforeSaving() {
        assertThatThrownBy(() -> service.create(1L, new PatrolRouteRequest("North", "{}")))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(repository, parks);
    }

    @Test
    void hidesForeignParkRoutes() {
        when(repository.findByIdAndParkId(3L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.require(3L, 1L)).hasMessage("Route not found");
    }
}
