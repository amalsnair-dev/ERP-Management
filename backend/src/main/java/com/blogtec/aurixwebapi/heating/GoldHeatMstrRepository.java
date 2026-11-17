package com.blogtec.aurixwebapi.heating;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;

@Repository
public interface GoldHeatMstrRepository extends JpaRepository<GoldHeatMstr, Integer> {

    List<GoldHeatMstr> findByEstnoOrderByRowId(Integer estno);

    Optional<GoldHeatMstr> findByEstnoAndRowId(Integer estno, Integer rowId);

    @Modifying
    @Transactional
    @Query("DELETE FROM GoldHeatMstr g WHERE g.estno = :estno")
    void deleteByEstno(@Param("estno") Integer estno);
}
