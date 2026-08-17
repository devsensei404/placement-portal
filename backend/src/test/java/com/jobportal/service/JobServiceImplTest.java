package com.jobportal.service;

import com.jobportal.dto.ApplicationDTO;
import com.jobportal.dto.ApplicationStatus;
import com.jobportal.entity.Applicant;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.*;
import com.jobportal.utility.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JobServiceImplTest {

    @Mock private ApplicantRepository applicantRepository;
    @Mock private UserRepository userRepository;
    @Mock private JobRepository jobRepository;
    @Mock private ProfileRepository profileRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private NotificationService notificationService;
    @Mock private NotificationMailService notificationMailService;
    @Mock private SecurityUtils securityUtils;

    @InjectMocks
    private JobServiceImpl jobService;

    private Applicant applicant;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        applicant = new Applicant();
        applicant.setApplicationId(5L);
        when(applicantRepository.findById(5L)).thenReturn(Optional.of(applicant));
    }

    @Test
    void rejectedCannotMoveToInterviewing() {
        applicant.setApplicationStatus(ApplicationStatus.REJECTED);
        ApplicationDTO dto = new ApplicationDTO(5L, null, null, ApplicationStatus.INTERVIEWING, null);

        JobPortalException ex = assertThrows(JobPortalException.class, () -> jobService.changeAppStatus(dto));
        assertEquals("INVALID_STATUS_TRANSITION", ex.getMessage());
    }

    @Test
    void offeredCannotMoveBackToInterviewing() {
        applicant.setApplicationStatus(ApplicationStatus.OFFERED);
        ApplicationDTO dto = new ApplicationDTO(5L, null, null, ApplicationStatus.INTERVIEWING, null);

        JobPortalException ex = assertThrows(JobPortalException.class, () -> jobService.changeAppStatus(dto));
        assertEquals("INVALID_STATUS_TRANSITION", ex.getMessage());
    }

    @Test
    void offeredCanStillBeRejected() {
        applicant.setApplicationStatus(ApplicationStatus.OFFERED);
        ApplicationDTO dto = new ApplicationDTO(5L, null, null, ApplicationStatus.REJECTED, null);

        assertDoesNotThrow(() -> jobService.changeAppStatus(dto));
        assertEquals(ApplicationStatus.REJECTED, applicant.getApplicationStatus());
    }

    @Test
    void appliedCanMoveToInterviewing() {
        applicant.setApplicationStatus(ApplicationStatus.APPLIED);
        ApplicationDTO dto = new ApplicationDTO(5L, null, null, ApplicationStatus.INTERVIEWING, null);

        assertDoesNotThrow(() -> jobService.changeAppStatus(dto));
        assertEquals(ApplicationStatus.INTERVIEWING, applicant.getApplicationStatus());
    }

    @Test
    void interviewingCanRescheduleItself() {
        applicant.setApplicationStatus(ApplicationStatus.INTERVIEWING);
        ApplicationDTO dto = new ApplicationDTO(5L, null, null, ApplicationStatus.INTERVIEWING, null);

        assertDoesNotThrow(() -> jobService.changeAppStatus(dto));
    }
}
