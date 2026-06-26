package com.pos.restaurant.repository;

import com.pos.restaurant.entity.DiningTable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiningTableRepository extends JpaRepository<DiningTable, Integer> {

    @EntityGraph(attributePaths = {"hall", "hall.store"})
    Optional<DiningTable> findWithHallById(Integer id);

    List<DiningTable> findByHallIdAndActiveTrueOrderByCodeAsc(Integer hallId);

    List<DiningTable> findByHallIdOrderByCodeAsc(Integer hallId);

    Optional<DiningTable> findByIdAndHallId(Integer id, Integer hallId);

    boolean existsByHallIdAndCodeIgnoreCase(Integer hallId, String code);

    boolean existsByHallIdAndCodeIgnoreCaseAndIdNot(Integer hallId, String code, Integer id);
}
