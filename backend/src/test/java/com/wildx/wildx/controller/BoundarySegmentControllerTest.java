package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.BoundarySegmentResponse;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.BoundarySegmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({BoundarySegmentController.class, PublicBoundarySegmentController.class})
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class BoundarySegmentControllerTest {
    private static final String BODY = "{\"name\":\"Kumbukgaha\",\"code\":\"KUMB\",\"centerLat\":6.315,\"centerLng\":81.41}";

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean BoundarySegmentService segments;

    @Test
    void managerConfiguresBoundarySegmentsInOwnPark() throws Exception {
        var segment = new BoundarySegmentResponse(10L, 1L, "Kumbukgaha", "KUMB", 6.315, 81.41);
        when(segments.createSegment(eq(1L), any())).thenReturn(segment);
        when(segments.updateSegment(eq(1L), eq(10L), any())).thenReturn(segment);

        mvc.perform(post("/api/v1/parks/1/segments").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("KUMB"));

        mvc.perform(put("/api/v1/parks/1/segments/10").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk());

        mvc.perform(delete("/api/v1/parks/1/segments/10").header("Authorization", token("MANAGER")))
                .andExpect(status().isNoContent());

        verify(segments).deleteSegment(1L, 10L);
        verify(auth, times(3)).requireParkAccess(any(), eq(1L));
    }

    @Test
    void staffReadsButOnlyManagerWrites() throws Exception {
        when(segments.segments(1L)).thenReturn(List.of());
        mvc.perform(get("/api/v1/parks/1/segments").header("Authorization", token("CLO"))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/parks/1/segments").header("Authorization", token("RANGER"))).andExpect(status().isOk());

        mvc.perform(post("/api/v1/parks/1/segments").header("Authorization", token("SUPERVISOR"))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isForbidden());

        mvc.perform(delete("/api/v1/parks/1/segments/10").header("Authorization", token("ADMIN")))
                .andExpect(status().isForbidden());

        verify(segments, never()).createSegment(any(), any());
        verify(segments, never()).deleteSegment(any(), any());
    }

    @Test
    void publicAccessAllowsVillagerLandmarkLookupWithoutAuth() throws Exception {
        var segment = new BoundarySegmentResponse(10L, 1L, "Kumbukgaha", "KUMB", 6.315, 81.41);
        when(segments.segments(1L)).thenReturn(List.of(segment));

        mvc.perform(get("/api/v1/public/parks/1/segments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("KUMB"));
    }

    @Test
    void rejectsOtherParksAndInvalidPayloads() throws Exception {
        doThrow(new AccessDeniedException("Access denied")).when(auth).requireParkAccess(any(), eq(2L));

        mvc.perform(post("/api/v1/parks/2/segments").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/parks/1/segments").header("Authorization", token("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"code\":\"\",\"centerLat\":null,\"centerLng\":null}"))
                .andExpect(status().isBadRequest());

        verify(segments, never()).createSegment(any(), any());
    }

    private String token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("7").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", 1L).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
