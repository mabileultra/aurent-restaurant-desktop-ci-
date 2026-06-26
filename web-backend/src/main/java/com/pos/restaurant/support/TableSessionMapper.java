package com.pos.restaurant.support;

import com.pos.restaurant.dto.TableSessionLineResponse;
import com.pos.restaurant.dto.TableSessionResponse;
import com.pos.restaurant.dto.TableSessionSummaryResponse;
import com.pos.restaurant.entity.TableSession;
import com.pos.restaurant.entity.TableSessionLine;
import com.pos.util.MoneyCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TableSessionMapper {

    private final KitchenDepartmentResolver departmentResolver;

    public TableSessionLineResponse toLineResponse(TableSessionLine line) {
        BigDecimal discountPercent = line.getLineDiscountPercent() != null
            ? line.getLineDiscountPercent()
            : BigDecimal.ZERO;
        BigDecimal discountAmount = MoneyCalculator.lineGrossBeforeDiscount(line.getUnitPrice(), line.getQuantity())
            .multiply(discountPercent)
            .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal lineTotal = MoneyCalculator.lineGross(line.getUnitPrice(), line.getQuantity(), discountAmount);
        String kitchenDepartment = departmentResolver.resolve(line.getProduct().getId());
        boolean kitchenRoutable = departmentResolver.isKitchenRoutable(kitchenDepartment);
        return new TableSessionLineResponse(
            line.getId(),
            line.getProduct().getId(),
            line.getProduct().getName(),
            line.getProduct().getSku(),
            line.getQuantity(),
            line.getUnitPrice(),
            discountPercent,
            lineTotal,
            line.getNote(),
            line.getKitchenStatus(),
            kitchenDepartment,
            kitchenRoutable,
            line.getSortOrder()
        );
    }

    public List<TableSessionLineResponse> toLineResponses(List<TableSessionLine> lines) {
        return lines.stream().map(this::toLineResponse).toList();
    }

    public BigDecimal calculateSubtotal(List<TableSessionLine> lines) {
        return lines.stream()
            .map(this::toLineResponse)
            .map(TableSessionLineResponse::lineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);
    }

    public TableSessionSummaryResponse toSummary(TableSession session, List<TableSessionLine> lines) {
        String waiterName = session.getWaiter() != null
            ? displayName(session.getWaiter().getFullName(), session.getWaiter().getUsername())
            : null;
        List<TableSessionLine> sortedLines = lines.stream()
            .sorted(Comparator.comparingInt(TableSessionLine::getSortOrder))
            .toList();
        int previewLimit = 2;
        List<String> previewItems = sortedLines.stream()
            .limit(previewLimit)
            .map(line -> line.getProduct().getName())
            .toList();
        int moreItemsCount = Math.max(0, sortedLines.size() - previewLimit);
        return new TableSessionSummaryResponse(
            session.getId(),
            session.getGuestCount(),
            waiterName,
            session.getOpenedAt(),
            lines.size(),
            calculateSubtotal(lines),
            previewItems,
            moreItemsCount
        );
    }

    public TableSessionResponse toResponse(TableSession session, List<TableSessionLine> lines) {
        List<TableSessionLineResponse> lineResponses = toLineResponses(lines);
        BigDecimal subtotal = lineResponses.stream()
            .map(TableSessionLineResponse::lineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);
        return new TableSessionResponse(
            session.getId(),
            session.getTable().getId(),
            session.getTable().getCode(),
            session.getTable().getLabel(),
            session.getStore().getId(),
            session.getOpenedBy().getId(),
            displayName(session.getOpenedBy().getFullName(), session.getOpenedBy().getUsername()),
            session.getWaiter() != null ? session.getWaiter().getId() : null,
            session.getWaiter() != null
                ? displayName(session.getWaiter().getFullName(), session.getWaiter().getUsername())
                : null,
            session.getGuestCount(),
            session.getStatus(),
            session.getSale() != null ? session.getSale().getId() : null,
            session.getNotes(),
            session.getOpenedAt(),
            session.getClosedAt(),
            subtotal,
            lineResponses.size(),
            lineResponses
        );
    }

    private static String displayName(String fullName, String username) {
        if (fullName != null && !fullName.isBlank()) {
            return fullName.trim();
        }
        return username;
    }
}
