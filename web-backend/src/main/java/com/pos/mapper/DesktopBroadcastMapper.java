package com.pos.mapper;

import com.pos.dto.desktop.DesktopBroadcastResponse;
import com.pos.entity.DesktopBroadcast;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = PosMapperConfig.class)
public interface DesktopBroadcastMapper {

    @Mapping(target = "read", constant = "false")
    DesktopBroadcastResponse toResponse(DesktopBroadcast broadcast);

    @Mapping(target = "read", constant = "true")
    DesktopBroadcastResponse toReadResponse(DesktopBroadcast broadcast);
}
