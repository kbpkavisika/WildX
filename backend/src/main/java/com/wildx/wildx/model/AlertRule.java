package com.wildx.wildx.model;

import com.wildx.wildx.type.Severity;
import com.wildx.wildx.type.ZoneType;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"park_id", "zone_type"}))
public class AlertRule extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Park park;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ZoneType zoneType;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;
    @Column(nullable = false)
    private int cooldownMin;
    @Column(nullable = false)
    private int ackSlaMin;
}
