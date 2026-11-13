package com.blogtec.aurixwebapi.apiuser;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.user.UserService;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

import org.springframework.http.HttpMethod;

@RestController
@RequestMapping("/apiuser")
public class ApiUserController {

    private final ApiUserService apiUserService;
    private final UserService userService;
    private final RemoteDataFetcher remoteDataFetcher;

    public ApiUserController(ApiUserService apiUserService,
            UserService userService,
            RemoteDataFetcher remoteDataFetcher) {
        this.apiUserService = apiUserService;
        this.userService = userService;
        this.remoteDataFetcher = remoteDataFetcher;
    }

    private boolean isLocalShop(String shopcode) {
        return shopcode == null || shopcode.isBlank() ||
                shopcode.equalsIgnoreCase(userService.getdefaultshopcode());
    }

    // ================= CREATE =================
    @PostMapping("/create")
    public ResponseEntity<?> create(
            @RequestBody ApiUser apiUser,
            @RequestParam(value = "shopcode", required = false) String shopcode) {

        if (isLocalShop(shopcode)) {
            try {
                if (apiUser.getUsername() == null)
                    apiUser.setUsername("");
                if (apiUser.getPassword() == null)
                    apiUser.setPassword("");
                if (apiUser.getRole() == null)
                    apiUser.setRole("");

                if (apiUser.getShopcode() == null || apiUser.getShopcode().isBlank()) {
                    apiUser.setShopcode(userService.getdefaultshopcode());
                }

                ApiUser savedUser = apiUserService.create(apiUser);

                return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);

            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error creating user: " + e.getMessage());
            }
        }

        return remoteDataFetcher.fetchRemoteApiUser(shopcode, "/create", HttpMethod.POST, apiUser);
    }

    // ================= UPDATE =================
    @PutMapping("/update/{userid}")
    public ResponseEntity<?> update(
            @PathVariable int userid,
            @RequestBody ApiUser apiUser,
            @RequestParam(value = "shopcode", required = false) String shopcode) {

        if (isLocalShop(shopcode)) {
            try {
                Optional<ApiUser> optionalUser = apiUserService.findById(userid);

                if (optionalUser.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("User not found with id: " + userid);
                }

                ApiUser existingUser = optionalUser.get();

                // Encrypt if updated
                if (apiUser.getUsername() != null) {
                    existingUser.setUsername(apiUser.getUsername());
                }

                if (apiUser.getPassword() != null) {
                    existingUser.setPassword(apiUser.getPassword());
                }

                if (apiUser.getRole() != null) {
                    existingUser.setRole(apiUser.getRole());
                }

                ApiUser updatedUser = apiUserService.update(userid, existingUser);

                return ResponseEntity.ok(updatedUser);

            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error updating user: " + e.getMessage());
            }
        }

        return remoteDataFetcher.fetchRemoteApiUser(shopcode, "/update/" + userid, HttpMethod.PUT, apiUser);
    }

    // ================= FIND BY ID =================
    @GetMapping("/find-by-id/{userid}")
    public ResponseEntity<?> findById(
            @PathVariable int userid,
            @RequestParam(value = "shopcode", required = false) String shopcode) {

        if (isLocalShop(shopcode)) {
            try {
                Optional<ApiUser> optionalUser = apiUserService.findById(userid);

                if (optionalUser.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("User not found with id: " + userid);
                }

                ApiUser user = optionalUser.get();

                // Hide password
                user.setPassword(null);

                return ResponseEntity.ok(user);

            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error fetching user: " + e.getMessage());
            }
        }

        return remoteDataFetcher.fetchRemoteApiUser(shopcode, "/find-by-id/" + userid, HttpMethod.GET, null);
    }

    // ================= DELETE =================
    @DeleteMapping("/delete/{userid}")
    public ResponseEntity<?> delete(
            @PathVariable int userid,
            @RequestParam(value = "shopcode", required = false) String shopcode) {

        if (isLocalShop(shopcode)) {
            try {
                return apiUserService.deleteById(userid);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error deleting user: " + e.getMessage());
            }
        }

        return remoteDataFetcher.fetchRemoteApiUser(shopcode, "/delete/" + userid, HttpMethod.DELETE, null);
    }
}