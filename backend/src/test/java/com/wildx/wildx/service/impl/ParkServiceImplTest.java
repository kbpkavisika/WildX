package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.model.*;
import com.wildx.wildx.repository.*;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ParkServiceImplTest {
    private final ParkRepository parks = mock(ParkRepository.class);
    private final SectorRepository sectors = mock(SectorRepository.class);
    private final ParkServiceImpl service = new ParkServiceImpl(parks, sectors);
    private final Park park = Park.builder().id(1L).name("Yala").code("YALA").build();
    private static final String POLYGON = "{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[4,0],[4,4],[0,4],[0,0]]]}";

    @Test
    void createsParkWithNormalisedCode() {
        when(parks.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        Park created = service.create(new ParkRequest(" Wilpattu ", " wil "));
        assertThat(created.getName()).isEqualTo("Wilpattu");
        assertThat(created.getCode()).isEqualTo("WIL");
        assertThat(created.getNeglectDays()).isEqualTo(7);
    }

    @Test
    void createsSectorWithValidatedPolygon() {
        when(parks.findById(1L)).thenReturn(Optional.of(park));
        when(sectors.save(any())).thenAnswer(call -> {
            Sector sector = call.getArgument(0);
            sector.setId(2L);
            return sector;
        });
        var result = service.createSector(1L, new SectorRequest(" East ", POLYGON));
        assertThat(result.name()).isEqualTo("East");
        assertThat(result.parkId()).isEqualTo(1L);
        assertThat(result.polygonGeojson()).isEqualTo(POLYGON);
    }

    @Test
    void validatesPolygonBeforeSavingAndHidesOtherParks() {
        assertThatThrownBy(() -> service.createSector(1L, new SectorRequest("East", "{}")))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(parks, sectors);
        when(sectors.findByIdAndParkId(2L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateSector(1L, 2L, new SectorRequest("East", POLYGON)))
                .hasMessage("Sector not found");
        assertThatThrownBy(() -> service.deleteSector(1L, 2L)).hasMessage("Sector not found");
    }

    @Test
    void readsSectorsAndUpdatesNeglectDays() {
        Sector sector = new Sector();
        sector.setId(2L);
        sector.setPark(park);
        sector.setName("East");
        sector.setPolygonGeojson(POLYGON);
        when(sectors.findByParkIdOrderByIdAsc(1L)).thenReturn(List.of(sector));
        when(parks.findById(1L)).thenReturn(Optional.of(park));
        assertThat(service.sectors(1L)).extracting(SectorResponse::name).containsExactly("East");
        service.updateCoverageSettings(1L, new CoverageSettingsRequest(10));
        assertThat(service.neglectDays(1L)).isEqualTo(10);
        when(sectors.findByIdAndParkId(2L, 1L)).thenReturn(Optional.of(sector));
        assertThat(service.updateSector(1L, 2L, new SectorRequest("West", POLYGON)).name()).isEqualTo("West");
        service.deleteSector(1L, 2L);
        verify(sectors).delete(sector);
    }
}
