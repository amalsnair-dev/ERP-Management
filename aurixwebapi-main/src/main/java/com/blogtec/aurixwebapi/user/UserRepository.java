package com.blogtec.aurixwebapi.user;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByUsername(String username);

	@Query(value = "select username from user_details where username=:username", nativeQuery = true)
	Optional<String> checkByUsername(String username);
	
	boolean existsByUsername(String username);

//////////////////////////////////////////shopcode wise//////////////////////////////////////////////	
	@Query(value = "select shopcode from shopdetails n order by shopflag desc,shop_id", nativeQuery = true)
	List<Object[]> getshopcode();

	@Query(value = "select value from company where key='shopcode'", nativeQuery = true)
	String getdefault();

	@Query(value = "select ipnumber from shopdetails where shopcode=:shopcode", nativeQuery = true)
	String getipbyShopcode(String shopcode);

	@Query(value = "select ipnumber from shopdetails where shopcode=:shopcode", nativeQuery = true)
	String getdefaulyipnumber();

	@Query(value = "select shopcode from shopdetails where shopcode=:shopcode", nativeQuery = true)
	String gwtshopcode(String shopcode);

	@Query(value = "select r.role from  role as r,user_details as ud,user_role as ur  where ud.id=ur.user_id and r.id=ur.role_id and ud.username=:username", nativeQuery = true)
	Optional<String> getrolebyUsername(String username);

}