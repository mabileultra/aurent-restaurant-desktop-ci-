package com.pos.service;

import com.pos.dto.business.ReferenceBookDetailResponse;
import com.pos.dto.business.ReferenceBookResponse;
import com.pos.dto.business.SaveReferenceBookRequest;
import com.pos.dto.business.UpdateReferenceBookRequest;

import java.util.List;

public interface ReferenceBookService {

    List<ReferenceBookResponse> list();

    ReferenceBookDetailResponse getById(Integer id);

    ReferenceBookDetailResponse create(SaveReferenceBookRequest request);

    ReferenceBookDetailResponse update(Integer id, UpdateReferenceBookRequest request);

    void delete(Integer id);
}
