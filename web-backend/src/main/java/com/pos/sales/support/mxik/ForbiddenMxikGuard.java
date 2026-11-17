package com.pos.sales.support.mxik;

import com.pos.catalog.entity.Product;
import com.pos.exception.PosExceptions;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Блокирует продажу товаров с запрещёнными MXIK/IKPU (AUR-14).
 * Вызывается до фискализации — такие позиции не попадают в ФМ.
 */
@Component
public class ForbiddenMxikGuard {

    public void assertProductsAllowed(Collection<Product> products) {
        if (products == null || products.isEmpty()) {
            return;
        }
        for (Product product : products) {
            assertProductAllowed(product);
        }
    }

    public void assertProductAllowed(Product product) {
        if (product == null) {
            return;
        }
        String ikpu = product.getIkpu();
        if (!ForbiddenMxikCodes.isForbidden(ikpu)) {
            return;
        }
        String code = ForbiddenMxikCodes.normalize(ikpu);
        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put("reasonCode", ForbiddenMxikCodes.REASON_CODE);
        ctx.put("mxik", code);
        if (product.getId() != null) {
            ctx.put("productId", String.valueOf(product.getId()));
        }
        String name = product.getName() != null && !product.getName().isBlank()
            ? product.getName()
            : String.valueOf(product.getId());
        throw PosExceptions.badRequest(
            "Товар «" + name + "» нельзя продать: запрещённый код MXIK " + code + ".",
            ctx
        );
    }
}
