package com.wildx.wildx.model;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(uniqueConstraints = @UniqueConstraint(name = "uk_boundary_segment_park_code", columnNames = {"park_id", "code"}))
public class BoundarySegment extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Park park;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false)
    private Double centerLat;

    @Column(nullable = false)
    private Double centerLng;
}
