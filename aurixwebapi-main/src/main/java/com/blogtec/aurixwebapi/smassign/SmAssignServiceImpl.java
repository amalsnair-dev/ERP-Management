package com.blogtec.aurixwebapi.smassign;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.asp.lib.AspCommonFunctions;

@Service
public class SmAssignServiceImpl implements SmAssignService{

    @Autowired
    SmAssignRepository assignRepo;

    public SmAssign create(SmAssign smassign)
    {
        int lastid = assignRepo.findMax();
        int maxentry=assignRepo.findMaxEntry(smassign.getDate());
        smassign.setSlno(lastid);
        smassign.setEntryno(maxentry);
        return assignRepo.save(smassign);
    }

	public List<SmAssign> findAll()
	{
		return assignRepo.findAll();
	}

	public List<SmAssign> findByDate(LocalDate data)
	{
		return assignRepo.findByDate(data);
	}
	public SmAssign updateSmAssign(int slno, SmAssign updatedSmAssign) 
	{
	    return assignRepo.findById(slno)
	        .map(existing ->
	        {
	        	existing.setName(AspCommonFunctions.checkNull(updatedSmAssign.getName(),existing.getName()));
	        	existing.setPhoneNo(AspCommonFunctions.checkNull(updatedSmAssign.getPhoneNo(),existing.getPhoneNo()));
	        	existing.setPlace(AspCommonFunctions.checkNull(updatedSmAssign.getPlace(),existing.getPlace()));
	        	existing.setSmCode(AspCommonFunctions.checkNull(updatedSmAssign.getSmCode(),existing.getSmCode()));
	        	existing.setShopcode(AspCommonFunctions.checkNull(updatedSmAssign.getShopcode(),existing.getShopcode()));
	        	existing.setTime(AspCommonFunctions.checkNull(updatedSmAssign.getTime(),existing.getTime()));
	        	existing.setDate(AspCommonFunctions.checkNull(updatedSmAssign.getDate(),existing.getDate()));
	        	
	            return assignRepo.save(existing);
	        })
	        .orElse(null);
	}

	@Override
	public ResponseEntity<?> DeleteById(int slno) 
	{
		  if (assignRepo.existsById(slno)) 
		  {
          	assignRepo.deleteById(slno);
              String message = "Daily Customer ID " + slno + " has been deleted successfully";
              return ResponseEntity.ok(message);
          } 
		  else
		  {
              String message = "No Daily Customer found with ID " + slno + " not found";
              return ResponseEntity.status(HttpStatus.NOT_FOUND).body(message);
          }
	}

	public List<SmAssign> findBySmcode(String smcodeCsv) {
	    List<String> smcodeList = Arrays.asList(smcodeCsv.split(","));
	    return assignRepo.findBySmCode(smcodeList);
	}


	@Override
	public ResponseEntity<?> findByMax() 
	{
		int maxValue = assignRepo.findMax();
		return ResponseEntity.ok(maxValue);
	}

	@Override
	public List<SmAssign> findByPhoneNo(String phoneno) 
	{
		return assignRepo.findByPhoneNo(phoneno);
	}

	@Override
	public List<SmAssign> reportFormToDate(LocalDate fromdate, LocalDate todate) {
		
		return  assignRepo.reportFormToDate(fromdate,todate);
	}

	@Override
	public ResponseEntity<?> DeleteByDateEntry(int entryno, LocalDate date) {
		  if (assignRepo.existsByDateEntry(entryno,date)) 
		  {
          	assignRepo.deleteByDateEntry(entryno,date);
              String message = "Daily Customer has been deleted successfully";
              return ResponseEntity.ok(message);
          } 
		  else
		  {
              String message = "No Daily Customer not found";
              return ResponseEntity.status(HttpStatus.NOT_FOUND).body(message);
          }
	}

	@Override
	public SmAssign updateByDateEntry(int entryno, LocalDate date, SmAssign updatedSmAssign) {
		
		 return assignRepo.findexistsByDateEntry(entryno,date)
			        .map(existing ->
			        {
			        	existing.setName(AspCommonFunctions.checkNull(updatedSmAssign.getName(),existing.getName()));
			        	existing.setPhoneNo(AspCommonFunctions.checkNull(updatedSmAssign.getPhoneNo(),existing.getPhoneNo()));
			        	existing.setPlace(AspCommonFunctions.checkNull(updatedSmAssign.getPlace(),existing.getPlace()));
			        	existing.setSmCode(AspCommonFunctions.checkNull(updatedSmAssign.getSmCode(),existing.getSmCode()));
			        	existing.setShopcode(AspCommonFunctions.checkNull(updatedSmAssign.getShopcode(),existing.getShopcode()));
			        	existing.setTime(AspCommonFunctions.checkNull(updatedSmAssign.getTime(),existing.getTime()));
			        	existing.setDate(AspCommonFunctions.checkNull(updatedSmAssign.getDate(),existing.getDate()));
			            return assignRepo.save(existing);
			        })
			        .orElse(null);
		}

}

