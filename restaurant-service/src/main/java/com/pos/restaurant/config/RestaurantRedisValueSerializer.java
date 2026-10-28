package com.pos.restaurant.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.SerializationException;

/**
 * Root-typed JSON for Spring Cache values (List/menu, DTOs, boxed primitives).
 * Bare {@code mapper.writeValue} drops the outer ArrayList type id; {@code writerFor(Object)} keeps it.
 */
final class RestaurantRedisValueSerializer implements RedisSerializer<Object> {

    private final ObjectMapper mapper;

    RestaurantRedisValueSerializer() {
        ObjectMapper om = new ObjectMapper();
        om.registerModule(new JavaTimeModule());
        om.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.NON_FINAL,
            JsonTypeInfo.As.WRAPPER_ARRAY
        );
        this.mapper = om;
    }

    @Override
    public byte[] serialize(Object value) throws SerializationException {
        if (value == null) {
            return new byte[0];
        }
        try {
            return mapper.writerFor(Object.class).writeValueAsBytes(value);
        } catch (JsonProcessingException ex) {
            throw new SerializationException("Redis cache serialize failed: " + ex.getMessage(), ex);
        }
    }

    @Override
    public Object deserialize(byte[] bytes) throws SerializationException {
        if (bytes == null || bytes.length == 0) {
            return null;
        }
        try {
            return mapper.readValue(bytes, Object.class);
        } catch (Exception ex) {
            throw new SerializationException("Redis cache deserialize failed: " + ex.getMessage(), ex);
        }
    }
}
