<?php
class Categorie{

private ?int $id   = null;
private string $titre;

public function __construct(
    string $titre
){
    $this->titre = $titre;
}
public function getId(): ?int             { return $this->id; }
public function getTitre() : string       { return $this->titre;}

public function setId(int $id): self {
        $this->id = $id;
        return $this;
    }
 public function setTitre(string $titre) :self{
    $this->titre = $titre;
    return $this;
 }

 public static function fromBDD(array $row) :self{
    $categorie = new self(
        $row['titre']
    );
    $categorie->setId((int)$row['ID']);
    return $categorie;
 }
}
?>