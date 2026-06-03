package com.jobportal.service;

import com.jobportal.exception.JobPortalException;

public interface ProfileService {

    public Long createProfile(String email) throws JobPortalException;

}
