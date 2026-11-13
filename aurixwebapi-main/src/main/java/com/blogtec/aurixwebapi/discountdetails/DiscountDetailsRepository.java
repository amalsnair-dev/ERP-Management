package com.blogtec.aurixwebapi.discountdetails;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface DiscountDetailsRepository extends JpaRepository<DiscountDetails, Integer> 
{
    @Query("SELECT COALESCE(MAX(m.id), 0) FROM DiscountDetails m")
    Integer findMax();

    // Get max slno for a specific estno → used to auto-generate slno per estimate
    @Query("SELECT COALESCE(MAX(m.slno), 0) FROM DiscountDetails m WHERE m.estno = :estno")
    Integer findMaxSlnoByEstno(int estno);

    // Get the full record with the highest slno for a given estno
    @Query("SELECT m FROM DiscountDetails m WHERE m.estno = :estno AND m.slno = (SELECT MAX(d.slno) FROM DiscountDetails d WHERE d.estno = :estno)")
    DiscountDetails findByEstnoMaxSlno(int estno);

    @Query("SELECT m FROM DiscountDetails m WHERE m.shopCode = :shopcode")
    List<DiscountDetails> findAllShopcode(String shopcode);
    
    @Query("SELECT m FROM DiscountDetails m WHERE m.estno = :estno AND m.shopCode = :shopcode")
    List<DiscountDetails> findAllEstno(String estno, String shopcode);

    // Get all records by estno and username
    @Query("SELECT m FROM DiscountDetails m WHERE m.estno = :estno AND m.username = :username")
    List<DiscountDetails> findByEstnoAndUsername(int estno, String username);
}
