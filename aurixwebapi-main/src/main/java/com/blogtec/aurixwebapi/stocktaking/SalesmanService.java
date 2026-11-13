package com.blogtec.aurixwebapi.stocktaking;

import java.util.List;

import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.stocktaking.*;

@Service
public class SalesmanService {
	
	private final SalesmanRepository salesmanRepository;
	
	public SalesmanService(SalesmanRepository salesmanRepository) {
		
		this.salesmanRepository = salesmanRepository;
	}
	
	public List<SalesmanDto> getAllSalesmens(){
		return salesmanRepository.findAllSalesmen();
	}

}
