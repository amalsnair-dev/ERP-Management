package com.blogtec.aurixwebapi.salesmanmaster;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.dto.SalesmanMasterDto;

@Service
public class SalesmanMasterServiceImpl implements SalesmanMasterService {

    @Autowired
    private SalesmanMasterRepository smMasterRepo;

    @Override
    public List<SalesmanMasterDto> findShopCodeDetails() {
        List<Object[]> rows = smMasterRepo.findShopCodeDetails();
        return rows.stream()
                   .map(row -> new SalesmanMasterDto((String) row[0], (String) row[1]))
                   .collect(Collectors.toList());
    }

    @Override
    public List<SalesmanMasterDto> findBySmcode(String smcode) {
        List<Object[]> rows = smMasterRepo.findBySmCode(smcode);
        return rows.stream()
                   .map(row -> new SalesmanMasterDto((String) row[0], (String) row[1]))
                   .collect(Collectors.toList());
    }

    @Override
    public boolean existsBySmCode(String smcode) {
        return smMasterRepo.existsBySalesmanCode(smcode);
    }
}
