package com.wildx.wildx.model;

import com.wildx.wildx.type.ZoneType;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class Zone extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Park park;
    @Column(nullable = false)
    private String name;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ZoneType type;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String polygonGeojson;
}
