package com.blogtec.aurixwebapi.company;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.sales.saleestRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CompanyService {

    @Autowired
    private CompanyRepository repository;

    @Autowired
    private saleestRepository saleestRepository;

    public List<CompanyDto> getAllImages() {
        List<Object[]> results = repository.getAllImages();
        return results.stream()
                .map(r -> new CompanyDto((String) r[1], (byte[]) r[0]))
                .collect(Collectors.toList());
    }

    public List<CompanyKeyValueDto> getCompanyDetails() {
        List<Object[]> results = repository.getCompanyDetails();
        return results.stream()
                .map(r -> new CompanyKeyValueDto((String) r[0], (String) r[1]))
                .collect(Collectors.toList());
    }

    public void resetVadetails(String estno) {
        if (estno != null && !estno.trim().isEmpty()) {
            saleestRepository.resetestno(estno);
            saleestRepository.resetestmstrestno(estno);
        }
    }
}
