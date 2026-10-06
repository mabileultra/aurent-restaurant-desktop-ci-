package com.pos.reporting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pos.reporting.entity.SaleFact;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Кросс-компанийные агрегаты для супер-админ аналитики.
 */
public interface PlatformAnalyticsOverviewRepository extends JpaRepository<SaleFact, UUID> {

    @Query(value = """
        SELECT
          COALESCE(SUM(s.total_amount), 0),
          CAST(COUNT(*) AS bigint),
          COALESCE(SUM(s.returned_amount), 0),
          COALESCE(SUM(s.items_sold), 0),
          CAST(COUNT(DISTINCT s.store_id) AS bigint),
          COALESCE(SUM(s.cash_amount), 0),
          COALESCE(SUM(s.card_amount), 0)
        FROM sale_facts s
        WHERE s.transaction_date BETWEEN :from AND :to
          AND s.sale_status IN ('COMPLETED', 'REFUNDED')
        """, nativeQuery = true)
    Object[] saleTotals(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
        SELECT
          COALESCE(SUM(i.revenue), 0),
          COALESCE(SUM(i.cost_estimate), 0),
          COALESCE(SUM(i.quantity - i.quantity_returned), 0)
        FROM sale_item_facts i
        WHERE i.transaction_date BETWEEN :from AND :to
        """, nativeQuery = true)
    Object[] itemTotals(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
        SELECT s.transaction_date,
               COALESCE(SUM(s.total_amount), 0),
               CAST(COUNT(*) AS bigint),
               COALESCE(SUM(s.returned_amount), 0)
        FROM sale_facts s
        WHERE s.transaction_date BETWEEN :from AND :to
          AND s.sale_status IN ('COMPLETED', 'REFUNDED')
        GROUP BY s.transaction_date
        ORDER BY s.transaction_date
        """, nativeQuery = true)
    List<Object[]> dailySales(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
        SELECT i.transaction_date,
               COALESCE(SUM(i.revenue - i.cost_estimate), 0)
        FROM sale_item_facts i
        WHERE i.transaction_date BETWEEN :from AND :to
        GROUP BY i.transaction_date
        ORDER BY i.transaction_date
        """, nativeQuery = true)
    List<Object[]> dailyProfit(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
        SELECT COALESCE(MAX(s.store_name), CONCAT('Store #', s.store_id)),
               COALESCE(SUM(s.total_amount), 0)
        FROM sale_facts s
        WHERE s.transaction_date BETWEEN :from AND :to
          AND s.sale_status IN ('COMPLETED', 'REFUNDED')
          AND s.store_id IS NOT NULL
        GROUP BY s.store_id
        ORDER BY SUM(s.total_amount) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> topStores(@Param("from") LocalDate from, @Param("to") LocalDate to, @Param("limit") int limit);

    @Query(value = """
        SELECT COALESCE(SUM(s.total_amount), 0)
        FROM sale_facts s
        WHERE s.transaction_date BETWEEN :from AND :to
          AND s.sale_status IN ('COMPLETED', 'REFUNDED')
          AND s.store_id IS NOT NULL
          AND COALESCE(s.store_name, CONCAT('Store #', s.store_id)) = :storeName
        """, nativeQuery = true)
    Object storeTurnoverByName(
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeName") String storeName
    );

    @Query(value = """
        SELECT i.product_name,
               COALESCE(SUM(i.quantity - i.quantity_returned), 0)
        FROM sale_item_facts i
        WHERE i.transaction_date BETWEEN :from AND :to
        GROUP BY i.product_name
        HAVING COALESCE(SUM(i.quantity - i.quantity_returned), 0) > 0
        ORDER BY SUM(i.quantity - i.quantity_returned) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> topProductsByQty(@Param("from") LocalDate from, @Param("to") LocalDate to, @Param("limit") int limit);

    @Query(value = """
        SELECT i.product_name,
               COALESCE(SUM(i.revenue - i.cost_estimate), 0)
        FROM sale_item_facts i
        WHERE i.transaction_date BETWEEN :from AND :to
        GROUP BY i.product_name
        HAVING COALESCE(SUM(i.revenue - i.cost_estimate), 0) <> 0
        ORDER BY SUM(i.revenue - i.cost_estimate) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> topProductsByProfit(@Param("from") LocalDate from, @Param("to") LocalDate to, @Param("limit") int limit);

    @Query(value = """
        SELECT CAST(EXTRACT(ISODOW FROM s.transaction_date) AS int),
               COALESCE(SUM(s.total_amount), 0)
        FROM sale_facts s
        WHERE s.transaction_date BETWEEN :from AND :to
          AND s.sale_status IN ('COMPLETED', 'REFUNDED')
        GROUP BY EXTRACT(ISODOW FROM s.transaction_date)
        ORDER BY 1
        """, nativeQuery = true)
    List<Object[]> weekdaySales(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
        SELECT COALESCE(MAX(s.store_name), CONCAT('Store #', s.store_id)),
               COALESCE(SUM(CASE WHEN s.transaction_date BETWEEN :curFrom AND :curTo THEN s.total_amount ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN s.transaction_date BETWEEN :prevFrom AND :prevTo THEN s.total_amount ELSE 0 END), 0)
        FROM sale_facts s
        WHERE s.transaction_date BETWEEN :prevFrom AND :curTo
          AND s.sale_status IN ('COMPLETED', 'REFUNDED')
          AND s.store_id IS NOT NULL
        GROUP BY s.store_id
        HAVING COALESCE(SUM(CASE WHEN s.transaction_date BETWEEN :prevFrom AND :prevTo THEN s.total_amount ELSE 0 END), 0) > 0
        ORDER BY
          (COALESCE(SUM(CASE WHEN s.transaction_date BETWEEN :curFrom AND :curTo THEN s.total_amount ELSE 0 END), 0)
           - COALESCE(SUM(CASE WHEN s.transaction_date BETWEEN :prevFrom AND :prevTo THEN s.total_amount ELSE 0 END), 0))
          / NULLIF(COALESCE(SUM(CASE WHEN s.transaction_date BETWEEN :prevFrom AND :prevTo THEN s.total_amount ELSE 0 END), 0), 0)
          ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> storeDrops(
        @Param("curFrom") LocalDate curFrom,
        @Param("curTo") LocalDate curTo,
        @Param("prevFrom") LocalDate prevFrom,
        @Param("prevTo") LocalDate prevTo,
        @Param("limit") int limit
    );

    @Query(value = """
        SELECT s.store_id,
               COALESCE(MAX(s.store_name), CONCAT('Store #', s.store_id)),
               COALESCE(SUM(s.total_amount), 0),
               CAST(COUNT(*) AS bigint)
        FROM sale_facts s
        WHERE s.transaction_date BETWEEN :from AND :to
          AND s.sale_status IN ('COMPLETED', 'REFUNDED')
          AND s.store_id IS NOT NULL
        GROUP BY s.store_id
        HAVING COALESCE(SUM(s.total_amount), 0) > 0
        ORDER BY SUM(s.total_amount) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> storeSalesRows(
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("limit") int limit
    );

    @Query(value = """
        SELECT i.store_id,
               COALESCE(SUM(i.revenue - i.cost_estimate), 0)
        FROM sale_item_facts i
        WHERE i.transaction_date BETWEEN :from AND :to
          AND i.store_id IS NOT NULL
        GROUP BY i.store_id
        """, nativeQuery = true)
    List<Object[]> storeProfitRows(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
        SELECT s.store_id,
               COALESCE(SUM(s.total_amount), 0)
        FROM sale_facts s
        WHERE s.transaction_date BETWEEN :from AND :to
          AND s.sale_status IN ('COMPLETED', 'REFUNDED')
          AND s.store_id IS NOT NULL
        GROUP BY s.store_id
        """, nativeQuery = true)
    List<Object[]> storeTurnoverById(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
        SELECT i.product_name,
               COALESCE(SUM(i.quantity - i.quantity_returned), 0),
               COALESCE(SUM(i.revenue), 0),
               COALESCE(SUM(i.cost_estimate), 0),
               COALESCE(SUM(i.revenue - i.cost_estimate), 0)
        FROM sale_item_facts i
        WHERE i.transaction_date BETWEEN :from AND :to
        GROUP BY i.product_name
        HAVING COALESCE(SUM(i.quantity - i.quantity_returned), 0) > 0
            OR COALESCE(SUM(i.revenue), 0) > 0
        ORDER BY SUM(i.revenue) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> productSalesRows(
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("limit") int limit
    );

    @Query(value = """
        SELECT i.product_name,
               COALESCE(SUM(i.quantity - i.quantity_returned), 0)
        FROM sale_item_facts i
        WHERE i.transaction_date BETWEEN :from AND :to
        GROUP BY i.product_name
        """, nativeQuery = true)
    List<Object[]> productQtyByName(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
        SELECT COALESCE(NULLIF(TRIM(i.category_name), ''), '—'),
               COALESCE(SUM(i.quantity - i.quantity_returned), 0),
               COALESCE(SUM(i.revenue), 0),
               COALESCE(SUM(i.revenue - i.cost_estimate), 0)
        FROM sale_item_facts i
        WHERE i.transaction_date BETWEEN :from AND :to
        GROUP BY COALESCE(NULLIF(TRIM(i.category_name), ''), '—')
        HAVING COALESCE(SUM(i.revenue), 0) > 0
            OR COALESCE(SUM(i.quantity - i.quantity_returned), 0) > 0
        ORDER BY SUM(i.revenue) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> categorySalesRows(
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("limit") int limit
    );

    @Query(value = """
        SELECT
          COALESCE(SUM(i.quantity - i.quantity_returned), 0),
          COALESCE(SUM(i.revenue), 0),
          COALESCE(SUM(i.cost_estimate), 0),
          COALESCE(SUM(i.revenue - i.cost_estimate), 0)
        FROM sale_item_facts i
        WHERE i.transaction_date BETWEEN :from AND :to
        """, nativeQuery = true)
    Object[] productKpiTotals(@Param("from") LocalDate from, @Param("to") LocalDate to);

    /** Час по ingested_at — приближение (в sale_facts нет времени продажи). */
    @Query(value = """
        SELECT CAST(EXTRACT(HOUR FROM s.ingested_at) AS int),
               COALESCE(SUM(s.total_amount), 0),
               CAST(COUNT(*) AS bigint)
        FROM sale_facts s
        WHERE s.transaction_date BETWEEN :from AND :to
          AND s.sale_status IN ('COMPLETED', 'REFUNDED')
          AND s.ingested_at IS NOT NULL
        GROUP BY EXTRACT(HOUR FROM s.ingested_at)
        ORDER BY 1
        """, nativeQuery = true)
    List<Object[]> hourlySalesApprox(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
        SELECT LOWER(COALESCE(NULLIF(TRIM(s.payment_method), ''), 'unknown')),
               COALESCE(SUM(s.total_amount), 0),
               CAST(COUNT(*) AS bigint)
        FROM sale_facts s
        WHERE s.transaction_date BETWEEN :from AND :to
          AND s.sale_status IN ('COMPLETED', 'REFUNDED')
        GROUP BY LOWER(COALESCE(NULLIF(TRIM(s.payment_method), ''), 'unknown'))
        ORDER BY SUM(s.total_amount) DESC
        """, nativeQuery = true)
    List<Object[]> paymentsByMethod(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
        SELECT s.transaction_date,
               COALESCE(SUM(s.cash_amount), 0),
               COALESCE(SUM(s.card_amount), 0),
               COALESCE(SUM(GREATEST(s.total_amount - s.cash_amount - s.card_amount, 0)), 0)
        FROM sale_facts s
        WHERE s.transaction_date BETWEEN :from AND :to
          AND s.sale_status IN ('COMPLETED', 'REFUNDED')
        GROUP BY s.transaction_date
        ORDER BY s.transaction_date
        """, nativeQuery = true)
    List<Object[]> paymentsDailySplit(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
        SELECT
          COALESCE(SUM(CASE WHEN s.sale_status IN ('COMPLETED', 'REFUNDED') THEN s.total_amount ELSE 0 END), 0),
          CAST(COUNT(*) FILTER (WHERE s.sale_status IN ('COMPLETED', 'REFUNDED')) AS bigint),
          COALESCE(SUM(s.returned_amount), 0),
          CAST(COUNT(*) FILTER (WHERE s.returned_amount > 0) AS bigint),
          CAST(COUNT(*) FILTER (WHERE UPPER(COALESCE(s.sale_status, '')) IN ('CANCELLED', 'CANCELED', 'VOID')) AS bigint)
        FROM sale_facts s
        WHERE s.transaction_date BETWEEN :from AND :to
        """, nativeQuery = true)
    Object[] fiscalTotals(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
        SELECT s.store_id,
               COALESCE(MAX(s.store_name), CONCAT('Store #', s.store_id)),
               COALESCE(SUM(CASE WHEN s.sale_status IN ('COMPLETED', 'REFUNDED') THEN s.total_amount ELSE 0 END), 0),
               CAST(COUNT(*) FILTER (WHERE s.sale_status IN ('COMPLETED', 'REFUNDED')) AS bigint),
               COALESCE(SUM(s.returned_amount), 0),
               CAST(COUNT(*) FILTER (WHERE UPPER(COALESCE(s.sale_status, '')) IN ('CANCELLED', 'CANCELED', 'VOID')) AS bigint)
        FROM sale_facts s
        WHERE s.transaction_date BETWEEN :from AND :to
          AND s.store_id IS NOT NULL
        GROUP BY s.store_id
        HAVING COALESCE(SUM(CASE WHEN s.sale_status IN ('COMPLETED', 'REFUNDED') THEN s.total_amount ELSE 0 END), 0) > 0
            OR COALESCE(SUM(s.returned_amount), 0) > 0
            OR COUNT(*) FILTER (WHERE UPPER(COALESCE(s.sale_status, '')) IN ('CANCELLED', 'CANCELED', 'VOID')) > 0
        ORDER BY SUM(CASE WHEN s.sale_status IN ('COMPLETED', 'REFUNDED') THEN s.total_amount ELSE 0 END) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> fiscalByStore(
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("limit") int limit
    );
}
