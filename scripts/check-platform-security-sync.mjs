#!/usr/bin/env node
/**
 * Locks PLATFORM_ADMIN HTTP access:
 * grantable platform APIs (incl. module-access) include the role,
 * security stays SUPER_ADMIN-only,
 * tenant billing/finance-sync stay without PLATFORM_ADMIN.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = false;

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

function mustContain(source, needle, label) {
  if (!source.includes(needle)) {
    failed = true;
    console.error(`Missing: ${label}`);
    console.error(`  ${needle}`);
  }
}

function mustNotContain(source, needle, label) {
  if (source.includes(needle)) {
    failed = true;
    console.error(`Forbidden: ${label}`);
    console.error(`  ${needle}`);
  }
}

const identitySecurity = read('identity-service/src/main/java/com/pos/identity/config/SecurityConfig.java');
mustContain(
  identitySecurity,
  '.requestMatchers("/users/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN", "MANAGER")',
  'identity /users allows PLATFORM_ADMIN'
);
mustContain(
  identitySecurity,
  '.requestMatchers("/platform/account/**").hasAnyRole("PLATFORM_ADMIN", "PLATFORM_ANALYTICS")',
  'identity /platform/account is PLATFORM_ADMIN/PLATFORM_ANALYTICS self-service'
);
mustContain(
  identitySecurity,
  '.requestMatchers("/platform/module-access/**").hasAnyRole("SUPER_ADMIN", "PLATFORM_ADMIN")',
  'identity module-access allows PLATFORM_ADMIN'
);
mustContain(
  identitySecurity,
  '.requestMatchers("/platform/security/super-admins/**").hasRole("SUPER_ADMIN")',
  'identity security stays SUPER_ADMIN'
);

const platformSecurity = read('platform-service/src/main/java/com/pos/platform/config/SecurityConfig.java');
mustContain(
  platformSecurity,
  '.requestMatchers("/platform/security/**").hasRole("SUPER_ADMIN")',
  'platform /platform/security stays SUPER_ADMIN'
);
mustContain(
  platformSecurity,
  '.requestMatchers("/platform/**").hasAnyRole("SUPER_ADMIN", "PLATFORM_ADMIN")',
  'platform /platform/** allows PLATFORM_ADMIN'
);
mustContain(
  platformSecurity,
  '.requestMatchers("/companies/**").hasAnyRole("SUPER_ADMIN", "PLATFORM_ADMIN")',
  'platform /companies/** allows PLATFORM_ADMIN'
);
mustNotContain(
  platformSecurity,
  '.requestMatchers("/billing/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN")',
  'tenant billing must not include PLATFORM_ADMIN'
);

const superAdminOnly = [
  'identity-service/src/main/java/com/pos/identity/controller/PlatformSecurityController.java',
  'platform-service/src/main/java/com/pos/platform/controller/PlatformSecurityController.java',
];
for (const rel of superAdminOnly) {
  const source = read(rel);
  mustContain(source, "@PreAuthorize(\"hasRole('SUPER_ADMIN')\")", `${rel} SUPER_ADMIN-only`);
  mustNotContain(source, 'PLATFORM_ADMIN', `${rel} must not mention PLATFORM_ADMIN`);
}

mustContain(
  read('identity-service/src/main/java/com/pos/identity/controller/PlatformModuleAccessController.java'),
  "@PreAuthorize(\"hasAnyRole('SUPER_ADMIN', 'PLATFORM_ADMIN')\")",
  'identity PlatformModuleAccessController grantable to PLATFORM_ADMIN'
);

const grantable = [
  'platform-service/src/main/java/com/pos/platform/controller/CompanyController.java',
  'platform-service/src/main/java/com/pos/platform/controller/PlatformBusinessTypeController.java',
  'platform-service/src/main/java/com/pos/platform/controller/PlatformDesktopNotificationController.java',
  'platform-service/src/main/java/com/pos/platform/controller/PlatformBillingController.java',
  'platform-service/src/main/java/com/pos/platform/controller/PlatformReferenceBookController.java',
  'platform-service/src/main/java/com/pos/platform/controller/PlatformSiteLeadController.java',
  'platform-service/src/main/java/com/pos/platform/controller/PlatformMonitoringController.java',
  'platform-service/src/main/java/com/pos/platform/controller/PlatformEmailController.java',
  'web-backend/src/main/java/com/pos/controller/CompanyBusinessTypeController.java',
];
for (const rel of grantable) {
  mustContain(
    read(rel),
    "@PreAuthorize(\"hasAnyRole('SUPER_ADMIN', 'PLATFORM_ADMIN')\")",
    `${rel} grantable to PLATFORM_ADMIN`
  );
}

mustContain(
  read('web-backend/src/main/java/com/pos/controller/StoreController.java'),
  "'PLATFORM_ADMIN'",
  'web-backend StoreController allows PLATFORM_ADMIN'
);

const tenantOnly = [
  'platform-service/src/main/java/com/pos/platform/controller/TenantBillingController.java',
  'platform-service/src/main/java/com/pos/platform/controller/FinanceSyncController.java',
];
for (const rel of tenantOnly) {
  mustNotContain(read(rel), 'PLATFORM_ADMIN', `${rel} must stay tenant/super-admin`);
}

mustContain(
  read('identity-service/src/main/resources/db/changelog/db.changelog-master.xml'),
  'v4-identity-platform-admin-role.xml',
  'identity liquibase includes PLATFORM_ADMIN role'
);
mustContain(
  read('identity-service/src/main/resources/db/changelog/db.changelog-master.xml'),
  'v5-identity-platform-admin-user.xml',
  'identity liquibase includes PLATFORM_ADMIN user'
);
mustContain(
  read('identity-service/src/main/resources/db/changelog/db.changelog-master.xml'),
  'v6-identity-platform-admin-access.xml',
  'identity liquibase grants platformAccess to PLATFORM_ADMIN'
);
mustContain(
  read('identity-service/src/main/resources/db/changelog/db.changelog-master.xml'),
  'v7-identity-platform-analytics-role.xml',
  'identity liquibase includes PLATFORM_ANALYTICS role'
);
mustContain(
  read('web-backend/src/main/resources/db/changelog/db.changelog-master.xml'),
  'v39-platform-admin-role.xml',
  'web-backend liquibase includes PLATFORM_ADMIN role'
);
mustContain(
  read('web-backend/src/main/resources/db/changelog/db.changelog-master.xml'),
  'v40-platform-admin-user.xml',
  'web-backend liquibase includes PLATFORM_ADMIN user'
);
mustContain(
  read('web-backend/src/main/resources/db/changelog/db.changelog-master.xml'),
  'v41-platform-admin-access.xml',
  'web-backend liquibase grants platformAccess to PLATFORM_ADMIN'
);
mustContain(
  read('web-backend/src/main/resources/db/changelog/db.changelog-master.xml'),
  'v45-platform-analytics-role.xml',
  'web-backend liquibase includes PLATFORM_ANALYTICS role'
);
mustContain(
  read('identity-service/src/main/resources/db/changelog/v4-identity-platform-admin-role.xml'),
  "value=\"PLATFORM_ADMIN\"",
  'identity role insert'
);
mustContain(
  read('web-backend/src/main/resources/db/changelog/v39-platform-admin-role.xml'),
  'PLATFORM_ADMIN',
  'web-backend role insert'
);
mustContain(
  read('identity-service/src/main/resources/db/changelog/v7-identity-platform-analytics-role.xml'),
  "value=\"PLATFORM_ANALYTICS\"",
  'identity PLATFORM_ANALYTICS role insert'
);
mustContain(
  read('web-backend/src/main/resources/db/changelog/v45-platform-analytics-role.xml'),
  'PLATFORM_ANALYTICS',
  'web-backend PLATFORM_ANALYTICS role insert'
);
mustContain(
  read('web-backend/src/main/java/com/pos/taxanalytics/controller/TaxAnalyticsController.java'),
  'PLATFORM_ANALYTICS',
  'web-backend tax-analytics allows PLATFORM_ANALYTICS'
);
mustContain(
  read('web-backend/src/main/java/com/pos/controller/GeoCatalogController.java'),
  'PLATFORM_ANALYTICS',
  'web-backend geo catalog allows PLATFORM_ANALYTICS'
);
mustContain(
  read('web-frontend/src/features/platform/components/security/PlatformSuperAdminFormModal.jsx'),
  'PLATFORM_ANALYTICS',
  'security form can create PLATFORM_ANALYTICS'
);
mustContain(
  read('identity-service/src/main/resources/db/changelog/v5-identity-platform-admin-user.xml'),
  "'platformadmin'",
  'identity seed login'
);
mustContain(
  read('identity-service/src/main/resources/db/changelog/v6-identity-platform-admin-access.xml'),
  "'platformAccess'",
  'identity v6 grants platformAccess'
);
mustContain(
  read('web-backend/src/main/resources/db/changelog/v41-platform-admin-access.xml'),
  "'platformAccess'",
  'web-backend v41 grants platformAccess'
);

if (failed) {
  process.exit(1);
}
console.log('Platform security sync OK');
