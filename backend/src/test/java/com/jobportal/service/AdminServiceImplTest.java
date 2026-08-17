package com.jobportal.service;

import com.jobportal.dto.AccountType;
import com.jobportal.entity.Company;
import com.jobportal.entity.User;
import com.jobportal.dto.CompanyStatus;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminServiceImplTest {

    @Mock private NotificationMailService notificationMailService;
    @Mock private CompanyRepository companyRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void cannotDeleteAnAdminAccount() {
        User admin = new User();
        admin.setId(1L);
        admin.setAccountType(AccountType.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        JobPortalException ex = assertThrows(JobPortalException.class, () -> adminService.deleteAccount(1L));
        assertEquals("CANNOT_MODIFY_ADMIN_ACCOUNT", ex.getMessage());
    }

    @Test
    void cannotBanAnAdminAccount() {
        User admin = new User();
        admin.setId(1L);
        admin.setAccountType(AccountType.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        JobPortalException ex = assertThrows(JobPortalException.class, () -> adminService.banUser(1L));
        assertEquals("CANNOT_MODIFY_ADMIN_ACCOUNT", ex.getMessage());
    }

    @Test
    void cannotRejectAnAlreadyApprovedCompany() {
        Company company = new Company();
        company.setId(2L);
        company.setStatus(CompanyStatus.APPROVED);
        when(companyRepository.findById(2L)).thenReturn(Optional.of(company));

        JobPortalException ex = assertThrows(JobPortalException.class, () -> adminService.rejectCompany(2L));
        assertEquals("COMPANY_NOT_PENDING", ex.getMessage());
    }

    @Test
    void cannotSuspendACompanyThatIsNotApproved() {
        Company company = new Company();
        company.setId(2L);
        company.setStatus(CompanyStatus.PENDING);
        when(companyRepository.findById(2L)).thenReturn(Optional.of(company));

        JobPortalException ex = assertThrows(JobPortalException.class, () -> adminService.suspendCompany(2L));
        assertEquals("COMPANY_NOT_APPROVED", ex.getMessage());
    }
}
