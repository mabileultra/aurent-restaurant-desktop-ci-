package com.pos.restaurant.modifier.repository;

import com.pos.restaurant.modifier.entity.ModifierOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ModifierOptionRepository extends JpaRepository<ModifierOption, UUID> {

    List<ModifierOption> findByGroupIdOrderBySortOrderAscNameAsc(UUID groupId);

    @Query("""
        select o from ModifierOption o
        join fetch o.group
        where o.id in :ids and o.active = true
        """)
    List<ModifierOption> findActiveByIdIn(@Param("ids") Collection<UUID> ids);

    List<ModifierOption> findByGroupIdInAndActiveTrueOrderBySortOrderAscNameAsc(Collection<UUID> groupIds);
}
