package com.jobportal.service;

import com.jobportal.dto.*;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.AdminAuditLogRepository;
import com.jobportal.repository.ApplicantRepository;
import com.jobportal.repository.CompanyRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service("adminAnalyticsService")
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private AdminAuditLogRepository adminAuditLogRepository;

    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("MMM d");
    private static final DateTimeFormatter WEEK_LABEL = DateTimeFormatter.ofPattern("MMM d");
    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM yyyy");

    private record BucketPlan(String sqlUnit, LocalDateTime from, ChronoUnit stepUnit, DateTimeFormatter label) {}

    private BucketPlan resolvePlan(AnalyticsGranularity granularity, AnalyticsTrend trend) throws JobPortalException {
        if (granularity != null && trend != null) {
            throw new JobPortalException("ANALYTICS_CONFLICTING_PARAMS");
        }
        if (trend != null) {
            return switch (trend) {
                case WEEKLY -> new BucketPlan("week", LocalDateTime.now().minusWeeks(12), ChronoUnit.WEEKS, WEEK_LABEL);
                case MONTHLY -> new BucketPlan("month", LocalDateTime.now().minusMonths(12), ChronoUnit.MONTHS, MONTH_LABEL);
            };
        }
        AnalyticsGranularity g = granularity == null ? AnalyticsGranularity.WEEK : granularity;
        return switch (g) {
            case WEEK -> new BucketPlan("day", LocalDateTime.now().minusDays(7), ChronoUnit.DAYS, DAY_LABEL);
            case MONTH -> new BucketPlan("day", LocalDateTime.now().minusDays(30), ChronoUnit.DAYS, DAY_LABEL);
        };
    }

    private List<LocalDate> expectedBuckets(BucketPlan plan) {
        List<LocalDate> buckets = new ArrayList<>();
        LocalDate cursor = truncate(plan.from().toLocalDate(), plan.stepUnit());
        LocalDate end = truncate(LocalDate.now(), plan.stepUnit());
        while (!cursor.isAfter(end)) {
            buckets.add(cursor);
            cursor = switch (plan.stepUnit()) {
                case DAYS -> cursor.plusDays(1);
                case WEEKS -> cursor.plusWeeks(1);
                case MONTHS -> cursor.plusMonths(1);
                default -> throw new IllegalStateException("Unsupported step unit: " + plan.stepUnit());
            };
        }
        return buckets;
    }

    private LocalDate truncate(LocalDate date, ChronoUnit unit) {
        return switch (unit) {
            case DAYS -> date;
            case WEEKS -> date.minusDays(date.getDayOfWeek().getValue() - 1L);
            case MONTHS -> date.withDayOfMonth(1);
            default -> throw new IllegalStateException("Unsupported step unit: " + unit);
        };
    }

    private List<AnalyticsPointDTO> zeroFill(BucketPlan plan, Map<LocalDate, Long> rawCounts) {
        List<AnalyticsPointDTO> points = new ArrayList<>();
        for (LocalDate bucket : expectedBuckets(plan)) {
            long count = rawCounts.getOrDefault(bucket, 0L);
            points.add(new AnalyticsPointDTO(bucket, plan.label().format(bucket), count));
        }
        return points;
    }

    private LocalDate toLocalDate(Object bucketStart) {
        if (bucketStart instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toLocalDate();
        if (bucketStart instanceof LocalDateTime ldt) return ldt.toLocalDate();
        if (bucketStart instanceof LocalDate ld) return ld;
        throw new IllegalStateException("Unexpected bucketStart type: " + bucketStart.getClass());
    }

    @Override
    public SignupsAnalyticsDTO getSignupsAnalytics(AnalyticsGranularity granularity, AnalyticsTrend trend) throws JobPortalException {
        BucketPlan plan = resolvePlan(granularity, trend);
        List<Object[]> rows = userRepository.countSignupsByBucketAndAccountType(plan.sqlUnit(), plan.from());

        Map<LocalDate, Long> totalRaw = new LinkedHashMap<>();
        Map<AccountType, Map<LocalDate, Long>> byTypeRaw = new LinkedHashMap<>();
        for (AccountType type : AccountType.values()) byTypeRaw.put(type, new LinkedHashMap<>());

        for (Object[] row : rows) {
            LocalDate bucket = toLocalDate(row[0]);
            AccountType type = AccountType.valueOf((String) row[1]);
            long count = ((Number) row[2]).longValue();
            byTypeRaw.get(type).merge(bucket, count, Long::sum);
            totalRaw.merge(bucket, count, Long::sum);
        }

        Map<AccountType, List<AnalyticsPointDTO>> byAccountType = new LinkedHashMap<>();
        for (AccountType type : AccountType.values()) {
            byAccountType.put(type, zeroFill(plan, byTypeRaw.get(type)));
        }

        return new SignupsAnalyticsDTO(zeroFill(plan, totalRaw), byAccountType);
    }

    @Override
    public JobsAnalyticsDTO getJobsAnalytics(AnalyticsGranularity granularity, AnalyticsTrend trend) throws JobPortalException {
        BucketPlan plan = resolvePlan(granularity, trend);
        List<Object[]> rows = jobRepository.countJobsByBucketAndStatus(plan.sqlUnit(), plan.from());

        Map<LocalDate, Long> totalRaw = new LinkedHashMap<>();
        Map<JobStatus, Map<LocalDate, Long>> byStatusRaw = new LinkedHashMap<>();
        for (JobStatus status : JobStatus.values()) byStatusRaw.put(status, new LinkedHashMap<>());

        for (Object[] row : rows) {
            LocalDate bucket = toLocalDate(row[0]);
            JobStatus status = JobStatus.valueOf((String) row[1]);
            long count = ((Number) row[2]).longValue();
            byStatusRaw.get(status).merge(bucket, count, Long::sum);
            totalRaw.merge(bucket, count, Long::sum);
        }

        Map<JobStatus, List<AnalyticsPointDTO>> byStatus = new LinkedHashMap<>();
        for (JobStatus status : JobStatus.values()) {
            byStatus.put(status, zeroFill(plan, byStatusRaw.get(status)));
        }

        return new JobsAnalyticsDTO(zeroFill(plan, totalRaw), byStatus);
    }

    @Override
    public List<AnalyticsPointDTO> getApplicationsAnalytics(AnalyticsGranularity granularity, AnalyticsTrend trend) throws JobPortalException {
        BucketPlan plan = resolvePlan(granularity, trend);
        List<Object[]> rows = applicantRepository.countApplicationsByBucket(plan.sqlUnit(), plan.from());

        Map<LocalDate, Long> raw = new LinkedHashMap<>();
        for (Object[] row : rows) {
            raw.merge(toLocalDate(row[0]), ((Number) row[1]).longValue(), Long::sum);
        }
        return zeroFill(plan, raw);
    }

    @Override
    public CompanyApprovalsAnalyticsDTO getCompanyApprovalsAnalytics(AnalyticsGranularity granularity, AnalyticsTrend trend) throws JobPortalException {
        BucketPlan plan = resolvePlan(granularity, trend);

        Map<LocalDate, Long> submittedRaw = new LinkedHashMap<>();
        for (Object[] row : companyRepository.countSubmissionsByBucket(plan.sqlUnit(), plan.from())) {
            submittedRaw.merge(toLocalDate(row[0]), ((Number) row[1]).longValue(), Long::sum);
        }

        Map<LocalDate, Long> approvedRaw = new LinkedHashMap<>();
        Map<LocalDate, Long> rejectedRaw = new LinkedHashMap<>();
        Map<LocalDate, Long> suspendedRaw = new LinkedHashMap<>();
        Map<LocalDate, Long> unsuspendedRaw = new LinkedHashMap<>();

        for (Object[] row : adminAuditLogRepository.countCompanyTransitionsByBucketAndAction(plan.sqlUnit(), plan.from())) {
            LocalDate bucket = toLocalDate(row[0]);
            String action = (String) row[1];
            long count = ((Number) row[2]).longValue();
            switch (action) {
                case "APPROVE_COMPANY" -> approvedRaw.merge(bucket, count, Long::sum);
                case "REJECT_COMPANY" -> rejectedRaw.merge(bucket, count, Long::sum);
                case "SUSPEND_COMPANY" -> suspendedRaw.merge(bucket, count, Long::sum);
                case "UNSUSPEND_COMPANY" -> unsuspendedRaw.merge(bucket, count, Long::sum);
                default -> {}
            }
        }

        return new CompanyApprovalsAnalyticsDTO(
                zeroFill(plan, submittedRaw),
                zeroFill(plan, approvedRaw),
                zeroFill(plan, rejectedRaw),
                zeroFill(plan, suspendedRaw),
                zeroFill(plan, unsuspendedRaw)
        );
    }

    @Override
    public AnalyticsSummaryDTO getSummary() throws JobPortalException {
        Map<AccountType, Long> usersByType = new LinkedHashMap<>();
        long totalUsers = 0;
        for (AccountType type : AccountType.values()) {
            long count = userRepository.countByAccountType(type);
            usersByType.put(type, count);
            totalUsers += count;
        }

        long activeJobs = jobRepository.countByStatus(JobStatus.OPEN);

        Map<CompanyStatus, Long> companiesByStatus = new LinkedHashMap<>();
        long totalCompanies = 0;
        for (CompanyStatus status : CompanyStatus.values()) {
            long count = companyRepository.countByStatus(status);
            companiesByStatus.put(status, count);
            totalCompanies += count;
        }

        long totalApplications = applicantRepository.count();
        long pendingApprovals = companiesByStatus.getOrDefault(CompanyStatus.PENDING, 0L);

        return new AnalyticsSummaryDTO(usersByType, totalUsers, activeJobs, companiesByStatus, totalCompanies, totalApplications, pendingApprovals);
    }
}
