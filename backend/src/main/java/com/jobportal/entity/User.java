package com.jobportal.entity;

import com.jobportal.dto.AccountType;
import com.jobportal.dto.UserDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import jakarta.persistence.*;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private AccountType accountType;

    private Long profileId;

    private boolean enabled = true;

    public UserDTO toDTO(){
        // adminKey is a registration-request-only field, never persisted on User —
        // always null when converting an existing entity back to a DTO.
        return new UserDTO(this.id, this.name, this.email, this.password, this.accountType, this.profileId, this.enabled, null);
    }
}
