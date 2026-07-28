package com.pos.platform.bootstrap;

import com.pos.platform.repository.CompanyRepository;
import com.pos.platform.repository.DesktopBroadcastRepository;
import com.pos.platform.repository.PlatformSettingRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;

@Component
@Order(1)
@RequiredArgsConstructor
public class PlatformDataMigrator implements ApplicationRunner {

    private final CompanyRepository companyRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final DesktopBroadcastRepository desktopBroadcastRepository;
    private final DataSource dataSource;

    @Value("${app.migration.pos-core-datasource-url:}")
    private String posCoreDatasourceUrl;

    @Value("${app.migration.pos-core-datasource-username:}")
    private String posCoreUsername;

    @Value("${app.migration.pos-core-datasource-password:}")
    private String posCorePassword;

    @Override
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(posCoreDatasourceUrl)) {
            LogUtil.info(PlatformDataMigrator.class, "Skipping platform data migration: POS_CORE_DATASOURCE_URL not set");
            return;
        }

        JdbcTemplate sourceJdbc = new JdbcTemplate(sourceDataSource());
        JdbcTemplate targetJdbc = new JdbcTemplate(dataSource);

        if (companyRepository.count() == 0) {
            LogUtil.info(PlatformDataMigrator.class, "Migrating companies from POS core database");
            copyCompanies(sourceJdbc, targetJdbc);
            resetCompanySequence(targetJdbc);
        }

        if (platformSettingRepository.count() == 0) {
            LogUtil.info(PlatformDataMigrator.class, "Migrating platform_settings from POS core database");
            copyPlatformSettings(sourceJdbc, targetJdbc);
        }

        if (desktopBroadcastRepository.count() == 0) {
            LogUtil.info(PlatformDataMigrator.class, "Migrating desktop_broadcasts from POS core database");
            copyDesktopBroadcasts(sourceJdbc, targetJdbc);
        }

        LogUtil.info(PlatformDataMigrator.class, "Platform data migration completed");
    }

    private void copyCompanies(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT id, name, login_code, legal_name, tin, address, phone, business_type, is_active, created_at, updated_at
            FROM companies
            ORDER BY id
            """
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO companies (id, name, login_code, legal_name, tin, address, phone, business_type, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("name"),
                row.get("login_code"),
                row.get("legal_name"),
                row.get("tin"),
                row.get("address"),
                row.get("phone"),
                row.get("business_type"),
                row.get("is_active"),
                row.get("created_at"),
                row.get("updated_at")
            );
        }
    }

    private void copyPlatformSettings(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT setting_key, setting_value, updated_at
            FROM platform_settings
            ORDER BY setting_key
            """
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO platform_settings (setting_key, setting_value, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT (setting_key) DO NOTHING
                """,
                row.get("setting_key"),
                row.get("setting_value"),
                row.get("updated_at")
            );
        }
    }

    private void copyDesktopBroadcasts(JdbcTemplate sourceJdbc, JdbcTemplate targetJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
            SELECT id, title, body, kind, priority, action_label, action_url, created_by, created_at, expires_at
            FROM desktop_broadcasts
            ORDER BY created_at
            """
        );
        for (Map<String, Object> row : rows) {
            targetJdbc.update(
                """
                INSERT INTO desktop_broadcasts (id, title, body, kind, priority, action_label, action_url, created_by, created_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                row.get("id"),
                row.get("title"),
                row.get("body"),
                row.get("kind"),
                row.get("priority"),
                row.get("action_label"),
                row.get("action_url"),
                row.get("created_by"),
                row.get("created_at"),
                row.get("expires_at")
            );
        }
    }

    private void resetCompanySequence(JdbcTemplate targetJdbc) {
        targetJdbc.execute(
            "SELECT setval(pg_get_serial_sequence('companies', 'id'), COALESCE((SELECT MAX(id) FROM companies), 1))"
        );
    }

    private DataSource sourceDataSource() {
        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setDriverClassName("org.postgresql.Driver");
        ds.setUrl(posCoreDatasourceUrl);
        ds.setUsername(posCoreUsername);
        ds.setPassword(posCorePassword);
        return ds;
    }
}
