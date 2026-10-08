package com.wildx.wildx.model;

import com.wildx.wildx.type.IncidentStatus;
import com.wildx.wildx.type.LocationSource;
import com.wildx.wildx.type.Severity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class Incident extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Park park;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private IncidentType type;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private AppUser reporter;
    @Column(nullable = false)
    private Double lat;
    @Column(nullable = false)
    private Double lng;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LocationSource locationSource;
    @ManyToOne(fetch = FetchType.LAZY)
    private Sector sector;
    @Column(length = 500)
    private String description;
    private String photoPath;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentStatus status;
    @Column(nullable = false)
    private Instant occurredAt;
}
