package com.blogtec.aurixwebapi.salesmanmaster;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SalesmanMasterRepository extends JpaRepository<SalesmanDetails, Integer> {

    // 1. Get all salesman details
    @Query(value = "SELECT DISTINCT s.salesman_code, s.salesman_name FROM salesmanmaster s ORDER BY s.salesman_code", nativeQuery = true)
    List<Object[]> findShopCodeDetails();

    // 2. Get salesman by code
    @Query(value = "SELECT s.salesman_code, s.salesman_name FROM salesmanmaster s WHERE s.salesman_code = :smcode ORDER BY s.salesman_code", nativeQuery = true)
    List<Object[]> findBySmCode(@Param("smcode") String smcode);

    // 3. Check if salesman exists
    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM salesmanmaster s WHERE s.salesman_code = :salesmanCode", nativeQuery = true)
    boolean existsBySalesmanCode(@Param("salesmanCode") String salesmanCode);
}

