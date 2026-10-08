package com.wildx.wildx.model;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class AuditLog extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private AppUser user;
    @Column(nullable = false)
    private String action;
    @Column(nullable = false)
    private String entity;
    @Column(nullable = false)
    private Long entityId;
    @Column(nullable = false, length = 500)
    private String reason;
}
