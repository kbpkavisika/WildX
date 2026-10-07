package com.wildx.wildx.model;

import com.wildx.wildx.type.AlertStatus;
import com.wildx.wildx.type.AlertType;
import com.wildx.wildx.type.Disposition;
import com.wildx.wildx.type.Severity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class Alert extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Park park;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertType type;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;
    @ManyToOne(fetch = FetchType.LAZY)
    private Device device;
    @ManyToOne(fetch = FetchType.LAZY)
    private Zone zone;
    private Double lat;
    private Double lng;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertStatus status;
    @Column(nullable = false)
    private Instant occurredAt;
    @Column(nullable = false)
    private Instant slaDueAt;
    @ManyToOne(fetch = FetchType.LAZY)
    private AppUser acknowledgedBy;
    private Instant acknowledgedAt;
    private Instant resolvedAt;
    @Enumerated(EnumType.STRING)
    private Disposition disposition;
}
