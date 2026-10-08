package com.wildx.wildx.model;

import com.wildx.wildx.type.CameraImageStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"device_id", "captured_at"}))
public class CameraImage extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Device device;
    @Column(nullable = false)
    private String filePath;
    @Column(nullable = false)
    private Instant capturedAt;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CameraImageStatus status;
    private String species;
    private Integer animalCount;
    @ManyToOne(fetch = FetchType.LAZY)
    private AppUser reviewedBy;
    private Instant reviewedAt;
}
