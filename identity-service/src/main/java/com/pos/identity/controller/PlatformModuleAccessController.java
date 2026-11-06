package com.pos.identity.controller;

import com.pos.identity.dto.access.AdminModuleCatalogItem;
import com.pos.identity.dto.access.BulkResetModuleAccessRequest;
import com.pos.identity.dto.access.CopyModuleAccessRequest;
import com.pos.identity.dto.access.ModuleAccessHistoryItem;
import com.pos.identity.dto.access.ModuleAccessMutationResponse;
import com.pos.identity.dto.access.ModuleAccessStatsResponse;
import com.pos.identity.dto.access.RoleTemplateResponse;
import com.pos.identity.dto.access.UpdateRoleTemplateRequest;
import com.pos.identity.dto.access.UpdateUserModuleAccessRequest;
import com.pos.identity.dto.access.UserModuleAccessDetailResponse;
import com.pos.identity.dto.access.UserModuleAccessSummary;
import com.pos.identity.dto.shared.PageResponse;
import com.pos.identity.service.ModuleAccessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/platform/module-access")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PLATFORM_ADMIN')")
@Tag(name = "Platform Module Access", description = "Управление доступом к модулям (SUPER_ADMIN, PLATFORM_ADMIN)")
public class PlatformModuleAccessController {

    private final ModuleAccessService moduleAccessService;

    @GetMapping("/catalog")
    @Operation(summary = "Каталог модулей", description = "Список модулей, доступных для назначения")
    @ApiResponse(responseCode = "200", description = "Каталог модулей")
    public ResponseEntity<List<AdminModuleCatalogItem>> catalog() {
        return ResponseEntity.ok(moduleAccessService.catalog());
    }

    @GetMapping("/stats")
    @Operation(
        summary = "Агрегаты Access V2",
        description = "Счётчики сотрудников и исключений по businessType и role"
    )
    @ApiResponse(responseCode = "200", description = "Статистика")
    public ResponseEntity<ModuleAccessStatsResponse> stats(
        @RequestParam(required = false) String businessType
    ) {
        return ResponseEntity.ok(moduleAccessService.stats(businessType));
    }

    @GetMapping("/role-templates/{businessType}/{role}")
    @Operation(summary = "Шаблон модулей роли", description = "DEFAULT из enum или сохранённый TEMPLATE")
    @ApiResponse(responseCode = "200", description = "Шаблон")
    public ResponseEntity<RoleTemplateResponse> getRoleTemplate(
        @PathVariable String businessType,
        @PathVariable String role
    ) {
        return ResponseEntity.ok(moduleAccessService.getRoleTemplate(businessType, role));
    }

    @PutMapping("/role-templates/{businessType}/{role}")
    @Operation(summary = "Сохранить шаблон роли", description = "applyToExisting учитывает сотрудников без istisno")
    @ApiResponse(responseCode = "200", description = "Шаблон сохранён")
    public ResponseEntity<RoleTemplateResponse> updateRoleTemplate(
        @PathVariable String businessType,
        @PathVariable String role,
        @Valid @RequestBody UpdateRoleTemplateRequest request
    ) {
        return ResponseEntity.ok(moduleAccessService.updateRoleTemplate(businessType, role, request));
    }

    @GetMapping("/users")
    @Operation(
        summary = "Пользователи для доступа",
        description = "Страница пользователей; platformOnly=true — только staff платформы; role фильтрует по роли"
    )
    @ApiResponse(responseCode = "200", description = "Страница пользователей")
    public ResponseEntity<PageResponse<UserModuleAccessSummary>> listUsers(
        @RequestParam(required = false) Integer companyId,
        @RequestParam(defaultValue = "false") boolean platformOnly,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String accessFilter,
        @RequestParam(required = false) String businessType,
        @RequestParam(required = false) String role,
        @PageableDefault(size = 30) Pageable pageable
    ) {
        return ResponseEntity.ok(moduleAccessService.listUsersPaged(
            companyId, platformOnly, search, accessFilter, businessType, role, pageable
        ));
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Доступ пользователя", description = "Детальная информация о доступе пользователя к модулям")
    @ApiResponse(responseCode = "200", description = "Доступ пользователя")
    public ResponseEntity<UserModuleAccessDetailResponse> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(moduleAccessService.getUserAccess(userId));
    }

    @PutMapping("/users/{userId}")
    @Operation(summary = "Обновить доступ", description = "Изменение набора модулей, доступных пользователю")
    @ApiResponse(responseCode = "200", description = "Доступ обновлён")
    public ResponseEntity<UserModuleAccessDetailResponse> updateUser(
        @PathVariable UUID userId,
        @Valid @RequestBody UpdateUserModuleAccessRequest request
    ) {
        return ResponseEntity.ok(moduleAccessService.updateUserAccess(userId, request));
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Сбросить доступ", description = "Сброс индивидуального доступа к модулям (к значениям по умолчанию)")
    @ApiResponse(responseCode = "200", description = "Доступ сброшен")
    public ResponseEntity<UserModuleAccessDetailResponse> resetUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(moduleAccessService.resetUserAccess(userId));
    }

    @PostMapping("/copy")
    @Operation(summary = "Копировать доступ", description = "MERGE или REPLACE прав с source на targetUserIds")
    @ApiResponse(responseCode = "200", description = "Скопировано")
    public ResponseEntity<ModuleAccessMutationResponse> copy(
        @Valid @RequestBody CopyModuleAccessRequest request
    ) {
        return ResponseEntity.ok(moduleAccessService.copyAccess(request));
    }

    @PostMapping("/bulk-reset")
    @Operation(summary = "Массовый сброс", description = "Сброс выбранных пользователей к шаблону роли")
    @ApiResponse(responseCode = "200", description = "Сброшено")
    public ResponseEntity<ModuleAccessMutationResponse> bulkReset(
        @Valid @RequestBody BulkResetModuleAccessRequest request
    ) {
        return ResponseEntity.ok(moduleAccessService.bulkResetAccess(request));
    }

    @GetMapping("/history")
    @Operation(summary = "Журнал изменений доступа", description = "Аудит изменений module access")
    @ApiResponse(responseCode = "200", description = "Страница истории")
    public ResponseEntity<PageResponse<ModuleAccessHistoryItem>> history(
        @RequestParam(required = false) UUID targetUserId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(moduleAccessService.history(targetUserId, pageable));
    }

    @PostMapping("/history/{historyId}/revert")
    @Operation(summary = "Откат изменения", description = "Восстановить состояние до записи журнала")
    @ApiResponse(responseCode = "200", description = "Откат выполнен")
    public ResponseEntity<ModuleAccessHistoryItem> revert(@PathVariable UUID historyId) {
        return ResponseEntity.ok(moduleAccessService.revertHistory(historyId));
    }
}
