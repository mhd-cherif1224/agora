<?php
 class Service{

 //Attributs qui correspondent aux colonnes de la BDD

 private ?int $id               = null;
 private string $titre;
 private ?string $description   = null;
 private string $dateDePublication;
 private string $status;
 private float $prix;


 public function __construct(
    string $titre,
    ?string $description  =null,
    string $dateDePublication,
    string $status,
    float $prix
    
 ){
    $this->titre    = $titre;
    $this->description  =$description;
    $this->dateDePublication =$dateDePublication;
    $this->status = $status; 
    $this->prix     = $prix;
 }
 
 public function getId(): ?int             { return $this->id; }
 public function getTitre() : string       { return $this->titre;}
 public function getDescription() : ?string       { return $this->description;}
 public function getDateDePublication() : string       { return $this->dateDePublication;}
 public function getPrix() : float       { return $this->prix;}
 public function  getStatus() : string   {return $this->status;}

 public function setId(int $id): self {
        $this->id = $id;
        return $this;
    }

 public function setTitre(string $titre) :self{
    $this->titre = $titre;
    return $this;
 }

 public function setDescription(?string $description): ?self {
        $this->description = $description;
        return $this;
    }

 public function setDateDePublication(string $dateDePublication): self {
        $this->dateDePublication = $dateDePublication;
        return $this;
    }

 public function setPrix(float $prix): self {
        $this->prix = $prix;
        return $this;
    }

 public function setStatus(string $status) :self {
    $this->status = $status;
    return $this;
 }

//créer l'objet service 
public static function fromBDD(array $row) :self{
$service = new self(
    $row['titre'],
    $row['description'] ?? null,
    $row['DateDePublication'],
    $row['status'],
    (float)$row['prix']
);
    $service->setId((int)$row['ID']);
        return $service;
}
 }
?>