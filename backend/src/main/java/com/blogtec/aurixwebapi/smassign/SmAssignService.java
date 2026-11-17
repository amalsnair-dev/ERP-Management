package com.blogtec.aurixwebapi.smassign;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public interface SmAssignService 
{

	SmAssign create(SmAssign smassign);

	SmAssign updateSmAssign(int slno, SmAssign updatedSmAssign);

	List<SmAssign> findAll();

	List<SmAssign> findByDate(LocalDate date);

	ResponseEntity<?> DeleteById(int slno);

	List<SmAssign> findBySmcode(String smcode);

	ResponseEntity<?> findByMax();

	List<SmAssign> findByPhoneNo(String phoneno);

	List<SmAssign> reportFormToDate(LocalDate fromdate, LocalDate todate);

	ResponseEntity<?> DeleteByDateEntry(int entryno, LocalDate date);

	SmAssign updateByDateEntry(int entryno, LocalDate date, SmAssign updatedSmAssign);


}
