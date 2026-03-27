<?php
class Admin {

    // Attributs qui correspondent aux colonnes de la BDD
    private ?int    $id             = null;
    private string  $nom;
    private string  $prenom;
    private string  $dateDeNaissance;
    private string  $email;
    private ?string $numTel         = null;
    private string  $motDePass;
    private string  $role;          // 'admin' ou 'super_admin'


    public function __construct(
        string $nom,
        string $prenom,
        string $dateDeNaissance,
        string $email,
        string $motDePass,
        string $role = 'admin',
        ?string $numTel = null
    ) {
        $this->nom             = $nom;
        $this->prenom          = $prenom;
        $this->dateDeNaissance = $dateDeNaissance;
        $this->email           = $email;
        $this->motDePass       = $motDePass;
        $this->role            = $role;
        $this->numTel          = $numTel;
    }


    public function getId(): ?int            { return $this->id; }
    public function getNom(): string         { return $this->nom; }
    public function getPrenom(): string      { return $this->prenom; }
    public function getDateDeNaissance(): string { return $this->dateDeNaissance; }
    public function getEmail(): string       { return $this->email; }
    public function getNumTel(): ?string     { return $this->numTel; }
    public function getMotDePass(): string   { return $this->motDePass; }
    public function getRole(): string        { return $this->role; }


    public function setId(int $id): self {
        $this->id = $id;
        return $this;
    }

    public function setNom(string $nom): self {
        $this->nom = $nom;
        return $this;
    }

    public function setPrenom(string $prenom): self {
        $this->prenom = $prenom;
        return $this;
    }

    public function setEmail(string $email): self {
        $this->email = $email;
        return $this;
    }

    public function setNumTel(?string $numTel): self {
        $this->numTel = $numTel;
        return $this;
    }

    public function setRole(string $role): self {
        $this->role = $role;
        return $this;
    }

    // Hache le mot de passe avant de le stocker
    public function setMotDePass(string $motDePass): self {
        $this->motDePass = password_hash($motDePass, PASSWORD_BCRYPT);
        return $this;
    }



    // Vérifie le mot de passe saisi contre le hash en BDD
    public function verifierMotDePasse(string $motDePassSaisi): bool {
        return password_verify($motDePassSaisi, $this->motDePass);
    }

    // Vérifie si cet admin est un super admin
    public function estSuperAdmin(): bool {
        return $this->role === 'super_admin';
    }

    // Crée un objet Admin depuis un tableau BDD 
    public static function fromBDD(array $row): self {
        $admin = new self(
            $row['nom'],
            $row['prenom'],
            $row['DateDeNaissance'],
            $row['email'],
            $row['MotDePass'],
            $row['role'],
            $row['numTel'] ?? null
        );
        $admin->setId((int)$row['ID']);
        return $admin;
    }
}
?>