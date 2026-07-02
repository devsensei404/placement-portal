package com.jobportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatPartnerDTO {
    private Long userId;
    private String name;
    private String profilePictureUrl; // optional but nice for inbox avatars
}