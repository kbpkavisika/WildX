package com.wildx.wildx.repository;

import com.wildx.wildx.model.Auditable;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
@RequiredArgsConstructor
public class SeedHistoryRepository {
    private final EntityManager entities;

    public <T extends Auditable> void backdate(Class<T> type, Long id, Instant createdAt, Instant modifiedAt) {
        entities.flush();
        var builder = entities.getCriteriaBuilder();
        var update = builder.createCriteriaUpdate(type);
        var root = update.from(type);
        update.set(root.get("createdAt"), createdAt);
        update.set(root.get("modifiedAt"), modifiedAt);
        update.where(builder.equal(root.get("id"), id));
        entities.createQuery(update).executeUpdate();
        entities.refresh(entities.getReference(type, id));
    }
}
