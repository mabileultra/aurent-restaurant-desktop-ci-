package com.pos.platform.security;

import com.pos.shared.jwt.JwtClaimsExtractor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secretKey;

    public Integer extractCompanyId(String token) {
        return JwtClaimsExtractor.extractCompanyId(JwtClaimsExtractor.parseAllClaims(token, secretKey));
    }

    public UUID extractUserId(String token) {
        return JwtClaimsExtractor.extractUserId(JwtClaimsExtractor.parseAllClaims(token, secretKey));
    }

    public String extractRole(String token) {
        return JwtClaimsExtractor.extractPrimaryRole(JwtClaimsExtractor.parseAllClaims(token, secretKey));
    }

    public boolean isTokenValid(String token) {
        return JwtClaimsExtractor.isTokenParsable(token, secretKey);
    }
}
