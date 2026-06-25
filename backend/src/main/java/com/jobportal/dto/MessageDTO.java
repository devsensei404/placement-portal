package com.jobportal.dto;

import com.jobportal.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    private Long id;
    private Long senderId;
    private Long receiverId;
    private String content;
    private LocalDateTime timestamp;
    private Boolean read;

    public Message toEntity() {
        return new Message(this.id, this.senderId, this.receiverId, this.content, this.timestamp, this.read);
    }
}