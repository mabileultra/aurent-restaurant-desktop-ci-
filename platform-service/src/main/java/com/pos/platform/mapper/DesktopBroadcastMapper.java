package com.pos.platform.mapper;

import com.pos.platform.dto.desktop.DesktopBroadcastResponse;
import com.pos.platform.entity.DesktopBroadcast;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Mapper(config = PlatformMapperConfig.class)
public interface DesktopBroadcastMapper {

    @Mapping(target = "read", constant = "false")
    @Mapping(target = "companyIds", expression = "java(toSortedList(broadcast.getCompanyIds()))")
    @Mapping(target = "storeIds", expression = "java(toSortedList(broadcast.getStoreIds()))")
    DesktopBroadcastResponse toResponse(DesktopBroadcast broadcast);

    default List<Integer> toSortedList(Set<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        List<Integer> copy = new ArrayList<>(ids);
        Collections.sort(copy);
        return copy;
    }
}
