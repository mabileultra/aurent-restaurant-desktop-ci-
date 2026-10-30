package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.store.CompanyStoreGroupResponse;
import com.pos.dto.store.CreateStoreRequest;
import com.pos.dto.store.StoreResponse;
import com.pos.dto.store.StoreStatsResponse;
import com.pos.dto.store.UpdateStoreRequest;
import com.pos.service.StorePlatformQueryService;
import com.pos.service.StoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stores")
@RequiredArgsConstructor
@Tag(name = "Stores", description = "Управление торговыми точками (магазинами)")
@StandardApiResponses
public class StoreController {

    private final StoreService storeService;
    private final StorePlatformQueryService storePlatformQueryService;

    @GetMapping
    @Operation(summary = "Список магазинов", description = "Магазины, доступные текущему пользователю. companyId — ленивая подгрузка филиалов компании")
    @ApiResponse(responseCode = "200", description = "Список магазинов")
    public List<StoreResponse> list(@RequestParam(required = false) Integer companyId) {
        return storeService.listStores(companyId);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "KPI магазинов", description = "Агрегаты без полной выгрузки таблицы")
    @ApiResponse(responseCode = "200", description = "Статистика")
    public ResponseEntity<StoreStatsResponse> stats(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String businessType,
        @RequestParam(required = false) String regionCode,
        @RequestParam(required = false) Integer companyId
    ) {
        return ResponseEntity.ok(storePlatformQueryService.stats(
            search, status, businessType, regionCode, companyId
        ));
    }

    @GetMapping("/by-company")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Компании с числом филиалов", description = "Страница компаний без вложенных магазинов (филиалы — GET /stores?companyId=)")
    @ApiResponse(responseCode = "200", description = "Список компаний")
    public ResponseEntity<PageResponse<CompanyStoreGroupResponse>> listByCompany(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String businessType,
        @RequestParam(required = false) String regionCode,
        @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(storePlatformQueryService.listByCompany(
            search, status, businessType, regionCode, pageable
        ));
    }

    @GetMapping("/manage")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Управление магазинами", description = "Постраничный список магазинов для администрирования")
    @ApiResponse(responseCode = "200", description = "Список магазинов")
    public ResponseEntity<PageResponse<StoreResponse>> listManaged(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) Integer companyId,
        @RequestParam(required = false) String businessType,
        @RequestParam(required = false) String regionCode,
        @RequestParam(required = false) String districtCode,
        @PageableDefault(size = 14) Pageable pageable
    ) {
        return ResponseEntity.ok(storeService.listManaged(
            search, companyId, businessType, regionCode, districtCode, pageable
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN', 'CASHIER', 'MANAGER')")
    @Operation(summary = "Магазин по ID", description = "Получение магазина по идентификатору")
    @ApiResponse(responseCode = "200", description = "Данные магазина")
    public ResponseEntity<StoreResponse> get(@PathVariable Integer id) {
        return ResponseEntity.ok(storeService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Создать магазин", description = "Создание новой торговой точки")
    @ApiResponse(responseCode = "201", description = "Магазин создан")
    public ResponseEntity<StoreResponse> create(@Valid @RequestBody CreateStoreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(storeService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Обновить магазин", description = "Изменение данных торговой точки")
    @ApiResponse(responseCode = "200", description = "Магазин обновлён")
    public ResponseEntity<StoreResponse> update(
        @PathVariable Integer id,
        @Valid @RequestBody UpdateStoreRequest request
    ) {
        return ResponseEntity.ok(storeService.update(id, request));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Переключить активность", description = "Активация или деактивация магазина")
    @ApiResponse(responseCode = "200", description = "Статус магазина изменён")
    public ResponseEntity<StoreResponse> toggle(@PathVariable Integer id) {
        return ResponseEntity.ok(storeService.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Удалить магазин", description = "Удаление торговой точки")
    @ApiResponse(responseCode = "204", description = "Магазин удалён")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        storeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
