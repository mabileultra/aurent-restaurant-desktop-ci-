package com.pos.restaurant.booking.support;

import com.pos.restaurant.booking.domain.ReservationStatus;
import com.pos.restaurant.booking.dto.ReservationListFilter;
import com.pos.shared.api.FilterText;
import com.pos.shared.api.InstantRange;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * JPQL where for reservation lists. Aliases: {@code r} reservation, {@code t} table, {@code h} hall.
 */
public final class ReservationListCriteria {

    private final String where;
    private final Map<String, Object> params;
    /** Same scope without search/status — for board stats. */
    private final String statsWhere;
    private final Map<String, Object> statsParams;

    private ReservationListCriteria(
        String where,
        Map<String, Object> params,
        String statsWhere,
        Map<String, Object> statsParams
    ) {
        this.where = where;
        this.params = params;
        this.statsWhere = statsWhere;
        this.statsParams = statsParams;
    }

    public static ReservationListCriteria of(Integer companyId, Integer storeId, ReservationListFilter filter) {
        ReservationListFilter safe = filter == null
            ? new ReservationListFilter(null, null, false, null, null)
            : filter;

        StringBuilder base = new StringBuilder("""
             where r.companyId = :companyId and r.storeId = :storeId
            """);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("companyId", companyId);
        params.put("storeId", storeId);

        if (safe.activeOnly()) {
            base.append(" and r.status in :activeStatuses");
            params.put("activeStatuses", ReservationLookup.ACTIVE_STATUSES);
        } else {
            InstantRange period = ReservationPeriod.resolve(safe.from(), safe.to());
            base.append(" and r.reservedAt >= :from and r.reservedAt < :to");
            params.put("from", period.from());
            params.put("to", period.to());
        }

        String statsWhere = base.toString();
        Map<String, Object> statsParams = new LinkedHashMap<>(params);

        StringBuilder list = new StringBuilder(base);
        if (safe.status() != null) {
            list.append(" and r.status = :status");
            params.put("status", safe.status());
        }
        appendSearch(list, params, safe.search());

        return new ReservationListCriteria(list.toString(), params, statsWhere, statsParams);
    }

    private static void appendSearch(StringBuilder sql, Map<String, Object> params, String raw) {
        String term = FilterText.normalizeSearch(raw);
        if (term == null) {
            return;
        }
        String like = "%" + escapeLike(term.toLowerCase(Locale.ROOT)) + "%";
        params.put("searchLike", like);
        sql.append("""
             and (
               lower(r.clientName) like :searchLike escape '\\'
               or lower(coalesce(r.clientPhone, '')) like :searchLike escape '\\'
               or lower(t.code) like :searchLike escape '\\'
               or lower(h.name) like :searchLike escape '\\'
             )
            """);
    }

    static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    public String where() {
        return where;
    }

    public Map<String, Object> params() {
        return params;
    }

    public String statsWhere() {
        return statsWhere;
    }

    public Map<String, Object> statsParams() {
        return statsParams;
    }
}
