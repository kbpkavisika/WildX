package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.*;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.model.Dispatch;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.repository.AlertRepository;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.repository.CommunityReportRepository;
import com.wildx.wildx.repository.DispatchRepository;
import com.wildx.wildx.service.AlertService;
import com.wildx.wildx.service.NotificationService;
import com.wildx.wildx.service.PatrolMonitorService;
import com.wildx.wildx.service.SmsService;
import com.wildx.wildx.type.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DispatchServiceImplTest {

    @Mock DispatchRepository dispatchRepository;
    @Mock AppUserRepository appUserRepository;
    @Mock CommunityReportRepository communityReportRepository;
    @Mock AlertRepository alertRepository;
    @Mock AlertService alertService;
    @Mock PatrolMonitorService patrolMonitorService;
    @Mock NotificationService notificationService;
    @Mock SmsService smsService;

    Clock clock;
    DispatchServiceImpl service;
    Park park;
    AppUser ranger1;
    AppUser ranger2;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(Instant.parse("2026-10-07T12:00:00Z"), ZoneId.of("UTC"));
        service = new DispatchServiceImpl(
                dispatchRepository,
                appUserRepository,
                communityReportRepository,
                alertRepository,
                alertService,
                patrolMonitorService,
                notificationService,
                smsService,
                clock
        );

        park = new Park();
        park.setId(1L);
        park.setCode("YALA");

        ranger1 = new AppUser();
        ranger1.setId(101L);
        ranger1.setName("Ranger One");
        ranger1.setRole(Role.RANGER);
        ranger1.setPark(park);
        ranger1.setActive(true);
        ranger1.setPhone("+94771111111");

        ranger2 = new AppUser();
        ranger2.setId(102L);
        ranger2.setName("Ranger Two");
        ranger2.setRole(Role.RANGER);
        ranger2.setPark(park);
        ranger2.setActive(true);
        ranger2.setPhone("+94772222222");
    }

    @Test
    void getRespondersReturnsLiveRangersSortedByDistanceToSegment() {
        PatrolRouteResponse route = new PatrolRouteResponse(1L, 1L, "Route 1", "{\"type\":\"LineString\",\"coordinates\":[[81.4,6.3],[81.41,6.31]]}");
        PatrolResponse p1 = new PatrolResponse(10L, route, 101L, "Ranger One", LocalDate.now(), PatrolStatus.ACTIVE, Instant.now(), null, true);
        TrackPointResponse tp1 = new TrackPointResponse(1L, 6.320, 81.415, 5.0, Instant.now(), false, null, null, null);
        PatrolLiveResponse live1 = new PatrolLiveResponse(p1, tp1, Instant.now(), false);

        PatrolResponse p2 = new PatrolResponse(20L, route, 102L, "Ranger Two", LocalDate.now(), PatrolStatus.ACTIVE, Instant.now(), null, true);
        TrackPointResponse tp2 = new TrackPointResponse(2L, 6.3155, 81.4105, 5.0, Instant.now(), false, null, null, null);
        PatrolLiveResponse live2 = new PatrolLiveResponse(p2, tp2, Instant.now(), false);

        when(patrolMonitorService.live(1L)).thenReturn(List.of(live1, live2));
        when(appUserRepository.findById(101L)).thenReturn(Optional.of(ranger1));
        when(appUserRepository.findById(102L)).thenReturn(Optional.of(ranger2));

        List<ResponderResponse> responders = service.getResponders(1L, 6.3150, 81.4100);
        assertThat(responders).hasSize(2);
        assertThat(responders.get(0).id()).isEqualTo(102L);
        assertThat(responders.get(1).id()).isEqualTo(101L);
        assertThat(responders.get(0).distanceM()).isLessThan(responders.get(1).distanceM());
    }

    @Test
    void createDispatchForCommunityReportUpdatesReportToDispatchedAndNotifiesResponder() {
        CommunityReport report = new CommunityReport();
        report.setId(50L);
        report.setPark(park);
        report.setReferenceCode("R-1042");
        report.setStatus(CommunityReportStatus.VALIDATED);
        report.setSeverity(Severity.HIGH);

        when(appUserRepository.findById(101L)).thenReturn(Optional.of(ranger1));
        when(appUserRepository.findById(4L)).thenReturn(Optional.empty());
        when(communityReportRepository.findById(50L)).thenReturn(Optional.of(report));
        when(dispatchRepository.save(any(Dispatch.class))).thenAnswer(invocation -> {
            Dispatch d = invocation.getArgument(0);
            d.setId(99L);
            return d;
        });

        UserResponse clo = new UserResponse(4L, "CLO User", "clo@wildx.lk", Role.CLO, 1L);
        DispatchCreateRequest request = new DispatchCreateRequest(SourceType.COMMUNITY_REPORT, 50L, 101L, "Urgent response needed");

        DispatchResponse response = service.createDispatch(clo, request);

        assertThat(response.id()).isEqualTo(99L);
        assertThat(response.status()).isEqualTo(DispatchStatus.ASSIGNED);
        assertThat(report.getStatus()).isEqualTo(CommunityReportStatus.DISPATCHED);

        verify(notificationService).notifyUsers(eq(List.of(101L)), eq("New dispatch"), anyString(), eq("/ranger/tasks"));
        verify(smsService).sendSms(eq("+94771111111"), contains("WildX Dispatch:"));
    }

    @Test
    void completeDispatchClosesCommunityReportAndSendsOutcomeSmsToVillager() {
        CommunityReport report = new CommunityReport();
        report.setId(50L);
        report.setPark(park);
        report.setReferenceCode("R-1042");
        report.setChannel(ReportChannel.SMS);
        report.setReporterPhone("+94779998888");
        report.setStatus(CommunityReportStatus.DISPATCHED);

        Dispatch dispatch = new Dispatch();
        dispatch.setId(99L);
        dispatch.setSourceType(SourceType.COMMUNITY_REPORT);
        dispatch.setSourceId(50L);
        dispatch.setResponder(ranger1);
        dispatch.setStatus(DispatchStatus.ACKNOWLEDGED);

        when(dispatchRepository.findWithDetailsById(99L)).thenReturn(Optional.of(dispatch));
        when(dispatchRepository.save(any(Dispatch.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(communityReportRepository.findById(50L)).thenReturn(Optional.of(report));

        UserResponse caller = new UserResponse(101L, "Ranger One", "ranger@wildx.lk", Role.RANGER, 1L);
        DispatchCompleteRequest request = new DispatchCompleteRequest("Elephant herd guided back into park sanctuary safely");

        DispatchResponse response = service.completeDispatch(caller, 99L, request);

        assertThat(response.status()).isEqualTo(DispatchStatus.COMPLETED);
        assertThat(response.outcome()).isEqualTo("Elephant herd guided back into park sanctuary safely");
        assertThat(report.getStatus()).isEqualTo(CommunityReportStatus.CLOSED);
        assertThat(report.getOutcome()).isEqualTo("Elephant herd guided back into park sanctuary safely");
        assertThat(report.getClosedAt()).isEqualTo(clock.instant());

        verify(smsService).sendSms("+94779998888", "WildX: Report R-1042 resolved. Elephant herd guided back into park sanctuary safely");
    }

    @Test
    void acknowledgeDispatchSetsStatusToAcknowledged() {
        Dispatch dispatch = new Dispatch();
        dispatch.setId(99L);
        dispatch.setSourceType(SourceType.COMMUNITY_REPORT);
        dispatch.setSourceId(50L);
        dispatch.setResponder(ranger1);
        dispatch.setStatus(DispatchStatus.ASSIGNED);

        when(dispatchRepository.findWithDetailsById(99L)).thenReturn(Optional.of(dispatch));
        when(dispatchRepository.save(any(Dispatch.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse caller = new UserResponse(101L, "Ranger One", "ranger@wildx.lk", Role.RANGER, 1L);
        DispatchResponse response = service.acknowledgeDispatch(caller, 99L);

        assertThat(response.status()).isEqualTo(DispatchStatus.ACKNOWLEDGED);
        assertThat(dispatch.getAcknowledgedAt()).isEqualTo(clock.instant());
    }

    @Test
    void declineDispatchRevertsCommunityReportToValidated() {
        CommunityReport report = new CommunityReport();
        report.setId(50L);
        report.setPark(park);
        report.setReferenceCode("R-1042");
        report.setStatus(CommunityReportStatus.DISPATCHED);

        Dispatch dispatch = new Dispatch();
        dispatch.setId(99L);
        dispatch.setSourceType(SourceType.COMMUNITY_REPORT);
        dispatch.setSourceId(50L);
        dispatch.setResponder(ranger1);
        dispatch.setStatus(DispatchStatus.ASSIGNED);

        when(dispatchRepository.findWithDetailsById(99L)).thenReturn(Optional.of(dispatch));
        when(dispatchRepository.save(any(Dispatch.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(communityReportRepository.findById(50L)).thenReturn(Optional.of(report));

        UserResponse caller = new UserResponse(101L, "Ranger One", "ranger@wildx.lk", Role.RANGER, 1L);
        DispatchDeclineRequest request = new DispatchDeclineRequest("Vehicle broken down, cannot respond");
        DispatchResponse response = service.declineDispatch(caller, 99L, request);

        assertThat(response.status()).isEqualTo(DispatchStatus.DECLINED);
        assertThat(dispatch.getNote()).isEqualTo("Vehicle broken down, cannot respond");
        assertThat(report.getStatus()).isEqualTo(CommunityReportStatus.VALIDATED);
    }

    @Test
    void cannotActOnAnotherRangersDispatch() {
        Dispatch dispatch = new Dispatch();
        dispatch.setId(99L);
        dispatch.setResponder(ranger1);
        dispatch.setStatus(DispatchStatus.ASSIGNED);

        when(dispatchRepository.findWithDetailsById(99L)).thenReturn(Optional.of(dispatch));

        UserResponse otherRanger = new UserResponse(102L, "Ranger Two", "ranger2@wildx.lk", Role.RANGER, 1L);

        assertThatThrownBy(() -> service.acknowledgeDispatch(otherRanger, 99L))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> service.completeDispatch(otherRanger, 99L, new DispatchCompleteRequest("Outcome")))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> service.declineDispatch(otherRanger, 99L, new DispatchDeclineRequest("Reason")))
                .isInstanceOf(AccessDeniedException.class);
    }
}
