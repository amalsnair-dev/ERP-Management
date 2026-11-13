package com.blogtec.aurixwebapi.apiuser;

import java.util.Optional;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.lang.Nullable;

@Service
public class ApiUserServiceImpl implements ApiUserService {

    @Autowired
    private ApiUserRepository apiUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ============================
    // CREATE USER
    // ============================
    @Override
    public ApiUser create(ApiUser apiUser) {

        if (apiUser.getPassword() != null) {
            apiUser.setPassword(passwordEncoder.encode(apiUser.getPassword()));
        }

        return apiUserRepository.save(apiUser);
    }

    // ============================
    // UPDATE USER
    // ============================
    @SuppressWarnings("null")
	@Override
    @Nullable
    public ApiUser update(int userid, ApiUser apiUser) {

        return apiUserRepository.findById(userid)
                .map(existingUser -> {

                    if (apiUser.getUsername() != null) {
                        existingUser.setUsername(apiUser.getUsername());
                    }

                    if (apiUser.getPassword() != null && !apiUser.getPassword().isBlank()
                            && !apiUser.getPassword().equals(existingUser.getPassword())) {
                        existingUser.setPassword(passwordEncoder.encode(apiUser.getPassword()));
                    }

                    if (apiUser.getRole() != null) {
                        existingUser.setRole(apiUser.getRole());
                    }

                    if (apiUser.getShopcode() != null) {
                        existingUser.setShopcode(apiUser.getShopcode());
                    }

                    return Objects.requireNonNull(apiUserRepository.save(existingUser));
                })
                .orElse(null);
    }

    // ============================
    // DELETE USER
    // ============================
    @Override
    public ResponseEntity<ApiUserResponse> deleteById(int userid) {

        if (!apiUserRepository.existsById(userid)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiUserResponse(null, "ApiUser not found"));
        }

        apiUserRepository.deleteById(userid);

        return ResponseEntity.ok(
                new ApiUserResponse(null, "ApiUser ID " + userid + " deleted successfully"));
    }

    // ============================
    // FIND USER
    // ============================
    @Override
    public Optional<ApiUser> findByUsername(String username) {
        return apiUserRepository.findByUsernameIgnoreCase(username);
    }

    @Override
    public Optional<ApiUser> findById(int userId) {
        return apiUserRepository.findById(userId);
    }

    // ============================
    // 🔐 AUTHENTICATION (FINAL)
    // ============================
    @Override
    public boolean authenticate(String username, String rawPassword, String shopcode) {

        if (username == null || rawPassword == null || shopcode == null) {
            return false;
        }

        Optional<ApiUser> userOpt = apiUserRepository.findByUsernameIgnoreCaseAndShopcodeIgnoreCase(username, shopcode);

        if (userOpt.isEmpty()) {
            return false;
        }

        ApiUser user = userOpt.get();

        return passwordEncoder.matches(rawPassword, user.getPassword());
    }
}