<?php
class Admin {

/** @var int */
private $idAdmin;

/** @var string */
private $Username;

/** @var string */
private $email;

/** @var string */
private $password;

/** constructeur */
public function __construct(string $email, string $password) { 
    $this->email    = $email;
    $this->password = password_hash($password, PASSWORD_BCRYPT);
}

/** Getters et setters */
public function getIdAdmin(): ?int {
    return $this->idAdmin;
}

public function setIdAdmin(int $idAdmin): self {
    $this->idAdmin = $idAdmin;
    return $this;
}
public function getUsername():?string
{
    return $this->Username;
}
public function setUserName(string $userName): self  
{
    $this->Username = $userName;

    return $this;
}
public function getEmail(): ?string {
    return $this->email;
}

public function setEmail(string $email): self {
    $this->email = $email;

    return $this;
}

public function getPasswordHash(): ?string {
    return $this->password;
}

// hashage du mot de passe
public function setPassword(string $password): self {
    $this->password= password_hash($password, PASSWORD_BCRYPT);

    return $this;
}

    /** Vérifie le mot de passe saisi */
public function verifyPassword(string $inputPassword): bool {
    return password_verify($inputPassword, $this->password);
} 

    
    

}

?>