package com.pos.catalog.repository;

import com.pos.catalog.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findByIdAndCompanyId(UUID id, Integer companyId);
}
