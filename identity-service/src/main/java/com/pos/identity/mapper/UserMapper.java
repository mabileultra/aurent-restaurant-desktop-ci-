package com.pos.identity.mapper;

import com.pos.identity.dto.user.UserResponse;
import com.pos.identity.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Mapper(config = IdentityMapperConfig.class)
public interface UserMapper {

    @Mapping(target = "role", source = "user.role.name")
    @Mapping(target = "companyId", source = "user.companyId")
    @Mapping(target = "companyName", ignore = true)
    @Mapping(target = "companyLoginCode", ignore = true)
    @Mapping(target = "active", source = "user.active")
    @Mapping(target = "hasPin", source = "user.pinDigest", qualifiedByName = "hasPinDigest")
    @Mapping(target = "storeIds", source = "user.storeIds", qualifiedByName = "sortedStoreIds")
    @Mapping(target = "storeNames", source = "storeNames")
    UserResponse toResponse(User user, List<String> storeNames);

    default UserResponse toResponse(User user) {
        return toResponse(user, List.of());
    }

    @Named("sortedStoreIds")
    default List<Integer> sortedStoreIds(Set<Integer> storeIds) {
        if (storeIds == null || storeIds.isEmpty()) {
            return List.of();
        }
        return storeIds.stream().sorted().toList();
    }

    @Named("hasPinDigest")
    default boolean hasPinDigest(String pinDigest) {
        return pinDigest != null && !pinDigest.isBlank();
    }

    default List<UserResponse> toResponseList(List<User> users) {
        List<UserResponse> result = new ArrayList<>();
        for (User user : users) {
            result.add(toResponse(user));
        }
        return result;
    }
}
