package com.wildx.wildx.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class Notification extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private AppUser user;
    @Column(nullable = false)
    private String title;
    @Column(nullable = false, length = 1000)
    private String body;
    private String link;
    private Instant readAt;
}
