package com.blogtec.aurixwebapi.easytotal;

import java.util.List;

import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.dto.EasyTotalDto;


@Service 
public interface EasyTotalService {

	List<EasyTotalDto> getEasyTotal();



}
