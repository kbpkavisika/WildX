package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.PatrolRouteRequest;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.model.PatrolRoute;
import com.wildx.wildx.repository.PatrolRouteRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PatrolRouteServiceImplTest {
    private static final String LINE = "{\"type\":\"LineString\",\"coordinates\":[[80,6],[81,7]]}";

    private final PatrolRouteRepository repository = mock(PatrolRouteRepository.class);
    private final ParkServiceImpl parks = mock(ParkServiceImpl.class);
    private final PatrolRouteServiceImpl service = new PatrolRouteServiceImpl(repository, parks);
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();

    private PatrolRoute route() {
        PatrolRoute route = new PatrolRoute();
        route.setId(3L);
        route.setPark(park);
        route.setName("North");
        route.setPathGeojson(LINE);
        return route;
    }

    @Test
    void createsValidatedRouteWithinCallerPark() {
        when(parks.require(1L)).thenReturn(park);
        when(repository.save(any())).thenAnswer(call -> {
            PatrolRoute route = call.getArgument(0);
            route.setId(3L);
            return route;
        });
        var route = service.create(1L, new PatrolRouteRequest(" North ", LINE));
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
    void updatesAndArchivesRoutes() {
        PatrolRoute route = route();
        when(repository.findByIdAndParkIdAndArchivedFalse(3L, 1L)).thenReturn(Optional.of(route));
        String path = "{\"type\":\"LineString\",\"coordinates\":[[80,6],[82,8]]}";
        var updated = service.update(1L, 3L, new PatrolRouteRequest(" South ", path));
        assertThat(updated.name()).isEqualTo("South");
        assertThat(updated.pathGeojson()).isEqualTo(path);
        assertThatThrownBy(() -> service.update(1L, 3L, new PatrolRouteRequest("South", "{}")))
                .isInstanceOf(IllegalArgumentException.class);
        service.archive(1L, 3L);
        assertThat(route.isArchived()).isTrue();
    }

    @Test
    void listsOnlyActiveRoutes() {
        when(repository.findByParkIdAndArchivedFalseOrderByNameAscIdAsc(1L)).thenReturn(List.of(route()));
        assertThat(service.list(1L)).extracting("name").containsExactly("North");
    }

    @Test
    void hidesForeignParkAndArchivedRoutes() {
        when(repository.findByIdAndParkIdAndArchivedFalse(3L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.require(3L, 1L)).hasMessage("Route not found");
        assertThatThrownBy(() -> service.archive(1L, 3L)).hasMessage("Route not found");
    }
}
