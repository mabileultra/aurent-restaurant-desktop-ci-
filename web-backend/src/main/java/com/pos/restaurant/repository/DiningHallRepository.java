package com.pos.restaurant.repository;

import com.pos.restaurant.entity.DiningHall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiningHallRepository extends JpaRepository<DiningHall, Integer> {

    List<DiningHall> findByStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(Integer storeId);

    List<DiningHall> findByStoreIdOrderBySortOrderAscNameAsc(Integer storeId);

    Optional<DiningHall> findByIdAndStoreId(Integer id, Integer storeId);

    boolean existsByStoreIdAndNameIgnoreCase(Integer storeId, String name);

    boolean existsByStoreIdAndNameIgnoreCaseAndIdNot(Integer storeId, String name, Integer id);
}
