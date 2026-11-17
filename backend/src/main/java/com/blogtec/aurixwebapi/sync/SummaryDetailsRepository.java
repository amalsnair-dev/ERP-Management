package com.blogtec.aurixwebapi.sync;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface SummaryDetailsRepository extends JpaRepository<SummaryDetails, Integer> {
    List<SummaryDetails> findByShopcodeAndSummaryDateOrderBySummarySlno(String shopcode, LocalDate summaryDate);

    @Transactional
    void deleteByShopcodeAndSummaryDate(String shopcode, LocalDate summaryDate);
}
