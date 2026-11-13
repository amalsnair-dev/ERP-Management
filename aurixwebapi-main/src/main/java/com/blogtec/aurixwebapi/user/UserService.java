package com.blogtec.aurixwebapi.user;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.frame.Frameentity;

@Service
public interface UserService {

	boolean saveUser(User user);

	List<Frameentity> getUserFramesByUsername(String username);

	Optional<User> findByUsername(String username);

	String getipbyShopcode(String shopcode);

	String getdefaultshopcode();

	List<Map<String, String>> getShopcode();

	boolean updateUser(String username, User updatedUser);

	boolean changePassword(String username, String oldPassword, String newPassword);

	String deleteUser(String username, String loginUser);

	boolean checkshopcdeExist(String shopcode);

}
