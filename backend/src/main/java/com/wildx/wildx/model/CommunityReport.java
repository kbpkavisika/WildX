package com.wildx.wildx.model;

import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.type.ReportChannel;
import com.wildx.wildx.type.ReportType;
import com.wildx.wildx.type.Severity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "community_report")
public class CommunityReport extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String referenceCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Park park;

    @ManyToOne(fetch = FetchType.LAZY)
    private BoundarySegment segment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportChannel channel;

    @Column(length = 50)
    private String reporterPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportType type;

    @Column(nullable = false)
    private int animalCount = 1;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String photoPath;

    private Double lat;

    private Double lng;

    @Column(columnDefinition = "TEXT")
    private String rawText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommunityReportStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    private CommunityReport duplicateOf;

    @Enumerated(EnumType.STRING)
    private Severity severity;

    @Column(columnDefinition = "TEXT")
    private String invalidReason;

    @Column(columnDefinition = "TEXT")
    private String outcome;

    private Instant closedAt;
}
