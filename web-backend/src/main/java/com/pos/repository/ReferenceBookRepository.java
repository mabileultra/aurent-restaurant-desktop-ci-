package com.pos.repository;

import com.pos.entity.ReferenceBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ReferenceBookRepository extends JpaRepository<ReferenceBook, Integer> {

    List<ReferenceBook> findAllByOrderByNameAsc();

    Optional<ReferenceBook> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Integer id);

    @Query("""
        SELECT DISTINCT rb FROM ReferenceBook rb
        LEFT JOIN FETCH rb.entries
        WHERE rb.id = :id
        """)
    Optional<ReferenceBook> findDetailedById(Integer id);
}
