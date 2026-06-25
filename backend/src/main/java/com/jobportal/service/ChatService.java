package com.jobportal.service;

import com.jobportal.dto.MessageDTO;
import com.jobportal.exception.JobPortalException;

import java.util.List;

public interface ChatService {
    public MessageDTO sendMessage(Long receiverId, String content) throws JobPortalException;
    public List<MessageDTO> getConversation(Long userId1, Long userId2) throws JobPortalException;
    public List<Long> getChatPartners(Long userId) throws JobPortalException;
    public void markAsRead(Long otherUserId) throws JobPortalException;
}
