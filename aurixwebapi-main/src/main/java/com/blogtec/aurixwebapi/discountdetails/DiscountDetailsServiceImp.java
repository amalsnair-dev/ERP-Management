package com.blogtec.aurixwebapi.discountdetails;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

@Service
public class DiscountDetailsServiceImp implements DiscountDetailsService {
	
	@Autowired
    private DiscountDetailsRepository disRepository;

    @Override
    @Transactional
    public DiscountDetails create(DiscountDetails discountDetails) {
        // global id: max across all records
        Integer lastId = disRepository.findMax();
        if (lastId == null) lastId = 0;
        discountDetails.setId(lastId + 1);

        // slno: per-estno serial number (1, 2, 3 ... per estimate)
        Integer lastSlno = disRepository.findMaxSlnoByEstno(discountDetails.getEstno());
        if (lastSlno == null) lastSlno = 0;
        discountDetails.setSlno(lastSlno + 1);

        discountDetails.setDatetime(LocalDateTime.now());
        return disRepository.save(discountDetails);
    }


	@Override
	public ResponseEntity<?> DeleteByReSet() {
		 disRepository.deleteAll();
		 return ResponseEntity.ok("Successfully Deleted");
	}

	@Override
	public List<DiscountDetails> findByAll(String shopcode) {
		 return disRepository.findAllShopcode(shopcode);
	}

	@Override
	public Object findByestno(String estno, String shopcode) {
	 	    return disRepository.findAllEstno(estno, shopcode);
	}

	@Override
	public DiscountDetails findByEstnoMaxSlno(int estno) {
		return disRepository.findByEstnoMaxSlno(estno);
	}

	@Override
	public List<DiscountDetails> findByEstnoAndUsername(int estno, String username) {
		return disRepository.findByEstnoAndUsername(estno, username);
	}
}
