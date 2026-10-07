package com.wildx.wildx.model;

import com.wildx.wildx.type.PatrolStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class Patrol extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private PatrolRoute route;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private AppUser ranger;
    @Column(nullable = false)
    private LocalDate scheduledDate;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PatrolStatus status = PatrolStatus.PLANNED;
    private Instant startedAt;
    private Instant endedAt;
    @Column(nullable = false)
    private boolean gpsAvailable = true;
    private Instant lastContactAt;
}

