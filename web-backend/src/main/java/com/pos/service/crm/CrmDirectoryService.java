package com.pos.service.crm;

import com.pos.dto.crm.internal.CourierRefDto;
import com.pos.dto.crm.internal.StoreRefDto;

import java.util.List;

public interface CrmDirectoryService {

    StoreRefDto getStore(Integer id);

    List<CourierRefDto> listCouriers(Integer companyId);
}
