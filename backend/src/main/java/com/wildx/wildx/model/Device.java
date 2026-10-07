package com.wildx.wildx.model;

import com.wildx.wildx.type.DeviceType;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class Device extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Park park;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceType type;
    @Column(nullable = false, unique = true)
    private String code;
    @ManyToOne(fetch = FetchType.LAZY)
    private Animal animal;
    private Double lat;
    private Double lng;
    @Column(nullable = false)
    private int expectedIntervalMin;
}
