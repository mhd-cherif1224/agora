<?php
class Admin {

    private ?int    $id             = null;
    private string  $nom;
    private string  $prenom;
    private string  $dateDeNaissance;
    private string $sexe;
    private string  $email;
    private ?string $numTel         = null;
    private string  $motDePass;
    private string  $role;

    public function __construct(
        string $nom,
        string $prenom,
        string $dateDeNaissance,
        string $sexe,
        string $email,
        string $motDePass,
        string $role = 'admin',
        ?string $numTel = null
    ) {
        $this->nom             = $nom;
        $this->prenom          = $prenom;
        $this->dateDeNaissance = $dateDeNaissance;
        $this->sexe            = $sexe;
        $this->email           = $email;
        $this->motDePass       = $motDePass;
        $this->role            = $role;
        $this->numTel          = $numTel;
    }

    public function getId(): ?int            { return $this->id; }
    public function getNom(): string         { return $this->nom; }
    public function getPrenom(): string      { return $this->prenom; }
    public function getDateDeNaissance(): string { return $this->dateDeNaissance; }
    public function getSexe() : string       { return $this->sexe; }
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

    public function setDateDeNaissance(string $dateDeNaissance) :self {
        $this->dateDeNaissance = $dateDeNaissance;
        return $this;
    }

    public function setSexe(string $sexe) :self {
        $this->sexe = $sexe;
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

    public function setMotDePass(string $motDePass): self {
        $this->motDePass = password_hash($motDePass, PASSWORD_BCRYPT);
        return $this;
    }

    public function verifierMotDePasse(string $motDePassSaisi): bool {
        return password_verify($motDePassSaisi, $this->motDePass);
    }

    public function estSuperAdmin(): bool {
        return $this->role === 'super_admin';
    }

    public static function fromBDD(array $row): self {
        $admin = new self(
            $row['nom'],
            $row['prenom'],
            $row['DateDeNaissance'],
            $row['sexe'],
            $row['email'],
            $row['MotDePass'],
            $row['role'],
            $row['NumTel'] ?? null
        );
        $admin->setId((int)$row['ID']);
        return $admin;
    }
}
?>