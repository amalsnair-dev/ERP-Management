package com.blogtec.aurixwebapi.user;

import java.util.List;

import com.blogtec.aurixwebapi.frame.Frameentity;
import com.blogtec.aurixwebapi.role.Role;

import jakarta.persistence.*;
import lombok.*;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "user_details")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;

    // ✅ Each user has ONE role
    @ManyToOne(fetch = FetchType.EAGER, cascade = CascadeType.MERGE)
    @JoinColumn(name = "role_id", referencedColumnName = "id")
    private Role role;

    // ✅ Each user can have MULTIPLE frames
    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.MERGE)
    @JoinTable(
        name = "user_frame",
        joinColumns = @JoinColumn(name = "user_id", referencedColumnName = "id"),
        inverseJoinColumns = @JoinColumn(name = "frame_id", referencedColumnName = "id")
    )
    private List<Frameentity> frame;

    // ✅ Each user can have MULTIPLE assigned shops
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "user_shops",
        joinColumns = @JoinColumn(name = "user_id", referencedColumnName = "id")
    )
    @Column(name = "shopcode")
    private List<String> shops;
}
