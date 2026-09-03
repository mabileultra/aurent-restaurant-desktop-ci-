package com.pos.restaurant.floor.repository;

import com.pos.restaurant.floor.entity.FloorTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FloorTableRepository extends JpaRepository<FloorTable, Integer> {

    @Query("select t from FloorTable t join fetch t.hall where t.hall.id = :hallId order by t.code")
    List<FloorTable> findByHallIdOrderByCodeAsc(@Param("hallId") Integer hallId);

    @Query("select t from FloorTable t join fetch t.hall where t.hall.id = :hallId and t.active = true order by t.code")
    List<FloorTable> findByHallIdAndActiveTrueOrderByCodeAsc(@Param("hallId") Integer hallId);

    @Query("select t from FloorTable t join fetch t.hall where t.id = :id and t.companyId = :companyId")
    Optional<FloorTable> findByIdAndCompanyId(@Param("id") Integer id, @Param("companyId") Integer companyId);

    int countByHallIdAndActiveTrue(Integer hallId);

    boolean existsByHallIdAndActiveTrue(Integer hallId);

    boolean existsByHallIdAndCodeIgnoreCaseAndActiveTrue(Integer hallId, String code);

    boolean existsByHallIdAndCodeIgnoreCaseAndActiveTrueAndIdNot(Integer hallId, String code, Integer id);

    @Query("""
        select t from FloorTable t join fetch t.hall h
        where t.companyId = :companyId and t.storeId = :storeId and t.active = true
        order by h.sortOrder asc, h.name asc, t.code asc
        """)
    List<FloorTable> findByCompanyIdAndStoreIdAndActiveTrueOrderByHallSortAndCode(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId
    );
}
