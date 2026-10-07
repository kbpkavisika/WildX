package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.ZoneRepository;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.type.ZoneType;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ZoneServiceImplTest {
    private static final String POLYGON = "{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[4,0],[4,4],[0,4],[0,0]]]}";
    private final ParkService parks = mock(ParkService.class);
    private final ZoneRepository zones = mock(ZoneRepository.class);
    private final ZoneServiceImpl service = new ZoneServiceImpl(parks, zones);
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();

    @Test
    void createsZoneWithValidatedPolygonAndType() {
        when(parks.require(1L)).thenReturn(park);
        when(zones.save(any())).thenAnswer(call -> {
            Zone zone = call.getArgument(0);
            zone.setId(3L);
            return zone;
        });
        var result = service.createZone(1L, new ZoneRequest(" Kumbukgaha farmland ", ZoneType.FARMLAND, POLYGON));
        assertThat(result).isEqualTo(new ZoneResponse(3L, 1L, "Kumbukgaha farmland", ZoneType.FARMLAND, POLYGON));
    }

    @Test
    void rejectsInvalidPolygonsAndOtherParkZones() {
        assertThatThrownBy(() -> service.createZone(1L, new ZoneRequest("Road", ZoneType.ROAD, "{}")))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(parks, zones);
        when(zones.findByIdAndParkId(3L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateZone(1L, 3L, new ZoneRequest("Road", ZoneType.ROAD, POLYGON)))
                .isInstanceOf(NotFoundException.class).hasMessage("Zone not found");
        assertThatThrownBy(() -> service.deleteZone(1L, 3L)).hasMessage("Zone not found");
        verify(zones, never()).delete(any());
    }

    @Test
    void listsUpdatesAndDeletesZones() {
        Zone zone = new Zone();
        zone.setId(3L);
        zone.setPark(park);
        zone.setName("Village edge");
        zone.setType(ZoneType.VILLAGE_BUFFER);
        zone.setPolygonGeojson(POLYGON);
        when(zones.findByParkIdOrderByNameAscIdAsc(1L)).thenReturn(List.of(zone));
        assertThat(service.zones(1L)).extracting(ZoneResponse::name).containsExactly("Village edge");
        when(zones.findByIdAndParkId(3L, 1L)).thenReturn(Optional.of(zone));
        var updated = service.updateZone(1L, 3L, new ZoneRequest("Core", ZoneType.RESTRICTED, POLYGON));
        assertThat(updated.type()).isEqualTo(ZoneType.RESTRICTED);
        assertThat(updated.name()).isEqualTo("Core");
        service.deleteZone(1L, 3L);
        verify(zones).delete(zone);
        verify(zones).flush();
    }
}
