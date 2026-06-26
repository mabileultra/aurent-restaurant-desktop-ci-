package com.pos.identity.bootstrap;

import com.pos.identity.repository.UserRepository;
import com.pos.identity.util.LogUtil;
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
public class IdentityDataMigrator implements ApplicationRunner {

    private final UserRepository userRepository;
    private final DataSource dataSource;

    @Value("${app.migration.pos-core-datasource-url:}")
    private String posCoreDatasourceUrl;

    @Value("${app.migration.pos-core-datasource-username:}")
    private String posCoreUsername;

    @Value("${app.migration.pos-core-datasource-password:}")
    private String posCorePassword;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        if (!StringUtils.hasText(posCoreDatasourceUrl)) {
            LogUtil.info(IdentityDataMigrator.class, "Skipping identity data migration: POS_CORE_DATASOURCE_URL not set");
            return;
        }

        LogUtil.info(IdentityDataMigrator.class, "Migrating identity data from POS core database");
        JdbcTemplate sourceJdbc = new JdbcTemplate(sourceDataSource());

        copyRoles(sourceJdbc);
        copyUsers(sourceJdbc);
        copyUserStores(sourceJdbc);
        copyUserModuleAccess(sourceJdbc);

        LogUtil.info(IdentityDataMigrator.class, "Identity data migration completed");
    }

    private void copyRoles(JdbcTemplate sourceJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            "SELECT id, name, description FROM roles ORDER BY id"
        );
        JdbcTemplate target = targetJdbc();
        for (Map<String, Object> row : rows) {
            target.update(
                "INSERT INTO roles (id, name, description) VALUES (?, ?, ?) ON CONFLICT (name) DO NOTHING",
                row.get("id"),
                row.get("name"),
                row.get("description")
            );
        }
        Integer maxId = target.queryForObject("SELECT COALESCE(MAX(id), 0) FROM roles", Integer.class);
        if (maxId != null && maxId > 0) {
            target.execute("SELECT setval(pg_get_serial_sequence('roles', 'id'), " + maxId + ")");
        }
    }

    private void copyUsers(JdbcTemplate sourceJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            """
                SELECT id, username, email, password, pin_digest, full_name, first_name, last_name,
                       patronymic, role_id, company_id, is_active, module_access_custom, created_at, updated_at
                FROM users
                ORDER BY created_at
                """
        );
        JdbcTemplate target = targetJdbc();
        for (Map<String, Object> row : rows) {
            target.update(
                """
                    INSERT INTO users (
                        id, username, email, password, pin_digest, full_name, first_name, last_name,
                        patronymic, role_id, company_id, is_active, module_access_custom, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT (id) DO NOTHING
                    """,
                row.get("id"),
                row.get("username"),
                row.get("email"),
                row.get("password"),
                row.get("pin_digest"),
                row.get("full_name"),
                row.get("first_name"),
                row.get("last_name"),
                row.get("patronymic"),
                row.get("role_id"),
                row.get("company_id"),
                row.get("is_active"),
                row.get("module_access_custom"),
                row.get("created_at"),
                row.get("updated_at")
            );
        }
    }

    private void copyUserStores(JdbcTemplate sourceJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            "SELECT user_id, store_id FROM user_stores"
        );
        JdbcTemplate target = targetJdbc();
        for (Map<String, Object> row : rows) {
            target.update(
                "INSERT INTO user_stores (user_id, store_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                row.get("user_id"),
                row.get("store_id")
            );
        }
    }

    private void copyUserModuleAccess(JdbcTemplate sourceJdbc) {
        List<Map<String, Object>> rows = sourceJdbc.queryForList(
            "SELECT user_id, module_key, allowed FROM user_module_access"
        );
        JdbcTemplate target = targetJdbc();
        for (Map<String, Object> row : rows) {
            target.update(
                "INSERT INTO user_module_access (user_id, module_key, allowed) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
                row.get("user_id"),
                row.get("module_key"),
                row.get("allowed")
            );
        }
    }

    private DataSource sourceDataSource() {
        return new DriverManagerDataSource(posCoreDatasourceUrl, posCoreUsername, posCorePassword);
    }

    private JdbcTemplate targetJdbc() {
        return new JdbcTemplate(dataSource);
    }
}
