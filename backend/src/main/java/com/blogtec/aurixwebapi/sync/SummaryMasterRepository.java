package com.blogtec.aurixwebapi.sync;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SummaryMasterRepository extends JpaRepository<SummaryMaster, Integer> {
    List<SummaryMaster> findByShopcodeAndActiveTrueOrderBySlno(String shopcode);
}
