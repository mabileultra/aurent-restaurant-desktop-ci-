package com.pos.repository;

import com.pos.entity.ReferenceBookEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReferenceBookEntryRepository extends JpaRepository<ReferenceBookEntry, Integer> {

    List<ReferenceBookEntry> findByReferenceBook_IdOrderBySortOrderAscIdAsc(Integer referenceBookId);
}
