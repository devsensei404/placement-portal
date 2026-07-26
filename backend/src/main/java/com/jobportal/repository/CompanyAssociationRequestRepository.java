package com.jobportal.repository;

import com.jobportal.dto.AssociationStatus;
import com.jobportal.entity.CompanyAssociationRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompanyAssociationRequestRepository extends JpaRepository<CompanyAssociationRequest, Long> {

    List<CompanyAssociationRequest> findByCompanyIdAndStatus(Long companyId, AssociationStatus status);

    List<CompanyAssociationRequest> findByRecruiterId(Long recruiterId);
}
