package com.pos.identity.mapper;

import com.pos.identity.dto.auth.AuthResponse;
import com.pos.identity.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Mapper(config = IdentityMapperConfig.class)
public interface AuthMapper {

    @Mapping(target = "token", source = "token")
    @Mapping(target = "id", source = "user.id", qualifiedByName = "uuidToString")
    @Mapping(target = "username", source = "user.username")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "firstName", source = "user.firstName")
    @Mapping(target = "lastName", source = "user.lastName")
    @Mapping(target = "patronymic", source = "user.patronymic")
    @Mapping(target = "fullName", source = "user.fullName")
    @Mapping(target = "role", source = "user.role.name")
    @Mapping(target = "companyId", source = "user.companyId")
    @Mapping(target = "companyLoginCode", source = "companyLoginCode")
    @Mapping(target = "storeIds", source = "user.storeIds", qualifiedByName = "sortedStoreIds")
    @Mapping(target = "allowedModules", source = "allowedModules")
    @Mapping(target = "moduleAccessCustom", source = "moduleAccessCustom")
    AuthResponse toResponse(
        User user,
        String token,
        String companyLoginCode,
        List<String> allowedModules,
        boolean moduleAccessCustom
    );

    @Named("uuidToString")
    default String uuidToString(UUID id) {
        return id != null ? id.toString() : null;
    }

    @Named("sortedStoreIds")
    default List<Integer> sortedStoreIds(Set<Integer> storeIds) {
        if (storeIds == null || storeIds.isEmpty()) {
            return List.of();
        }
        return storeIds.stream().sorted().collect(Collectors.toList());
    }
}
