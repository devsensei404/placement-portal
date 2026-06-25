package com.jobportal.entity;

import com.jobportal.dto.MessageDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long senderId;
    private Long receiverId;
    @Column(length = 2000)
    private String content;
    private LocalDateTime timestamp;
    private Boolean read;

    public MessageDTO toDTO() {
        return new MessageDTO(this.id, this.senderId, this.receiverId, this.content, this.timestamp, this.read);
    }
}