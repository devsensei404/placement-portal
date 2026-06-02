package com.jobportal.jwt;

import com.jobportal.dto.AccountType;
import java.util.Collection;


import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@AllArgsConstructor
@Data
public class CustomUserDetails implements UserDetails {
    private Long id;
    private String username;
    private String password;
    private AccountType accountType;
    private Collection<? extends GrantedAuthority>authorities;
}
