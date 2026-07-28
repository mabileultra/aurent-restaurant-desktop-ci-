package com.pos.sales.mapper;

import com.pos.sales.dto.zreport.ZReportDetailResponse;
import com.pos.sales.dto.zreport.ZReportRowResponse;
import com.pos.sales.entity.ZReport;
import com.pos.mapper.PosMapperConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(config = PosMapperConfig.class)
public interface ZReportMapper {

    @Mapping(target = "zNumber", source = "ZNumber")
    @Mapping(target = "storeName", source = "report", qualifiedByName = "storeName")
    ZReportRowResponse toRowResponse(ZReport report);

    List<ZReportRowResponse> toRowResponseList(List<ZReport> reports);

    @Mapping(target = "zNumber", source = "ZNumber")
    @Mapping(target = "storeName", source = "report", qualifiedByName = "storeName")
    ZReportDetailResponse toDetailResponse(ZReport report);

    @Named("storeName")
    default String storeName(ZReport report) {
        return report.getStore() != null ? report.getStore().getName() : "";
    }
}
