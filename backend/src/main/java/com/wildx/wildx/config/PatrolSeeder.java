package com.wildx.wildx.config;

import com.wildx.wildx.constant.PatrolConstants;
import com.wildx.wildx.model.AppUser;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.model.Patrol;
import com.wildx.wildx.model.PatrolRoute;
import com.wildx.wildx.model.Sector;
import com.wildx.wildx.model.TrackPoint;
import com.wildx.wildx.repository.AppUserRepository;
import com.wildx.wildx.repository.ParkRepository;
import com.wildx.wildx.repository.PatrolRepository;
import com.wildx.wildx.repository.PatrolRouteRepository;
import com.wildx.wildx.repository.SectorRepository;
import com.wildx.wildx.repository.TrackPointRepository;
import com.wildx.wildx.type.PatrolStatus;
import com.wildx.wildx.type.Role;
import com.wildx.wildx.util.GeoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class PatrolSeeder implements CommandLineRunner {

    private static final String TEST_PASSWORD = "password";
    private static final int TRACK_POINTS = 12;
    private static final Clock CLOCK = Clock.systemUTC();
    private static final String KATAGAMUWA_LOOP = line("[81.48,6.38],[81.51,6.375],[81.52,6.355],[81.49,6.345],[81.47,6.36]");
    private static final String PALATUPANA_COAST = line("[81.42,6.27],[81.44,6.275],[81.46,6.285],[81.48,6.29]");
    private static final String KUMBUKGAHA_RIVER = line("[81.40,6.31],[81.41,6.325],[81.43,6.34],[81.45,6.35]");

    private final ParkRepository parkRepository;
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SectorRepository sectorRepository;
    private final PatrolRouteRepository routeRepository;
    private final PatrolRepository patrolRepository;
    private final TrackPointRepository trackPointRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (patrolRepository.count() > 0) {
            return;
        }
        Park park = parkRepository.findAll().stream().findFirst().orElse(null);
        if (park == null) {
            return;
        }
        List<Sector> sectors = sectorRepository.saveAll(List.of(
                sector(park, "Kumbukgaha", 81.38, 6.33, 81.47, 6.40),
                sector(park, "Katagamuwa", 81.47, 6.33, 81.56, 6.40),
                sector(park, "Palatupana", 81.38, 6.26, 81.47, 6.33),
                sector(park, "Menik river", 81.47, 6.26, 81.56, 6.33)));
        PatrolRoute katagamuwa = route(park, "Katagamuwa loop", KATAGAMUWA_LOOP);
        PatrolRoute palatupana = route(park, "Palatupana coast", PALATUPANA_COAST);
        PatrolRoute kumbukgaha = route(park, "Kumbukgaha river trail", KUMBUKGAHA_RIVER);
        routeRepository.saveAll(List.of(katagamuwa, palatupana, kumbukgaha));

        String passwordHash = passwordEncoder.encode(TEST_PASSWORD);
        AppUser ranger = ranger(park, "Ranger", "ranger@wildx.lk", passwordHash);
        AppUser kasun = ranger(park, "K. Bandara", "kasun@wildx.lk", passwordHash);
        AppUser nimal = ranger(park, "N. Perera", "nimal@wildx.lk", passwordHash);
        AppUser saman = ranger(park, "S. Fernando", "saman@wildx.lk", passwordHash);

        Instant now = CLOCK.instant();
        LocalDate today = LocalDate.now(CLOCK.withZone(PatrolConstants.PARK_ZONE));
        List<TrackPoint> track = new ArrayList<>();
        Patrol live = patrol(katagamuwa, ranger, today, PatrolStatus.ACTIVE, now.minus(Duration.ofHours(2)), null);
        live.setLastContactAt(now.minus(Duration.ofMinutes(1)));
        Patrol offline = patrol(palatupana, kasun, today, PatrolStatus.ACTIVE, now.minus(Duration.ofHours(3)), null);
        offline.setLastContactAt(now.minus(Duration.ofMinutes(20)));
        List<Patrol> completed = List.of(
                finished(kumbukgaha, kasun, today.minusDays(1), now.minus(Duration.ofHours(28))),
                finished(katagamuwa, nimal, today.minusDays(2), now.minus(Duration.ofHours(52))),
                finished(palatupana, saman, today.minusDays(3), now.minus(Duration.ofHours(76))));
        List<Patrol> patrols = new ArrayList<>(List.of(live, offline,
                patrol(kumbukgaha, nimal, today, PatrolStatus.PLANNED, null, null),
                patrol(palatupana, ranger, today.plusDays(1), PatrolStatus.PLANNED, null, null),
                patrol(kumbukgaha, saman, today.minusDays(4), PatrolStatus.CANCELLED, null, null)));
        patrols.addAll(completed);
        patrolRepository.saveAll(patrols);

        track.addAll(track(live, katagamuwa, live.getStartedAt(), live.getLastContactAt(), sectors));
        track.addAll(track(offline, palatupana, offline.getStartedAt(), offline.getLastContactAt(), sectors));
        completed.forEach(patrol -> track.addAll(track(patrol, patrol.getRoute(), patrol.getStartedAt(), patrol.getEndedAt(), sectors)));
        trackPointRepository.saveAll(track);
        log.info("Seeded {} sectors, 3 routes, {} patrols and {} track points", sectors.size(), patrols.size(), track.size());
    }

    private AppUser ranger(Park park, String name, String email, String passwordHash) {
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() -> userRepository.save(AppUser.builder()
                .park(park)
                .name(name)
                .email(email)
                .passwordHash(passwordHash)
                .role(Role.RANGER)
                .active(true)
                .build()));
    }

    private Sector sector(Park park, String name, double west, double south, double east, double north) {
        Sector sector = new Sector();
        sector.setPark(park);
        sector.setName(name);
        sector.setPolygonGeojson("{\"type\":\"Polygon\",\"coordinates\":[[[%s,%s],[%s,%s],[%s,%s],[%s,%s],[%s,%s]]]}"
                .formatted(west, south, east, south, east, north, west, north, west, south));
        return sector;
    }

    private PatrolRoute route(Park park, String name, String pathGeojson) {
        PatrolRoute route = new PatrolRoute();
        route.setPark(park);
        route.setName(name);
        route.setPathGeojson(pathGeojson);
        return route;
    }

    private Patrol finished(PatrolRoute route, AppUser ranger, LocalDate date, Instant startedAt) {
        Instant endedAt = startedAt.plus(Duration.ofHours(4));
        Patrol patrol = patrol(route, ranger, date, PatrolStatus.COMPLETED, startedAt, endedAt);
        patrol.setLastContactAt(endedAt);
        return patrol;
    }

    private Patrol patrol(PatrolRoute route, AppUser ranger, LocalDate date, PatrolStatus status, Instant startedAt, Instant endedAt) {
        Patrol patrol = new Patrol();
        patrol.setRoute(route);
        patrol.setRanger(ranger);
        patrol.setScheduledDate(date);
        patrol.setStatus(status);
        patrol.setStartedAt(startedAt);
        patrol.setEndedAt(endedAt);
        return patrol;
    }

    private List<TrackPoint> track(Patrol patrol, PatrolRoute route, Instant from, Instant to, List<Sector> sectors) {
        List<GeoUtil.Point> path = GeoUtil.line(route.getPathGeojson());
        Duration step = Duration.between(from, to).dividedBy(TRACK_POINTS - 1);
        List<TrackPoint> points = new ArrayList<>();
        for (int i = 0; i < TRACK_POINTS; i++) {
            double position = (double) i / (TRACK_POINTS - 1) * (path.size() - 1);
            int segment = Math.min((int) position, path.size() - 2);
            double fraction = position - segment;
            GeoUtil.Point a = path.get(segment);
            GeoUtil.Point b = path.get(segment + 1);
            double lat = a.lat() + (b.lat() - a.lat()) * fraction;
            double lng = a.lng() + (b.lng() - a.lng()) * fraction;
            TrackPoint point = new TrackPoint();
            point.setPatrol(patrol);
            point.setLat(lat);
            point.setLng(lng);
            point.setRecordedAt(from.plus(step.multipliedBy(i)));
            point.setSector(sectors.stream().filter(sector -> GeoUtil.contains(sector.getPolygonGeojson(), lat, lng))
                    .findFirst().orElse(null));
            points.add(point);
        }
        return points;
    }

    private static String line(String coordinates) {
        return "{\"type\":\"LineString\",\"coordinates\":[" + coordinates + "]}";
    }
}
