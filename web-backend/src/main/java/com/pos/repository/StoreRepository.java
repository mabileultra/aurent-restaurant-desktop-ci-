package com.pos.repository;

import com.pos.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Integer>, JpaSpecificationExecutor<Store> {

    @Query("SELECT s FROM Store s LEFT JOIN FETCH s.company WHERE s.id = :id")
    Optional<Store> findByIdWithCompany(@Param("id") Integer id);

    List<Store> findByCompanyIdOrderByNameAsc(Integer companyId);

    List<Store> findByActiveTrueAndCompanyIsNotNullOrderByNameAsc();

    List<Store> findByActiveTrueAndBusinessTypeIgnoreCaseOrderByNameAsc(String businessType);

    long countByCompanyId(Integer companyId);

    long countByCompanyIdAndActiveTrue(Integer companyId);

    @Query("select s.company.id, count(s) from Store s where s.company.id in :companyIds group by s.company.id")
    List<Object[]> countGroupedByCompanyId(@Param("companyIds") List<Integer> companyIds);

    @Query("select s.id from Store s where lower(s.name) like :pattern")
    List<Integer> findIdsByNameLike(@Param("pattern") String pattern);

    @Query("""
        select count(s) from Store s
        where (:companyId is null or s.company.id = :companyId)
        """)
    long countScoped(@Param("companyId") Integer companyId);

    @Query("""
        select count(s) from Store s
        where s.active = true
          and (:companyId is null or s.company.id = :companyId)
        """)
    long countActiveScoped(@Param("companyId") Integer companyId);

    @Query("""
        select count(distinct s.company.id) from Store s
        where s.company is not null
          and (:companyId is null or s.company.id = :companyId)
        """)
    long countCompaniesScoped(@Param("companyId") Integer companyId);
}
