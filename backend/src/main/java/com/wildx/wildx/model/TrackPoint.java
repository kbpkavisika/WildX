package com.wildx.wildx.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import com.wildx.wildx.type.WaypointType;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"patrol_id", "recorded_at"}))
public class TrackPoint extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patrol_id")
    private Patrol patrol;
    @Column(nullable = false)
    private double lat;
    @Column(nullable = false)
    private double lng;
    private Double accuracyM;
    @Column(nullable = false)
    private Instant recordedAt;
    @Column(name = "is_waypoint", nullable = false)
    private boolean waypoint;
    @Column(length = 1000)
    private String note;
    @Enumerated(EnumType.STRING)
    private WaypointType waypointType;
    @ManyToOne(fetch = FetchType.LAZY)
    private Sector sector;
}
