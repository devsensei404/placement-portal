package com.jobportal.service;

import com.jobportal.dto.AccountType;
import com.jobportal.dto.UserDTO;
import com.jobportal.entity.Job;
import com.jobportal.entity.User;
import com.jobportal.exception.JobPortalException;
import com.jobportal.jwt.AuthenticationResponse;
import com.jobportal.jwt.CustomUserDetails;
import com.jobportal.jwt.JwtHelper;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.NotificationRepository;
import com.jobportal.repository.ProfileRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.jobportal.jwt.MyUserDetailsService;

import java.util.List;
import java.util.Optional;

@Service(value = "UserService")
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileService profileService;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @Autowired
    private JwtHelper jwtHelper;

    @Override
    public AuthenticationResponse registerUser(UserDTO userDTO) throws JobPortalException {
        Optional<User> optional = userRepository.findByEmail(userDTO.getEmail());
        if (optional.isPresent()) throw new JobPortalException("USER_FOUND");

        userDTO.setProfileId(profileService.createProfile(userDTO.getEmail()));
        userDTO.setPassword(passwordEncoder.encode(userDTO.getPassword()));

        User user = userDTO.toEntity();
        user = userRepository.save(user);

        // generate JWT
        UserDetails userDetails = new CustomUserDetails(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                user.getAccountType()
        );
        String jwt = jwtHelper.generateToken(userDetails);
        return new AuthenticationResponse(jwt);
    }

    @Override
    public UserDTO getUserByEmail(String email) throws JobPortalException {
        return userRepository.findByEmail(email).orElseThrow(()->new JobPortalException("USER_NOT_FOUND")).toDTO();
    }

    @Override
    public void deleteUser(Long id) throws JobPortalException {
        UserDTO loggedInUser = securityUtils.getLoggedInUser();
        if (!loggedInUser.getId().equals(id))
            throw new JobPortalException("UNAUTHORIZED_ACTION");

        User user = userRepository.findById(id)
                .orElseThrow(() -> new JobPortalException("USER_NOT_FOUND"));

        // Step 1 delete notifications
        notificationRepository.deleteByUserId(id);

        //if employer, nullify postedBy on their jobs
        if (user.getAccountType() == AccountType.EMPLOYER) {
            List<Job> postedJobs = jobRepository.findByPostedBy(id, Sort.by(Sort.Direction.DESC, "postTime"));
            for (Job job : postedJobs) {
                job.setPostedBy(null);
                jobRepository.save(job);
            }
        }

        // delete profile (cascades experience, certifications, skills)+user ... eliminate their very existence
        profileRepository.deleteById(user.getProfileId());
        userRepository.deleteById(id);
    }


}
