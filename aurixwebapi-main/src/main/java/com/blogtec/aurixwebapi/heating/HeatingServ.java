package com.blogtec.aurixwebapi.heating;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.dto.HeatingDto;

@Service
public interface HeatingServ {

    void createGoldHeatMstrTable();

    HeatingDto addHeat(HeatingDto dto);

    HeatingDto updateHeat(int estno, int rowId, HeatingDto dto);

    ResponseEntity<?> updateFlag(int estno);

    ResponseEntity<?> updateRecFlag(int estno);

    ResponseEntity<?> deleteHeat(int estno);

    List<HeatingDto> getByEstno(int estno);
}
