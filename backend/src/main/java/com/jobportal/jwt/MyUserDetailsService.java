package com.jobportal.jwt;

import com.jobportal.dto.UserDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class MyUserDetailsService implements UserDetailsService {

    @Autowired
    private UserService userService;
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        try{
            UserDTO dto=userService.getUserByEmail(email);
            return new CustomUserDetails(dto.getId(),email,dto.getPassword(),dto.getAccountType(),new ArrayList<>());
        }
        catch (JobPortalException e){
            e.printStackTrace();
        }
        return null;
    }
}
