package com.pos.crm.service.impl;

import com.pos.crm.client.PosCoreClient;
import com.pos.crm.client.dto.CourierRefDto;
import com.pos.crm.client.dto.StoreRefDto;
import com.pos.crm.dto.order.CourierOptionResponse;
import com.pos.crm.dto.order.CreateCustomerOrderRequest;
import com.pos.crm.dto.order.CustomerOrderCreatedResponse;
import com.pos.crm.dto.order.CustomerOrderDetailResponse;
import com.pos.crm.dto.order.CustomerOrderRowResponse;
import com.pos.crm.dto.order.PhotoDownload;
import com.pos.crm.dto.order.UpdateCustomerOrderRequest;
import com.pos.crm.dto.shared.PageResponse;
import com.pos.crm.entity.CustomerOrder;
import com.pos.crm.entity.CustomerOrderPhoto;
import com.pos.crm.entity.OrderStatus;
import com.pos.crm.exception.BadRequestException;
import com.pos.crm.exception.ResourceNotFoundException;
import com.pos.crm.mapper.CustomerOrderMapper;
import com.pos.crm.repository.CustomerOrderPhotoRepository;
import com.pos.crm.repository.CustomerOrderRepository;
import com.pos.crm.repository.spec.CustomerOrderSpecifications;
import com.pos.crm.security.CrmTenantContext;
import com.pos.crm.service.CustomerOrderService;
import com.pos.shared.log.LogUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CustomerOrderServiceImpl implements CustomerOrderService {

    private final CustomerOrderRepository orderRepository;
    private final CustomerOrderPhotoRepository photoRepository;
    private final PosCoreClient posCoreClient;
    private final CustomerOrderMapper customerOrderMapper;
    private final String uploadDir;

    public CustomerOrderServiceImpl(
        CustomerOrderRepository orderRepository,
        CustomerOrderPhotoRepository photoRepository,
        PosCoreClient posCoreClient,
        CustomerOrderMapper customerOrderMapper,
        @Value("${app.orders.upload-dir:uploads/orders}") String uploadDir
    ) {
        this.orderRepository = orderRepository;
        this.photoRepository = photoRepository;
        this.posCoreClient = posCoreClient;
        this.customerOrderMapper = customerOrderMapper;
        this.uploadDir = uploadDir;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CustomerOrderRowResponse> list(
        Integer storeId,
        String search,
        String externalNumber,
        String clientName,
        String address,
        UUID courierId,
        String status,
        LocalDate createdFrom,
        LocalDate createdTo,
        Pageable pageable
    ) {
        Instant fromInst = createdFrom != null
            ? createdFrom.atStartOfDay(ZoneOffset.UTC).toInstant()
            : null;
        Instant toExclusive = createdTo != null
            ? createdTo.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()
            : null;

        OrderStatus st = parseStatus(status);
        Integer companyId = CrmTenantContext.requireCompanyId();
        Specification<CustomerOrder> spec = CustomerOrderSpecifications.filter(
            companyId,
            storeId,
            search,
            externalNumber,
            clientName,
            address,
            courierId,
            st,
            fromInst,
            toExclusive
        );
        Page<CustomerOrder> page = orderRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(customerOrderMapper::toRowResponse));
    }

    private OrderStatus parseStatus(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return OrderStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown order status: " + raw);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourierOptionResponse> listCourierCandidates() {
        Integer companyId = CrmTenantContext.requireCompanyId();
        List<CourierRefDto> couriers = posCoreClient.listCouriers(companyId);
        return customerOrderMapper.toCourierOptionList(couriers);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerOrderDetailResponse getById(long orderId) {
        CustomerOrder order = requireAccessibleOrder(orderId);
        return customerOrderMapper.toDetailResponse(order);
    }

    @Override
    @Transactional
    public CustomerOrderDetailResponse updateOrder(long orderId, UpdateCustomerOrderRequest req) {
        CustomerOrder order = requireAccessibleOrder(orderId);
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.COMPLETED) {
            throw new BadRequestException("Cannot update order in status " + order.getStatus());
        }
        order.setClientName(req.clientName().trim());
        order.setClientPhone(req.clientPhone().trim());
        order.setDeliveryAddress(req.deliveryAddress().trim());
        order.setComment(StringUtils.hasText(req.comment()) ? req.comment().trim() : null);
        applyCourier(order, req.courierId());
        order.setUpdatedAt(Instant.now());
        LogUtil.info(CustomerOrderServiceImpl.class, "Customer order updated: id={}", orderId);
        return customerOrderMapper.toDetailResponse(order);
    }

    @Override
    @Transactional
    public void cancelOrder(long orderId) {
        CustomerOrder order = requireAccessibleOrder(orderId);
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel completed order");
        }
        order.setStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(Instant.now());
        LogUtil.info(CustomerOrderServiceImpl.class, "Customer order cancelled: id={}", orderId);
    }

    private CustomerOrder requireAccessibleOrder(long orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        Integer companyId = CrmTenantContext.requireCompanyId();
        if (!companyId.equals(order.getCompanyId())) {
            throw new ResourceNotFoundException("Order not found");
        }
        return order;
    }

    private void applyCourier(CustomerOrder order, UUID courierId) {
        if (courierId == null) {
            order.setCourierId(null);
            order.setCourierName(null);
            return;
        }
        CourierRefDto courier = resolveCourier(courierId, order.getCompanyId());
        order.setCourierId(courier.id());
        order.setCourierName(courier.fullName());
    }

    private CourierRefDto resolveCourier(UUID courierId, Integer companyId) {
        return posCoreClient.listCouriers(companyId).stream()
            .filter(c -> c.id().equals(courierId))
            .findFirst()
            .orElseThrow(() -> new BadRequestException("Courier not found or does not belong to this company"));
    }

    @Override
    @Transactional
    public CustomerOrderCreatedResponse createOrder(CreateCustomerOrderRequest req, UUID creatorId) {
        StoreRefDto store = posCoreClient.getStore(req.storeId());
        Integer companyId = CrmTenantContext.requireCompanyId();
        if (store.companyId() == null || !companyId.equals(store.companyId())) {
            throw new BadRequestException("Access denied to this company");
        }

        CourierRefDto courier = req.courierId() != null ? resolveCourier(req.courierId(), companyId) : null;

        String comment = StringUtils.hasText(req.comment()) ? req.comment().trim() : null;

        Instant now = Instant.now();
        CustomerOrder order = CustomerOrder.builder()
            .companyId(companyId)
            .storeId(store.id())
            .storeName(store.name())
            .clientName(req.clientName().trim())
            .clientPhone(req.clientPhone().trim())
            .deliveryAddress(req.deliveryAddress().trim())
            .comment(comment)
            .courierId(courier != null ? courier.id() : null)
            .courierName(courier != null ? courier.fullName() : null)
            .status(OrderStatus.NEW)
            .totalAmount(BigDecimal.ZERO)
            .createdById(creatorId)
            .createdAt(now)
            .updatedAt(now)
            .build();
        order = orderRepository.save(order);
        LogUtil.info(CustomerOrderServiceImpl.class, "Customer order created: id={}, storeId={}", order.getId(), store.id());
        return new CustomerOrderCreatedResponse(order.getId());
    }

    @Override
    @Transactional
    public CustomerOrderCreatedResponse createWithPhotos(int storeId, List<MultipartFile> photos, UUID creatorId) {
        if (photos == null || photos.size() != 5) {
            throw new BadRequestException("Exactly 5 image files are required (photo1 … photo5)");
        }
        for (MultipartFile f : photos) {
            validateImage(f);
        }

        StoreRefDto store = posCoreClient.getStore(storeId);
        Integer companyId = CrmTenantContext.requireCompanyId();
        if (store.companyId() == null || !companyId.equals(store.companyId())) {
            throw new BadRequestException("Access denied to this company");
        }

        Instant now = Instant.now();
        CustomerOrder order = CustomerOrder.builder()
            .companyId(companyId)
            .storeId(store.id())
            .storeName(store.name())
            .status(OrderStatus.NEW)
            .totalAmount(BigDecimal.ZERO)
            .createdById(creatorId)
            .createdAt(now)
            .updatedAt(now)
            .build();
        order = orderRepository.save(order);

        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path dir = root.resolve(String.valueOf(order.getId()));
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new BadRequestException("Cannot create upload directory: " + e.getMessage());
        }

        for (int i = 0; i < 5; i++) {
            MultipartFile mf = photos.get(i);
            String ext = safeExtension(mf.getOriginalFilename());
            String filename = (i + 1) + ext;
            Path target = dir.resolve(filename).normalize();
            if (!target.startsWith(dir)) {
                throw new BadRequestException("Invalid file path");
            }
            try (InputStream in = mf.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new BadRequestException("Failed to save file: " + e.getMessage());
            }

            String ct = Optional.ofNullable(mf.getContentType())
                .filter(c -> c.toLowerCase().startsWith("image/"))
                .orElse("application/octet-stream");

            CustomerOrderPhoto ph = CustomerOrderPhoto.builder()
                .customerOrder(order)
                .slot(i + 1)
                .fileName(filename)
                .contentType(ct)
                .build();
            photoRepository.save(ph);
        }

        LogUtil.info(CustomerOrderServiceImpl.class, "Customer order with photos created: id={}", order.getId());
        return new CustomerOrderCreatedResponse(order.getId());
    }

    private void validateImage(MultipartFile f) {
        if (f == null || f.isEmpty()) {
            throw new BadRequestException("Each photo must be a non-empty image file");
        }
        String ct = f.getContentType();
        if (ct == null || !ct.toLowerCase().startsWith("image/")) {
            throw new BadRequestException("Each part must be an image (Content-Type image/*)");
        }
    }

    private String safeExtension(String original) {
        if (original == null) {
            return ".jpg";
        }
        int dot = original.lastIndexOf('.');
        if (dot < 0 || dot == original.length() - 1) {
            return ".jpg";
        }
        String ext = original.substring(dot).toLowerCase();
        if (ext.matches("\\.(jpg|jpeg|png|gif|webp|bmp)")) {
            return ext;
        }
        return ".jpg";
    }

    @Override
    @Transactional(readOnly = true)
    public PhotoDownload loadPhoto(long orderId, int slot) {
        if (slot < 1 || slot > 5) {
            throw new BadRequestException("Photo slot must be 1..5");
        }
        CustomerOrder order = requireAccessibleOrder(orderId);

        CustomerOrderPhoto ph = photoRepository.findByCustomerOrder_IdAndSlot(orderId, slot)
            .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));

        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path dir = root.resolve(String.valueOf(order.getId())).normalize();
        Path file = dir.resolve(ph.getFileName()).normalize();
        if (!file.startsWith(dir) || !Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("Photo file not found on disk");
        }
        return new PhotoDownload(new FileSystemResource(file), ph.getContentType());
    }
}
