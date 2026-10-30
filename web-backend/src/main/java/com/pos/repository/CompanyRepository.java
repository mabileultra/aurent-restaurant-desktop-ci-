package com.pos.repository;

import com.pos.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Integer>, JpaSpecificationExecutor<Company> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Integer id);

    Optional<Company> findByLoginCodeIgnoreCase(String loginCode);

    boolean existsByLoginCodeIgnoreCase(String loginCode);

    boolean existsByLoginCodeIgnoreCaseAndIdNot(String loginCode, Integer id);

    List<Company> findByActiveTrueOrderByNameAsc();

    @Query("""
        select distinct c.id from Company c
        where (:regionCode is null or c.regionCode = :regionCode)
          and (:districtCode is null or c.districtCode = :districtCode)
        """)
    List<Integer> findIdsByGeo(
        @Param("regionCode") String regionCode,
        @Param("districtCode") String districtCode
    );

    @Query("""
        select distinct c.id from Company c
        where (:regionCode is null or c.regionCode = :regionCode)
          and (:districtCode is null or c.districtCode = :districtCode)
          and (
            upper(c.businessType) in :typeCodes
            or exists (
              select 1 from CompanyBusinessType link
              where link.companyId = c.id
                and upper(link.businessType.code) in :typeCodes
            )
          )
        """)
    List<Integer> findIdsByTypeAndGeo(
        @Param("typeCodes") Collection<String> typeCodes,
        @Param("regionCode") String regionCode,
        @Param("districtCode") String districtCode
    );

    @Query("""
        select c.id from Company c
        where lower(c.name) like :pattern
           or lower(c.loginCode) like :pattern
        """)
    List<Integer> findIdsByNameOrLogin(@Param("pattern") String pattern);
}
