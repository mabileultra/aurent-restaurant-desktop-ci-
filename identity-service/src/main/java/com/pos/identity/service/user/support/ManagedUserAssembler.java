package com.pos.identity.service.user.support;

import com.pos.identity.client.dto.CompanyDirectoryItem;
import com.pos.identity.dto.user.ManagedUserResponse;
import com.pos.identity.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class ManagedUserAssembler {

    public ManagedUserResponse toRow(
        User user,
        Map<Integer, CompanyDirectoryItem> companies,
        Map<Integer, String> storeNames
    ) {
        CompanyDirectoryItem company = user.getCompanyId() == null
            ? null
            : companies.get(user.getCompanyId());
        List<Integer> storeIds = sortedStoreIds(user.getStoreIds());
        List<String> names = storeIds.stream()
            .map(storeNames::get)
            .filter(name -> name != null && !name.isBlank())
            .toList();
        String role = user.getRole() == null ? null : user.getRole().getName();
        return new ManagedUserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getPatronymic(),
            user.getFullName(),
            role,
            user.getCompanyId(),
            company == null ? null : company.name(),
            company == null ? null : company.loginCode(),
            company == null ? null : company.regionCode(),
            company == null ? null : company.districtCode(),
            company == null ? null : company.businessType(),
            storeIds,
            names,
            user.isActive(),
            user.getPinDigest() != null && !user.getPinDigest().isBlank()
        );
    }

    private static List<Integer> sortedStoreIds(Set<Integer> storeIds) {
        if (storeIds == null || storeIds.isEmpty()) {
            return List.of();
        }
        return storeIds.stream().sorted().toList();
    }
}
