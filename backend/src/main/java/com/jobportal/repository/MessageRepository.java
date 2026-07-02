package com.jobportal.repository;

import com.jobportal.entity.Message;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE " +
            "(m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
            "(m.senderId = :userId2 AND m.receiverId = :userId1) " +
            "ORDER BY m.timestamp ASC")
    List<Message> findConversation(@Param("userId1") Long userId1,
                                   @Param("userId2") Long userId2);

    @Query(value = "SELECT CASE WHEN sender_id = :userId THEN receiver_id ELSE sender_id END AS partner_id " +
            "FROM messages WHERE sender_id = :userId OR receiver_id = :userId " +
            "GROUP BY partner_id " +
            "ORDER BY MAX(timestamp) DESC",
            nativeQuery = true)
    List<Long> findChatPartners(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.read = true WHERE " +
            "m.senderId = :senderId AND m.receiverId = :receiverId AND m.read = false")
    void markMessagesAsRead(@Param("senderId") Long senderId,
                            @Param("receiverId") Long receiverId);
}