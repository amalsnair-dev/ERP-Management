package com.blogtec.aurixwebapi.smassign;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;

@Repository
public interface SmAssignRepository extends JpaRepository<SmAssign, Integer> {

	@Query("select COALESCE(max(m.slno+1),1) from SmAssign m ")
	int findMax();
	
	

	@Query("SELECT s FROM SmAssign s WHERE s.date = :data  order by s.slno")
	List<SmAssign> findByDate(@Param("data") LocalDate data );

	List<SmAssign> findByDateAndPhoneNo(LocalDate date, String phoneNo);

	@Modifying
	@Transactional
	@Query("DELETE FROM SmAssign s WHERE s.date = :date AND s.phoneNo = :phoneNo")
	int deleteByDateAndPhoneNo(@Param("date") LocalDate date, @Param("phoneNo") String phoneNo);
	
	@Query("SELECT s FROM SmAssign s WHERE s.smCode IN :smcodes  ORDER BY s.smCode")
	List<SmAssign> findBySmCode(@Param("smcodes") List<String> smcodes);


	@Query("SELECT COALESCE(MAX(m.entryno)+1, 1) FROM SmAssign m WHERE m.date = :date ")
	int findMaxEntry(@Param("date") LocalDate date);

	
//	@Query("SELECT DISTINCT new com.example.schemas.smassign.SmAssignDTO(s.phoneNo, s.name, s.place, s.shopcode) FROM SmAssign s WHERE s.phoneNo = :phoneno")

	@Query("SELECT s FROM SmAssign s WHERE s.phoneNo = :phoneno order by s.date ")
	List<SmAssign> findByPhoneNo(@Param("phoneno") String phoneno);


	@Query("SELECT s FROM SmAssign s WHERE s.date BETWEEN :fromdate AND :todate ORDER BY  s.date, s.slno ")
	List<SmAssign> reportFormToDate(LocalDate fromdate, LocalDate todate);


	@Query("SELECT COUNT(s) > 0 FROM SmAssign s WHERE s.entryno = :entryno AND s.date = :data ")
	boolean existsByDateEntry(@Param("entryno") int entryno, @Param("data") LocalDate data);

	
	@Modifying
	@Transactional
	@Query("DELETE FROM SmAssign s WHERE s.entryno = :entryno AND s.date = :date ")
	void deleteByDateEntry(@Param("entryno") int entryno, @Param("date") LocalDate date);


	@Query("SELECT s FROM SmAssign s WHERE s.entryno = :entryno AND s.date = :data ")
	Optional<SmAssign> findexistsByDateEntry(@Param("entryno") int entryno, @Param("data") LocalDate data);





}
