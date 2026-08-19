package com.jobportal.repository;

import com.jobportal.dto.AccountType;
import com.jobportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    public Optional<User> findByEmail(String email);

    public List<User> findByAccountType(AccountType accountType);

    public long countByAccountType(AccountType accountType);

    public Optional<User> findByProfileId(Long profileId);

    @Query(value = """
            SELECT date_trunc(:bucketUnit, created_at) AS bucketStart,
                   account_type,
                   COUNT(*) AS count
            FROM users
            WHERE created_at IS NOT NULL
              AND created_at >= :from
            GROUP BY bucketStart, account_type
            ORDER BY bucketStart
            """, nativeQuery = true)
    List<Object[]> countSignupsByBucketAndAccountType(@Param("bucketUnit") String bucketUnit,
                                                        @Param("from") LocalDateTime from);
}
