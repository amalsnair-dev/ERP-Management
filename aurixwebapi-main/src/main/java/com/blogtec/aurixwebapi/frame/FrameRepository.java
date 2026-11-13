package com.blogtec.aurixwebapi.frame;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository; 

@Repository
public interface FrameRepository extends JpaRepository<Frameentity, Integer>
{
   
    Optional<Frameentity> findByFramename(String framename);
    boolean existsByFramename(String framename);
}
