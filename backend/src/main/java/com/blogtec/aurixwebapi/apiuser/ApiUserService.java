package com.blogtec.aurixwebapi.apiuser;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.lang.Nullable;

@Service
public interface ApiUserService {

	ApiUser create(ApiUser apiUser);

	@Nullable
	ApiUser update(int userid, ApiUser apiUser);

	ResponseEntity<ApiUserResponse> deleteById(int userid);

	// ApiUser findByUsername(String decryptedValue);

	Optional<ApiUser> findById(int userId);

	Optional<ApiUser> findByUsername(String username);

	boolean authenticate(String username, String rawPassword, String shopcode);

}
