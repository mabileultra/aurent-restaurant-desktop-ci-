package com.pos.scales.service;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.scales.dto.AssignPluRequest;
import com.pos.scales.dto.DecodeWeightBarcodeResponse;
import com.pos.scales.dto.EncodeWeightBarcodeRequest;
import com.pos.scales.dto.EncodeWeightBarcodeResponse;
import com.pos.scales.dto.ScaleProductDto;

import java.util.List;

public interface ScaleProductService {

    List<ScaleProductDto> listWeightProducts();

    ProductResponse getByPlu(String plu, Integer storeId);

    ProductResponse assignPlu(AssignPluRequest request);

    EncodeWeightBarcodeResponse encode(EncodeWeightBarcodeRequest request);

    DecodeWeightBarcodeResponse decode(String barcode, Integer storeId);
}
