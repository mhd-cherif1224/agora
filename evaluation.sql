-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Apr 25, 2026 at 08:41 PM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: ` echange_services_étudiants`
--

-- --------------------------------------------------------

--
-- Table structure for table `evaluation`
--

DROP TABLE IF EXISTS `evaluation`;
CREATE TABLE IF NOT EXISTS `evaluation` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `note` int NOT NULL,
  `commentaire` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `DateEval` date NOT NULL DEFAULT (curdate()),
  `ID_Utilisateur` int NOT NULL,
  `ID_Service` int NOT NULL,
  `lue` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `ID_Utilisateur` (`ID_Utilisateur`),
  KEY `ID_Service` (`ID_Service`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `evaluation`
--

INSERT INTO `evaluation` (`ID`, `note`, `commentaire`, `DateEval`, `ID_Utilisateur`, `ID_Service`, `lue`) VALUES
(1, 5, 'Excellent cours, très bien expliqué', '2025-02-01', 2, 1, NULL),
(2, 4, 'Bonne traduction, quelques petites erreurs', '2025-02-10', 3, 2, NULL),
(3, 3, 'Correct mais peut mieux faire', '2025-02-15', 1, 3, NULL),
(4, 5, 'Logo magnifique, très créatif', '2025-03-01', 1, 4, NULL),
(5, 4, 'Bon coaching, résultats visibles', '2025-03-10', 3, 5, NULL),
(6, 5, 'Java très bien enseigné, je recommande', '2025-03-20', 4, 6, NULL);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
