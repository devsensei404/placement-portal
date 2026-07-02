package com.jobportal.service;

import com.jobportal.dto.ChatPartnerDTO;
import com.jobportal.dto.MessageDTO;
import com.jobportal.entity.Message;
import com.jobportal.entity.Profile;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.MessageRepository;
import com.jobportal.repository.ProfileRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service("chatService")
public class ChatServiceImpl implements ChatService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public List<ChatPartnerDTO> getChatPartners(Long userId) throws JobPortalException {
        List<Long> partnerIds = messageRepository.findChatPartners(userId);
        return partnerIds.stream().map(partnerId -> {
            // partnerId is a userId — look up the user first to get profileId
            return userRepository.findById(partnerId).map(user -> {
                Profile profile = profileRepository.findById(user.getProfileId()).orElse(null);
                String name = profile != null ? profile.getName() : "Unknown User";
                String pic = profile != null ? profile.getProfilePictureUrl() : null;
                return new ChatPartnerDTO(partnerId, name, pic);
            }).orElse(new ChatPartnerDTO(partnerId, "Unknown User", null));
        }).toList();
    }

    @Override
    public MessageDTO sendMessage(Long receiverId, String content) throws JobPortalException {
        // Extract sender from JWT — never trust client-provided senderId
        Long senderId = securityUtils.getLoggedInUser().getId();

        Message message = new Message();
        message.setSenderId(senderId);
        message.setReceiverId(receiverId);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());
        message.setRead(false); // always false on send

        return messageRepository.save(message).toDTO();
    }

    @Override
    public List<MessageDTO> getConversation(Long userId1, Long userId2) throws JobPortalException {
        return messageRepository.findConversation(userId1, userId2)
                .stream()
                .map(Message::toDTO)
                .toList();
    }

    @Override
    public void markAsRead(Long otherUserId) throws JobPortalException {
        // Logged-in user is the receiver, otherUserId is the sender
        Long loggedInUserId = securityUtils.getLoggedInUser().getId();
        messageRepository.markMessagesAsRead(otherUserId, loggedInUserId);
    }
}