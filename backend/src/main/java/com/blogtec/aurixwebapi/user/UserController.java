package com.blogtec.aurixwebapi.user;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.blogtec.aurixwebapi.dto.LoginResponseDTO;
import com.blogtec.aurixwebapi.frame.Frameentity;
import com.blogtec.aurixwebapi.frame.FrameRepository;
import com.blogtec.aurixwebapi.utils.RemoteDataFetcher;

import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;
import org.springframework.http.HttpMethod;



@RestController
@RequestMapping("/user")
public class UserController {

	private final UserService userService;
	private final RemoteDataFetcher remoteDataFetcher;
	private final FrameRepository frameRepository;
	private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

	@Autowired
	public UserController(UserService userService,
	                      RemoteDataFetcher remoteDataFetcher,
	                      FrameRepository frameRepository)
	{
		this.userService = userService;
		this.remoteDataFetcher = remoteDataFetcher;
		this.frameRepository = frameRepository;
	}

	private boolean isLocalShop(String shopcode) {
		return shopcode == null || shopcode.isBlank() || 
		       shopcode.equalsIgnoreCase(userService.getdefaultshopcode());
	}

	// ✅ Register User
	@PostMapping("/register")
	public ResponseEntity<?> registerUser(
			@RequestBody User user,
			@RequestParam(value = "shopcode", required = false) String shopcode) {

		if (isLocalShop(shopcode)) {
			// Role validation handled inside service
			boolean saved = userService.saveUser(user);
			if (saved) {
				return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");
			} else {
				return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already exists");
			}
		}

		return remoteDataFetcher.fetchRemoteUser(shopcode, "/register", HttpMethod.POST, user);
	}

	@PutMapping("/update/{username}")
	public ResponseEntity<?> updateUser(
			@PathVariable String username,
			@RequestBody User updatedUser,
			@RequestParam(value = "shopcode", required = false) String shopcode) {

		if (isLocalShop(shopcode)) {
			boolean updated = userService.updateUser(username, updatedUser);

			if (updated) {
				return ResponseEntity.ok("User updated successfully");
			}

			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body("User not found");
		}

		return remoteDataFetcher.fetchRemoteUser(shopcode, "/update/" + AspCommonFunctions.encode(username),
				HttpMethod.PUT, updatedUser);
	}

	@PostMapping("/changePassword")
	public ResponseEntity<?> changePassword(
			@RequestParam String username,
			@RequestParam String oldPassword,
			@RequestParam String newPassword,
			@RequestParam(value = "shopcode", required = false) String shopcode) {

		if (isLocalShop(shopcode)) {
			boolean changed = userService.changePassword(username, oldPassword, newPassword);

			if (changed) {
				return ResponseEntity.ok("Password updated successfully");
			}

			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body("Old password incorrect");
		}

		String url = "/changePassword"
				+ "?username=" + AspCommonFunctions.encode(username)
				+ "&oldPassword=" + AspCommonFunctions.encode(oldPassword)
				+ "&newPassword=" + AspCommonFunctions.encode(newPassword);

		return remoteDataFetcher.fetchRemoteUser(shopcode, url, HttpMethod.POST, null);
	}

	// ✅ Login User
	@PostMapping("/login")
	public ResponseEntity<?> loginUser(
			@RequestBody User user,
			@RequestParam(value = "shopcode", required = false) String shopcode) {

		if (isLocalShop(shopcode)) {
			Optional<User> existingUser = userService.findByUsername(user.getUsername());

			if (existingUser.isPresent()) {
				User dbUser = existingUser.get();
				boolean passwordMatch = passwordEncoder.matches(user.getPassword(), dbUser.getPassword());

				if (passwordMatch) {
					String roleName = dbUser.getRole() != null ? dbUser.getRole().getRole() : "No Role";
					List<Frameentity> frames = dbUser.getFrame();

					List<String> shops = dbUser.getShops();
					LoginResponseDTO response = new LoginResponseDTO(dbUser.getUsername(), List.of(roleName), frames, shops);

					return ResponseEntity.ok(response);
				}
			}

			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
		}

		return remoteDataFetcher.fetchRemoteUser(shopcode, "/login", HttpMethod.POST, user);
	}

	@GetMapping("/existsByUsername")
	public ResponseEntity<?> existsByUsername(
			@RequestParam String username,
			@RequestParam(value = "shopcode", required = false) String shopcode) {

		if (isLocalShop(shopcode)) {
			boolean exists = userService.findByUsername(username).isPresent();
			return ResponseEntity.ok(exists);
		}

		return remoteDataFetcher.fetchRemoteUser(shopcode, "/existsByUsername?username=" + AspCommonFunctions.encode(username),
				HttpMethod.GET, null);
	}

	@GetMapping("/frames/{username}")
	public ResponseEntity<?> getUserFrames(
			@PathVariable String username,
			@RequestParam(value = "shopcode", required = false) String shopcode) {

		if (isLocalShop(shopcode)) {
			List<Frameentity> frames = userService.getUserFramesByUsername(username);

			List<String> frameNames = frames.stream()
					.map(Frameentity::getFramename)
					.toList();

			return ResponseEntity.ok(frameNames);
		}

		return remoteDataFetcher.fetchRemoteUser(shopcode, "/frames/" + AspCommonFunctions.encode(username),
				HttpMethod.GET, null);
	}

	// ✅ Get All Available Frames from DB
	@GetMapping("/allframes")
	public ResponseEntity<?> getAllFrames(
			@RequestParam(value = "shopcode", required = false) String shopcode) {

		if (isLocalShop(shopcode)) {
			List<String> frameNames = frameRepository.findAll()
					.stream()
					.map(Frameentity::getFramename)
					.distinct()
					.sorted()
					.toList();
			return ResponseEntity.ok(frameNames);
		}

		return remoteDataFetcher.fetchRemoteUser(shopcode, "/allframes", HttpMethod.GET, null);
	}

	@DeleteMapping("/delete/{username}")
	public ResponseEntity<?> deleteUser(
			@PathVariable String username,
			@RequestParam String loginUser,
			@RequestParam(value = "shopcode", required = false) String shopcode) {

		if (isLocalShop(shopcode)) {
			String result = userService.deleteUser(username, loginUser);
			return ResponseEntity.ok(result);
		}

		String url = "/delete/" + AspCommonFunctions.encode(username)
				+ "?loginUser=" + AspCommonFunctions.encode(loginUser);

		return remoteDataFetcher.fetchRemoteUser(shopcode, url, HttpMethod.DELETE, null);
	}
}
