-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Apr 25, 2026 at 04:56 PM
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
-- Table structure for table `utilisateur`
--

DROP TABLE IF EXISTS `utilisateur`;
CREATE TABLE IF NOT EXISTS `utilisateur` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sexe` enum('M','F') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MotDePass` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `DateDeNaissance` date NOT NULL,
  `NumTel` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `niveau` enum('L1','L2','L3','M1','M2','Doctorat') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialite` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `localisation` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Chercheur','Proposeur') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo_profil` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_banniere` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv` varchar(255) DEFAULT NULL,
  `banner_color_dark` varchar(7) DEFAULT NULL,
  `banner_color_light` varchar(7) DEFAULT NULL,
  `role` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `NumTel` (`NumTel`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `utilisateur`
--

INSERT INTO `utilisateur` (`ID`, `nom`, `prenom`, `sexe`, `email`, `MotDePass`, `DateDeNaissance`, `NumTel`, `niveau`, `specialite`, `localisation`, `status`, `photo_profil`, `photo_banniere`, `cv`, `banner_color_dark`, `banner_color_light`, `role`) VALUES
(6, 'OUKACHBI', 'CHAIMA', 'F', 'oukachbic@gmail.com', '$2y$10$bTVEaddi2UAEXNS2pJdyyePdQJ7UDjfToK4iwMEyP2Ikg5qELZGBa', '2005-12-14', '0000', 'L1', NULL, '', 'Chercheur', 'uploads/profil_1777124603_80c6214c.jpg', 'uploads/banniere_1777128288_0f35bf8b.jpg', NULL, '#7598b5', '#bbdefb', 'Etudiante a l univ de bous3ada'),
(7, 'Oukachbi', 'Chaima', 'F', 'oukachbich@gmail.com', '$2y$10$SBYLHU3vLbwQteG0wCcYXenDxjg38qEo3A5Zl6xmisiywA0gy9d8y', '2005-12-14', NULL, NULL, NULL, NULL, 'Proposeur', NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'Oukachbi', 'kamilia', 'F', 'oukachbikamilia7@gmail.com', '$2y$10$kqTCySvxn5kEBvT2fMGQ9./pwFkbsf.KUTfPndCWHVRiVv9S7Keqa', '2000-11-13', NULL, NULL, NULL, NULL, 'Chercheur', NULL, NULL, NULL, NULL, NULL, NULL);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
