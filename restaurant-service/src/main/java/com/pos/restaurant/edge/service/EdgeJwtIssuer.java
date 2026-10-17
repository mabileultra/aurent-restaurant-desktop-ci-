package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.entity.EdgeStaff;
import com.pos.shared.jwt.JwtClaimNames;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeJwtIssuer {

    private final SecretKey key;
    private final long expirationMs;

    public EdgeJwtIssuer(
        @Value("${app.jwt.secret}") String secret,
        @Value("${app.jwt.expiration-ms:86400000}") long expirationMs
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String issue(EdgeStaff staff) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(JwtClaimNames.COMPANY_ID, staff.getCompanyId());
        claims.put(JwtClaimNames.ROLES, List.of(staff.getRole()));
        claims.put(JwtClaimNames.CAN_REQUEST_BILL, staff.isCanRequestBill());
        long now = System.currentTimeMillis();
        return Jwts.builder()
            .claims(claims)
            .subject(staff.getUserId().toString())
            .issuedAt(new Date(now))
            .expiration(new Date(now + expirationMs))
            .signWith(key)
            .compact();
    }
}
