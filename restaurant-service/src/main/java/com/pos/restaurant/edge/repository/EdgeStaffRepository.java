package com.pos.restaurant.edge.repository;

import com.pos.restaurant.edge.entity.EdgeStaff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EdgeStaffRepository extends JpaRepository<EdgeStaff, UUID> {

    Optional<EdgeStaff> findByUsernameIgnoreCaseAndActiveTrue(String username);

    List<EdgeStaff> findByCompanyLoginCodeAndActiveTrueOrderByFullNameAsc(String companyLoginCode);

    List<EdgeStaff> findByCompanyIdOrderByFullNameAsc(Integer companyId);

    boolean existsByUsernameIgnoreCase(String username);

    long countByActiveTrue();
}
