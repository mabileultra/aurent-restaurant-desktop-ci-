package com.pos.platform.mapper;

import com.pos.platform.dto.desktop.DesktopBroadcastResponse;
import com.pos.platform.entity.DesktopBroadcast;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = PlatformMapperConfig.class)
public interface DesktopBroadcastMapper {

    @Mapping(target = "read", constant = "false")
    DesktopBroadcastResponse toResponse(DesktopBroadcast broadcast);
}
