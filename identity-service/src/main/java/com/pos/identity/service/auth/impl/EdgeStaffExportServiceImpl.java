package com.pos.identity.service.auth.impl;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.dto.auth.EdgeStaffExportItem;
import com.pos.identity.dto.auth.EdgeStaffExportResponse;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.ModuleAccessService;
import com.pos.identity.service.auth.EdgeStaffExportService;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.shared.access.ModuleVisibility;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EdgeStaffExportServiceImpl implements EdgeStaffExportService {

    private static final Set<String> EXPORT_ROLES = Set.of(
        "ADMIN", "MANAGER", "CASHIER", "WAITER", "COOK", "ACCOUNTANT", "COURIER"
    );

    private final TenantAccessSupport tenantAccess;
    private final UserRepository userRepository;
    private final ModuleAccessService moduleAccessService;
    private final PosCoreClient posCoreClient;

    @Override
    @Transactional(readOnly = true)
    public EdgeStaffExportResponse exportForCurrentCompany() {
        User actor = tenantAccess.currentUser();
        String actorRole = actor.getRole() != null ? actor.getRole().getName() : "";
        if (!RoleName.SUPER_ADMIN.matches(actor)
            && !RoleName.PLATFORM_ADMIN.matches(actor)
            && !"ADMIN".equals(actorRole)
            && !"MANAGER".equals(actorRole)) {
            throw new BadRequestException("Only ADMIN/MANAGER can export edge staff");
        }
        Integer companyId = actor.getCompanyId();
        if (companyId == null) {
            throw new BadRequestException("Company not found");
        }
        CompanyDto company = posCoreClient.getCompanyById(companyId);
        if (company == null || !company.active()) {
            throw new BadRequestException("Company not found");
        }
        String loginCode = company.loginCode();

        List<EdgeStaffExportItem> staff = new ArrayList<>();
        for (User u : userRepository.findByCompanyIdWithDetails(companyId)) {
            if (!u.isActive()) continue;
            String role = u.getRole() != null ? u.getRole().getName() : "";
            if (!EXPORT_ROLES.contains(role)) continue;
            List<String> modules = moduleAccessService.resolveAllowedModuleIds(u);
            boolean canBill = modules != null
                && modules.contains(ModuleVisibility.RESTAURANT_REQUEST_BILL);
            staff.add(new EdgeStaffExportItem(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getFullName(),
                role,
                u.getPassword(),
                u.getPinDigest(),
                u.getStoreIds() == null ? List.of() : List.copyOf(u.getStoreIds()),
                modules == null ? List.of() : modules,
                canBill,
                true,
                loginCode
            ));
        }
        return new EdgeStaffExportResponse(companyId, loginCode, staff);
    }
}
