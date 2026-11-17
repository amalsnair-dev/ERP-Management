package com.blogtec.aurixwebapi.apiuser;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApiUserRepository extends JpaRepository<ApiUser, Integer> {

    // 🔹 Used for general lookup
    Optional<ApiUser> findByUsernameIgnoreCase(String username);

    // 🔹 Main authentication method (BEST)
    Optional<ApiUser> findByUsernameIgnoreCaseAndShopcodeIgnoreCase(String username, String shopcode);

    // 🔹 Optional: Check existence (useful for validation)
    boolean existsByUsernameAndShopcode(String username, String shopcode);
}