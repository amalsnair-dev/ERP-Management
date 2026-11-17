package com.blogtec.aurixwebapi.careoff;

import java.util.List;
import java.util.Optional;

import com.blogtec.aurixwebapi.dto.CareOfMasterDto;

public interface CareOfService {
    List<CareOfMasterDto> findAllCareOf();
    Optional<String> findCareOfCode(String careofcode);
}
