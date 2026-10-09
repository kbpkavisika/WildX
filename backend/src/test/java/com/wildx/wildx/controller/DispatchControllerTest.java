package com.wildx.wildx.controller;

import com.wildx.wildx.config.SecurityConfig;
import com.wildx.wildx.dto.*;
import com.wildx.wildx.service.AuthService;
import com.wildx.wildx.service.DispatchService;
import com.wildx.wildx.type.DispatchStatus;
import com.wildx.wildx.type.Role;
import com.wildx.wildx.type.SourceType;
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
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DispatchController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "wildx.jwt-secret=test-secret-test-secret-test-secret-123")
class DispatchControllerTest {

    @Autowired MockMvc mvc;
    @Autowired JwtEncoder encoder;
    @MockitoBean AuthService auth;
    @MockitoBean DispatchService dispatches;

    @Test
    void cloGetsRespondersSortedByDistance() throws Exception {
        UserResponse clo = new UserResponse(4L, "CLO User", "clo@wildx.lk", Role.CLO, 1L);
        when(auth.current(any())).thenReturn(clo);

        var r1 = new ResponderResponse(102L, "Ranger Two", "+94772222222", 6.3155, 81.4105, 50.0, false, Instant.now());
        var r2 = new ResponderResponse(101L, "Ranger One", "+94771111111", 6.3200, 81.4150, 450.0, false, Instant.now());

        when(dispatches.getResponders(1L, 6.3150, 81.4100)).thenReturn(List.of(r1, r2));

        mvc.perform(get("/api/v1/responders?lat=6.3150&lng=81.4100")
                        .header("Authorization", token("CLO", 1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(102))
                .andExpect(jsonPath("$[0].distanceM").value(50.0))
                .andExpect(jsonPath("$[1].id").value(101));

        verify(dispatches).getResponders(1L, 6.3150, 81.4100);
    }

    @Test
    void respondersForAnotherParkAreDenied() throws Exception {
        doThrow(new AccessDeniedException("Access denied")).when(auth).requireParkAccess(any(), eq(2L));

        mvc.perform(get("/api/v1/responders?parkId=2")
                        .header("Authorization", token("CLO", 1L)))
                .andExpect(status().isForbidden());

        verify(dispatches, never()).getResponders(any(), any(), any());
    }

    @Test
    void cloCreatesDispatch() throws Exception {
        UserResponse clo = new UserResponse(4L, "CLO User", "clo@wildx.lk", Role.CLO, 1L);
        when(auth.current(any())).thenReturn(clo);

        var dispatchResponse = new DispatchResponse(
                99L,
                SourceType.COMMUNITY_REPORT,
                50L,
                101L,
                "Ranger One",
                4L,
                "CLO User",
                DispatchStatus.ASSIGNED,
                Instant.now(),
                null,
                null,
                null,
                "Urgent response"
        );

        when(dispatches.createDispatch(eq(clo), any(DispatchCreateRequest.class))).thenReturn(dispatchResponse);

        String json = """
                {
                    "sourceType": "COMMUNITY_REPORT",
                    "sourceId": 50,
                    "responderId": 101,
                    "note": "Urgent response"
                }
                """;

        mvc.perform(post("/api/v1/dispatches")
                        .header("Authorization", token("CLO", 1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(99))
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.sourceType").value("COMMUNITY_REPORT"));

        verify(dispatches).createDispatch(eq(clo), any(DispatchCreateRequest.class));
    }

    @Test
    void rangerViewsMyDispatches() throws Exception {
        UserResponse ranger = new UserResponse(101L, "Ranger One", "ranger@wildx.lk", Role.RANGER, 1L);
        when(auth.current(any())).thenReturn(ranger);

        var dispatchResponse = new DispatchResponse(
                99L,
                SourceType.COMMUNITY_REPORT,
                50L,
                101L,
                "Ranger One",
                4L,
                "CLO User",
                DispatchStatus.ASSIGNED,
                Instant.now(),
                null,
                null,
                null,
                "Urgent response"
        );

        when(dispatches.getMyDispatches(101L)).thenReturn(List.of(dispatchResponse));

        mvc.perform(get("/api/v1/me/dispatches")
                        .header("Authorization", token("RANGER", 1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(99))
                .andExpect(jsonPath("$[0].responderName").value("Ranger One"));

        verify(dispatches).getMyDispatches(101L);
    }

    @Test
    void rangerAcknowledgesDispatch() throws Exception {
        UserResponse ranger = new UserResponse(101L, "Ranger One", "ranger@wildx.lk", Role.RANGER, 1L);
        when(auth.current(any())).thenReturn(ranger);

        var acknowledged = new DispatchResponse(
                99L,
                SourceType.COMMUNITY_REPORT,
                50L,
                101L,
                "Ranger One",
                4L,
                "CLO User",
                DispatchStatus.ACKNOWLEDGED,
                Instant.now(),
                Instant.now(),
                null,
                null,
                "Urgent response"
        );

        when(dispatches.acknowledgeDispatch(eq(ranger), eq(99L))).thenReturn(acknowledged);

        mvc.perform(post("/api/v1/dispatches/99/acknowledge")
                        .header("Authorization", token("RANGER", 1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACKNOWLEDGED"));

        verify(dispatches).acknowledgeDispatch(eq(ranger), eq(99L));
    }

    @Test
    void rangerCompletesDispatch() throws Exception {
        UserResponse ranger = new UserResponse(101L, "Ranger One", "ranger@wildx.lk", Role.RANGER, 1L);
        when(auth.current(any())).thenReturn(ranger);

        var completed = new DispatchResponse(
                99L,
                SourceType.COMMUNITY_REPORT,
                50L,
                101L,
                "Ranger One",
                4L,
                "CLO User",
                DispatchStatus.COMPLETED,
                Instant.now(),
                Instant.now(),
                Instant.now(),
                "Conflict averted, elephants guided back",
                "Urgent response"
        );

        when(dispatches.completeDispatch(eq(ranger), eq(99L), any(DispatchCompleteRequest.class))).thenReturn(completed);

        String json = """
                {
                    "outcome": "Conflict averted, elephants guided back"
                }
                """;

        mvc.perform(post("/api/v1/dispatches/99/complete")
                        .header("Authorization", token("RANGER", 1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.outcome").value("Conflict averted, elephants guided back"));

        verify(dispatches).completeDispatch(eq(ranger), eq(99L), eq(new DispatchCompleteRequest("Conflict averted, elephants guided back")));
    }

    @Test
    void rangerDeclinesDispatch() throws Exception {
        UserResponse ranger = new UserResponse(101L, "Ranger One", "ranger@wildx.lk", Role.RANGER, 1L);
        when(auth.current(any())).thenReturn(ranger);

        var declined = new DispatchResponse(
                99L,
                SourceType.COMMUNITY_REPORT,
                50L,
                101L,
                "Ranger One",
                4L,
                "CLO User",
                DispatchStatus.DECLINED,
                Instant.now(),
                null,
                null,
                null,
                "Vehicle breakdown"
        );

        when(dispatches.declineDispatch(eq(ranger), eq(99L), any(DispatchDeclineRequest.class))).thenReturn(declined);

        String json = """
                {
                    "reason": "Vehicle breakdown"
                }
                """;

        mvc.perform(post("/api/v1/dispatches/99/decline")
                        .header("Authorization", token("RANGER", 1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DECLINED"));

        verify(dispatches).declineDispatch(eq(ranger), eq(99L), eq(new DispatchDeclineRequest("Vehicle breakdown")));
    }

    private String token(String role, Long parkId) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("4").issuedAt(now).expiresAt(now.plusSeconds(60))
                .claim("role", role).claim("parkId", parkId).build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
