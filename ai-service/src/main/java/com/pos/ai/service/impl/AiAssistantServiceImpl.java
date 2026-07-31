package com.pos.ai.service.impl;

import com.pos.ai.config.AiAssistantProperties;
import com.pos.ai.dto.AiAssistantChatMessage;
import com.pos.ai.dto.AiAssistantResponse;
import com.pos.ai.exception.BadRequestException;
import com.pos.ai.security.AiTenantContext;
import com.pos.ai.service.AiAssistantService;
import com.pos.ai.service.AiAssistantCompanyRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiAssistantServiceImpl implements AiAssistantService {

    private final AiAssistantProperties properties;
    private final AiAssistantRateLimiter rateLimiter;
    private final AiAssistantGeneralChatService generalChatService;
    private final AiAssistantToolRouter toolRouter;
    private final AiAssistantInsightComposer insightComposer;
    private final AiAssistantCompanyRepository companyRepository;

    @Override
    public AiAssistantResponse ask(String message, List<AiAssistantChatMessage> history) {
        long started = System.currentTimeMillis();
        UUID userId = AiTenantContext.requireUserId();
        Integer companyId = AiTenantContext.requireCompanyId();
        String normalized = normalizePrompt(message);
        List<AiAssistantChatMessage> chatHistory = AiAssistantConversationHistory.sanitize(history);
        String language = toolRouter.detectLanguage(normalized);
        rateLimiter.enforce(userId, properties.getMaxRequestsPerMinutePerUser());

        AiAssistantToolCall toolCall = toolRouter.selectTool(normalized, chatHistory);

        if (AiAssistantToolCatalog.SMALLTALK.equals(toolCall.tool())) {
            String answer = generalChatService.answer(normalized, language, companyId, chatHistory);
            long latency = System.currentTimeMillis() - started;
            return new AiAssistantResponse(answer, AiAssistantToolCatalog.SMALLTALK, latency, Map.of());
        }

        Map<String, Object> toolResult = runTool(toolCall, companyId);
        String answer = insightComposer.compose(normalized, language, toolCall.tool(), toolResult, chatHistory);
        long latency = System.currentTimeMillis() - started;

        LogUtil.info(
                AiAssistantServiceImpl.class,
                "AI assistant request: user={} company={} tool={} latencyMs={} historySize={} ok=true",
                userId,
                companyId,
                toolCall.tool(),
                latency,
                chatHistory.size()
        );
        return new AiAssistantResponse(answer, toolCall.tool(), latency, toolResult);
    }

    private String normalizePrompt(String message) {
        String raw = message != null ? message.trim() : "";
        raw = raw.replace('*', ' ').replaceAll("\\s+", " ").trim();
        if (!StringUtils.hasText(raw)) throw new BadRequestException("Введите вопрос");
        int maxChars = Math.max(50, properties.getMaxPromptChars());
        if (raw.length() > maxChars) throw new BadRequestException("Слишком длинный запрос");
        return raw;
    }

    private Map<String, Object> runTool(AiAssistantToolCall call, Integer companyId) {
        try {
            return companyRepository.runTool(call.tool(), call.from(), call.to(), call.query(), companyId, call.limit());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Неизвестный инструмент ассистента");
        }
    }
}
