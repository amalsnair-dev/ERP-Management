package com.blogtec.aurixwebapi.discountdetails;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public interface DiscountDetailsService 
{


	    DiscountDetails create(DiscountDetails discountDetails);


		ResponseEntity<?> DeleteByReSet();

		List<DiscountDetails> findByAll(String shopcode);

		Object findByestno(String estno, String shopcode);

		// Get the single record with the max slno for a given estno
		DiscountDetails findByEstnoMaxSlno(int estno);

		// Get all records by estno and username
		List<DiscountDetails> findByEstnoAndUsername(int estno, String username);

}
