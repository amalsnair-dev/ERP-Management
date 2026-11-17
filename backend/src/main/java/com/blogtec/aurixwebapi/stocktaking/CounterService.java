package com.blogtec.aurixwebapi.stocktaking;

import java.util.List;

import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.stocktaking.*;

@Service
public class CounterService {
	
	private final CounterRepository counterRepository;
	
	public CounterService(CounterRepository counterRepository) {
		this.counterRepository = counterRepository;
	}
	
	public List<CounterDto> getAllCounters(){
		return counterRepository.findAllCounters();
	}

}
