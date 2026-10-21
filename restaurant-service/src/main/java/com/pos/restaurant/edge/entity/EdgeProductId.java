package com.pos.restaurant.edge.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class EdgeProductId implements Serializable {
    private UUID id;
    private Integer storeId;

    public EdgeProductId() {}

    public EdgeProductId(UUID id, Integer storeId) {
        this.id = id;
        this.storeId = storeId;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Integer getStoreId() { return storeId; }
    public void setStoreId(Integer storeId) { this.storeId = storeId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof EdgeProductId that)) return false;
        return Objects.equals(id, that.id) && Objects.equals(storeId, that.storeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, storeId);
    }
}
