package com.pos.reporting.util;

import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SqlResourceLoader {

    private final Map<String, String> cache = new ConcurrentHashMap<>();

    public String load(String classpathResource) {
        return cache.computeIfAbsent(classpathResource, this::readResource);
    }

    private String readResource(String classpathResource) {
        try (InputStream input = getClass().getClassLoader().getResourceAsStream(classpathResource)) {
            if (input == null) {
                throw new IllegalStateException("SQL resource not found: " + classpathResource);
            }
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load SQL resource: " + classpathResource, ex);
        }
    }
}
