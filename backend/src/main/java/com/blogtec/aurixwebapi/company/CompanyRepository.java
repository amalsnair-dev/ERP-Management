package com.blogtec.aurixwebapi.company;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface CompanyRepository extends JpaRepository<CompanyDetails, Integer> 
{

    @Query(value = "SELECT c.imagedata, c.description FROM companyimagemaster c",nativeQuery = true)
    List<Object[]> getAllImages();
      
    @Query(value = "select c.key,c.value  from company c ",nativeQuery = true)
    List<Object[]> getCompanyDetails();
}
