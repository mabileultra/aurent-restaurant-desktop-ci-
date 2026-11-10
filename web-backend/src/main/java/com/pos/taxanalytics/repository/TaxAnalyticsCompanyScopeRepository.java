package com.pos.taxanalytics.repository;

import com.pos.taxanalytics.support.TaxAnalyticsCompanyFilter;
import com.pos.taxanalytics.support.TaxAnalyticsConnectedSql;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Company id scope for merging restaurant/pharmacy vertical money into geo filters. */
@Repository
@RequiredArgsConstructor
public class TaxAnalyticsCompanyScopeRepository {

    private final JdbcTemplate jdbc;

    public Set<Integer> companyIds(
        String regionCode,
        String districtCode,
        String businessType,
        String search
    ) {
        StringBuilder sql = new StringBuilder("SELECT c.id FROM companies c WHERE 1=1 ");
        List<Object> args = new ArrayList<>();
        TaxAnalyticsCompanyFilter.append(sql, args, regionCode, districtCode, businessType, null, search);
        List<Integer> ids = args.isEmpty()
            ? jdbc.queryForList(sql.toString(), Integer.class)
            : jdbc.queryForList(sql.toString(), Integer.class, args.toArray());
        return new HashSet<>(ids);
    }

    public Set<Integer> groceryConnectedIds(
        String regionCode,
        String districtCode,
        String businessType,
        String search
    ) {
        StringBuilder sql = new StringBuilder();
        sql.append("WITH connected AS ( ").append(TaxAnalyticsConnectedSql.SQL).append(" ) ");
        sql.append("""
            SELECT c.id
            FROM companies c
            JOIN connected conn ON conn.company_id = c.id
            WHERE 1=1
            """);
        List<Object> args = new ArrayList<>();
        TaxAnalyticsCompanyFilter.append(sql, args, regionCode, districtCode, businessType, null, search);
        List<Integer> ids = args.isEmpty()
            ? jdbc.queryForList(sql.toString(), Integer.class)
            : jdbc.queryForList(sql.toString(), Integer.class, args.toArray());
        return new HashSet<>(ids);
    }

    public Map<Integer, String> regionByCompanyId(Set<Integer> companyIds) {
        Map<Integer, String> map = new HashMap<>();
        if (companyIds == null || companyIds.isEmpty()) {
            return map;
        }
        List<Integer> ids = new ArrayList<>(companyIds);
        String placeholders = String.join(",", ids.stream().map(id -> "?").toList());
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT id, region_code FROM companies WHERE id IN (" + placeholders + ")",
            ids.toArray()
        );
        for (Map<String, Object> row : rows) {
            Object id = row.get("id");
            Object region = row.get("region_code");
            if (id instanceof Number number && region != null && !String.valueOf(region).isBlank()) {
                map.put(number.intValue(), String.valueOf(region));
            }
        }
        return map;
    }

    public Map<Integer, String> districtByCompanyId(Set<Integer> companyIds) {
        Map<Integer, String> map = new HashMap<>();
        if (companyIds == null || companyIds.isEmpty()) {
            return map;
        }
        List<Integer> ids = new ArrayList<>(companyIds);
        String placeholders = String.join(",", ids.stream().map(id -> "?").toList());
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT id, district_code FROM companies WHERE id IN (" + placeholders + ")",
            ids.toArray()
        );
        for (Map<String, Object> row : rows) {
            Object id = row.get("id");
            Object district = row.get("district_code");
            if (id instanceof Number number && district != null && !String.valueOf(district).isBlank()) {
                map.put(number.intValue(), String.valueOf(district));
            }
        }
        return map;
    }
}
