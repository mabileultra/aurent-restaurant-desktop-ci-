package com.pos.ai.service;

import com.pos.ai.dto.AiAssistantChatMessage;
import com.pos.ai.dto.AiAssistantResponse;

import java.util.List;

public interface AiAssistantService {
    AiAssistantResponse ask(String message, List<AiAssistantChatMessage> history);
}
