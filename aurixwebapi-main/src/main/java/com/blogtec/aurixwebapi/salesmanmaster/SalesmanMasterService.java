package com.blogtec.aurixwebapi.salesmanmaster;

import java.util.List;

import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.dto.SalesmanMasterDto;

@Service
public interface SalesmanMasterService {



	List<SalesmanMasterDto> findBySmcode(String smcode);

	boolean existsBySmCode(String smcode);

	
	List<SalesmanMasterDto> findShopCodeDetails();


	

}
