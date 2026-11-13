package com.blogtec.aurixwebapi.user;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.apiuser.ApiUser;
import com.blogtec.aurixwebapi.apiuser.ApiUserService;
import com.blogtec.aurixwebapi.frame.FrameRepository;
import com.blogtec.aurixwebapi.frame.Frameentity;
import com.blogtec.aurixwebapi.role.Role;
import com.blogtec.aurixwebapi.role.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("null")
@Service
public class UserServiceImp implements UserService 
{
	private static final Logger logger = LoggerFactory.getLogger(UserServiceImp.class);

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private RoleRepository roleRepository;

	@Autowired
	private FrameRepository frameRepository;

	@Autowired
	private ApiUserService apiUserService;

	private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

	@Override
	public boolean saveUser(User user) {
		// ✅ Check if username exists
		if (userRepository.findByUsername(user.getUsername()).isPresent()) {
			return false;
		}

		// ✅ Attach Role from DB
		if (user.getRole() != null && user.getRole().getRole() != null) {
			Role managedRole = roleRepository.findByRole(user.getRole().getRole())
					.orElseThrow(() -> new RuntimeException("Role not found: " + user.getRole().getRole()));
			user.setRole(managedRole);
		}

		// ✅ Attach frames or create if missing
		if (user.getFrame() != null && !user.getFrame().isEmpty()) {
			List<Frameentity> managedFrames = user.getFrame().stream()
					.map(f -> frameRepository.findByFramename(f.getFramename())
							.orElseGet(() -> frameRepository.save(new Frameentity(f.getFramename()))))
					.collect(Collectors.toList());
			user.setFrame(managedFrames);
		}

		// ✅ Encrypt password
		String rawPassword = user.getPassword();
		user.setPassword(passwordEncoder.encode(rawPassword));

		// ✅ Save API User
		try {
			ApiUser apiUser = new ApiUser();
			apiUser.setUsername(user.getUsername());
			apiUser.setPassword(rawPassword);
			apiUser.setRole(user.getRole() != null ? user.getRole().getRole() : null);
			apiUser.setShopcode(userRepository.getdefault());
			apiUserService.create(apiUser);
		} catch (Exception e) {
			logger.error("Failed to create ApiUser for username {}: {}", user.getUsername(), e.getMessage(), e);
			return false;
		}

		userRepository.save(user);
		return true;
	}

	@Override
	public List<Frameentity> getUserFramesByUsername(String username)
	{
		if (username == null || username.trim().isEmpty()) 
		{
			return Collections.emptyList();
		}
		return userRepository.findByUsername(username).map(User::getFrame).orElse(Collections.emptyList());
	}

	@Override
	public Optional<User> findByUsername(String username) 
	{
		return userRepository.findByUsername(username);
	}

	public List<Map<String, String>> getShopcode()
	{
		List<Object[]> shopcode = userRepository.getshopcode();
		List<Map<String, String>> shopcodqe = new ArrayList<>();
		for (Object a : shopcode)
		{
			Map<String, String> shopc = new HashMap<>();
			Object[] arr = (Object[]) a;
			shopc.put("Shopcode", String.valueOf(arr[0]));
			shopcodqe.add(shopc);
		}

		return shopcodqe;
	}

	public String getdefaultshopcode() 
	{
		String getdefaultshopcode = userRepository.getdefault();
		return getdefaultshopcode;
	}

	@Override
	public String getipbyShopcode(String shopcode) 
	{
		String ip = userRepository.getipbyShopcode(shopcode);
		if (ip == null || ip.trim().isEmpty())
		{
			// Return a default value or throw a controlled exception
			throw new IllegalArgumentException("IP not found for shop code: " + shopcode);
			// OR: return "127.0.0.1"; // default fallback if appropriate
		}
		return ip.trim();
	}

	public boolean checkshopcdeExist(String shopcode) {
		boolean checkedvalue = false;
		if (userRepository.gwtshopcode(shopcode).equals("")) {
			checkedvalue = false;
		} else {
			checkedvalue = true;
		}
		return checkedvalue;
	}

	
	@Override
	public boolean updateUser(String username, User updatedUser) {

	    Optional<User> optionalUser = userRepository.findByUsername(username);

	    if (optionalUser.isEmpty()) {
	        return false;
	    }

	    User existingUser = optionalUser.get();

	    // Update Role if provided
	    if (updatedUser.getRole() != null && updatedUser.getRole().getRole() != null) {
	        Role managedRole = roleRepository.findByRole(updatedUser.getRole().getRole())
	                .orElseThrow(() -> new RuntimeException("Role not found: " + updatedUser.getRole().getRole()));
	        existingUser.setRole(managedRole);
	    }

	    // Update Frames
	    if (updatedUser.getFrame() != null) {
	        List<Frameentity> frames = updatedUser.getFrame().stream()
	                .map(f -> frameRepository.findByFramename(f.getFramename())
	                        .orElseGet(() ->
	                                frameRepository.save(new Frameentity(f.getFramename()))))
	                .collect(Collectors.toList());
	        existingUser.setFrame(frames);
	    }

	    // Update Shops
	    if (updatedUser.getShops() != null) {
	        existingUser.setShops(updatedUser.getShops());
	    }

	    userRepository.save(existingUser);

	    // ✅ Sync to ApiUser
	    try {
	        apiUserService.findByUsername(username).ifPresent(apiUser -> {
	            apiUser.setPassword(null); // Prevent re-hashing of existing hash
	            if (existingUser.getRole() != null) {
	                apiUser.setRole(existingUser.getRole().getRole());
	            }
	            apiUserService.update(apiUser.getUserid(), apiUser);
	        });
	    } catch (Exception e) {
	        logger.error("Failed to sync updated ApiUser for username {}: {}", username, e.getMessage(), e);
	    }

	    return true;
	}
	
	@Override
	public boolean changePassword(String username, String oldPassword, String newPassword) 
	{

	    Optional<User> optionalUser = userRepository.findByUsername(username);

	    if (optionalUser.isEmpty()) {
	        return false;
	    }

	    User user = optionalUser.get();

	    if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
	        return false;
	    }

	    user.setPassword(passwordEncoder.encode(newPassword));
	    userRepository.save(user);

	    // ✅ Sync to ApiUser
	    try {
	        apiUserService.findByUsername(username).ifPresent(apiUser -> {
	            apiUser.setPassword(newPassword); // ApiUserService will encode it
	            apiUserService.update(apiUser.getUserid(), apiUser);
	        });
	    } catch (Exception e) {
	        logger.error("Failed to sync changed password for username {}: {}", username, e.getMessage(), e);
	    }

	    return true;
	}
	
	
	@Override
	public String deleteUser(String targetUsername, String loginUsername) 
	{
	    // Prevent self delete
	    if (targetUsername.equalsIgnoreCase(loginUsername)) {
	        return "You cannot delete your own account.";
	    }
	    // Protect system user
	    if ("BLOGTEC".equalsIgnoreCase(targetUsername)) {
	        return "The BLOGTEC system user cannot be deleted.";
	    }
	    Optional<User> targetUserOpt = userRepository.findByUsername(targetUsername);
	    Optional<User> loginUserOpt = userRepository.findByUsername(loginUsername);
	    if (targetUserOpt.isEmpty()) {
	        return "User '" + targetUsername + "' was not found.";
	    }
	    if (loginUserOpt.isEmpty()) {
	        return "The login user is invalid or does not exist.";
	    }
	    User targetUser = targetUserOpt.get();
	    User loginUser = loginUserOpt.get();
	    // BLOGTEC override (can delete anyone except itself)
	    if ("BLOGTEC".equalsIgnoreCase(loginUsername)) {
	        userRepository.delete(targetUser);
	        // Sync delete ApiUser
	        apiUserService.findByUsername(targetUsername).ifPresent(apiUser -> 
	            apiUserService.deleteById(apiUser.getUserid()));
	        return "User '" + targetUsername + "' has been deleted successfully.";
	    }
	    // Role permission check
	    if (!hasDeletePermission(loginUser, targetUser)) {
	        return "You do not have permission to delete the user '" + targetUsername + "'.";
	    }

	    userRepository.delete(targetUser);
	    // Sync delete ApiUser
	    apiUserService.findByUsername(targetUsername).ifPresent(apiUser -> 
	        apiUserService.deleteById(apiUser.getUserid()));

	    return "User '" + targetUsername + "' has been deleted successfully.";
	}
	private boolean hasDeletePermission(User loginUser, User targetUser) {

	    Map<String, Integer> rolePriority = Map.of(
	            "SUPER_ADMIN", 4,
	            "SUPER_USER", 3,
	            "ADMIN", 2,
	            "USER", 1
	    );

	    int loginPriority = rolePriority.getOrDefault(
	            loginUser.getRole().getRole().toUpperCase(), 0);

	    int targetPriority = rolePriority.getOrDefault(
	            targetUser.getRole().getRole().toUpperCase(), 0);

	    return loginPriority > targetPriority;
	}
}
