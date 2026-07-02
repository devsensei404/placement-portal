package com.jobportal.api;

import com.jobportal.dto.ChatPartnerDTO;
import com.jobportal.dto.MessageDTO;
import com.jobportal.dto.ResponseDTO;
import com.jobportal.dto.SendMessageRequest;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.ChatService;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/chat")
public class ChatAPI {

    @Autowired
    private ChatService chatService;

    @Autowired
    private SecurityUtils securityUtils;

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @PostMapping("/send")
    public ResponseEntity<MessageDTO> sendMessage(@RequestBody SendMessageRequest request) throws JobPortalException {
        MessageDTO sent = chatService.sendMessage(request.getReceiverId(), request.getContent());
        return new ResponseEntity<>(sent, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @GetMapping("/{otherUserId}")
    public ResponseEntity<List<MessageDTO>> getConversation(@PathVariable Long otherUserId) throws JobPortalException {
        Long loggedInUserId = securityUtils.getLoggedInUser().getId();
        return new ResponseEntity<>(chatService.getConversation(loggedInUserId, otherUserId), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @GetMapping("/partners")
    public ResponseEntity<List<ChatPartnerDTO>> getChatPartners() throws JobPortalException {
        Long loggedInUserId = securityUtils.getLoggedInUser().getId();
        return new ResponseEntity<>(chatService.getChatPartners(loggedInUserId), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('APPLICANT', 'EMPLOYER')")
    @PutMapping("/read/{otherUserId}")
    public ResponseEntity<ResponseDTO> markAsRead(@PathVariable Long otherUserId) throws JobPortalException {
        chatService.markAsRead(otherUserId);
        return new ResponseEntity<>(new ResponseDTO("Messages marked as read"), HttpStatus.OK);
    }
}
