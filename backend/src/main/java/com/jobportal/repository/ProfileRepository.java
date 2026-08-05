package com.jobportal.repository;

import com.jobportal.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfileRepository extends JpaRepository<Profile,Long>{

    List<Profile> findByCompanyId(Long companyId);

}
