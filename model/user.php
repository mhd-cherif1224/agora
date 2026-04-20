<?php
class Utilisateur {

    private ?int    $id              = null;
    private string  $nom;
    private string  $prenom;
    private string  $dateDeNaissance;
    private string  $email;
    private string  $sexe;
    private ?string $numTel          = null;
    private ?string $niveau          = null;
    private ?string $specialite      = null;
    private ?string $localisation    = null;
    private string  $role;            
    private string  $motDePass;

    public function __construct(
        string  $nom,
        string  $prenom,
        string  $dateDeNaissance,
        string  $email,
        string  $motDePass,
        string  $sexe,
        string  $role,
        ?string $niveau       = null,
        ?string $specialite   = null,
        ?string $localisation = null,
        ?string $numTel       = null
    ) {
        $this->nom             = $nom;
        $this->prenom          = $prenom;
        $this->dateDeNaissance = $dateDeNaissance;
        $this->email           = $email;
        $this->motDePass       = $motDePass;
        $this->sexe            = $sexe;
        $this->role            = $role;
        $this->niveau          = $niveau;
        $this->specialite      = $specialite;
        $this->localisation    = $localisation;
        $this->numTel          = $numTel;
    }

    // ── Getters ──
    public function getId(): ?int              { return $this->id; }
    public function getNom(): string           { return $this->nom; }
    public function getPrenom(): string        { return $this->prenom; }
    public function getDateDeNaissance(): string { return $this->dateDeNaissance; }
    public function getSexe(): string          { return $this->sexe; }
    public function getNiveau(): ?string       { return $this->niveau; }
    public function getSpecialite(): ?string   { return $this->specialite; }
    public function getLocalisation(): ?string { return $this->localisation; }
    public function getRole(): string          { return $this->role; }
    public function getEmail(): string         { return $this->email; }
    public function getNumTel(): ?string       { return $this->numTel; }
    public function getMotDePass(): string     { return $this->motDePass; }

    // ── Setters ──
    public function setId(int $id): self               { $this->id = $id; return $this; }
    public function setNom(string $nom): self          { $this->nom = $nom; return $this; }
    public function setPrenom(string $prenom): self    { $this->prenom = $prenom; return $this; }
    public function setEmail(string $email): self      { $this->email = $email; return $this; }
    public function setNumTel(?string $n): self        { $this->numTel = $n; return $this; }
    public function setSexe(string $sexe): self        { $this->sexe = $sexe; return $this; }
    public function setNiveau(?string $n): self        { $this->niveau = $n; return $this; }
    public function setSpecialite(?string $s): self    { $this->specialite = $s; return $this; }
    public function setLocalisation(?string $l): self  { $this->localisation = $l; return $this; }
    public function setRole(?string $role): self       { $this->role = $role; return $this; }

    // Hash le mot de passe avant de le stocker
    public function setMotDePass(string $motDePass): self {
        $this->motDePass = password_hash($motDePass, PASSWORD_BCRYPT);
        return $this;
    }

    // Vérifie le mot de passe saisi contre le hash en BDD
    public function verifierMotDePasse(string $motDePassSaisi): bool {
        return password_verify($motDePassSaisi, $this->motDePass);
    }

    // ── Crée un objet Utilisateur depuis un tableau PDO ──
    // Colonne BDD  →  paramètre constructeur
    // status       →  role
    public static function fromBDD(array $row): self {
        $utilisateur = new self(
            $row['nom'],
            $row['prenom'],
            $row['DateDeNaissance'],
            $row['email'],
            $row['MotDePass'],
            $row['sexe'],
            $row['status'],           // ← colonne BDD = status
            $row['niveau']      ?? null,
            $row['specialite']  ?? null,
            $row['localisation'] ?? null,
            $row['NumTel']      ?? null
        );
        $utilisateur->setId((int)$row['ID']);
        return $utilisateur;
    }
}
?>
