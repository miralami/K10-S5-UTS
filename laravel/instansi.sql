-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 14, 2025 at 04:52 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `monitoring_arsitektur`
--

-- --------------------------------------------------------

--
-- Table structure for table `instansi`
--

CREATE TABLE `instansi` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kategori` varchar(255) NOT NULL,
  `instansi` varchar(255) NOT NULL,
  `proses_bisnis_as_is` int(11) NOT NULL DEFAULT 0,
  `layanan_as_is` int(11) NOT NULL DEFAULT 0,
  `data_info_as_is` int(11) NOT NULL DEFAULT 0,
  `aplikasi_as_is` int(11) NOT NULL DEFAULT 0,
  `infra_as_is` int(11) NOT NULL DEFAULT 0,
  `keamanan_as_is` int(11) NOT NULL DEFAULT 0,
  `proses_bisnis_to_be` int(11) NOT NULL DEFAULT 0,
  `layanan_to_be` int(11) NOT NULL DEFAULT 0,
  `data_info_to_be` int(11) NOT NULL DEFAULT 0,
  `aplikasi_to_be` int(11) NOT NULL DEFAULT 0,
  `infra_to_be` int(11) NOT NULL DEFAULT 0,
  `keamanan_to_be` int(11) NOT NULL DEFAULT 0,
  `peta_rencana` tinyint(1) NOT NULL DEFAULT 0,
  `clearance` tinyint(1) NOT NULL DEFAULT 0,
  `reviueval` tinyint(1) NOT NULL DEFAULT 0,
  `tingkat_kematangan` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `instansi`
--

INSERT INTO `instansi` (`id`, `kategori`, `instansi`, `proses_bisnis_as_is`, `layanan_as_is`, `data_info_as_is`, `aplikasi_as_is`, `infra_as_is`, `keamanan_as_is`, `proses_bisnis_to_be`, `layanan_to_be`, `data_info_to_be`, `aplikasi_to_be`, `infra_to_be`, `keamanan_to_be`, `peta_rencana`, `clearance`, `reviueval`, `tingkat_kematangan`, `created_at`, `updated_at`) VALUES
(1, 'Kementerian', 'Kementerian Dalam Negeri', 8, 8, 13, 2, 4, 1, 2, 3, 5, 2, 1, 0, 0, 0, 0, 0, '2025-10-06 00:14:18', '2025-10-06 00:14:18'),
(2, 'Kementerian', 'Kementerian Luar Negeri', 3, 6, 9, 6, 2, 4, 2, 3, 5, 1, 1, 2, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(3, 'Kementerian', 'Kementerian Pertahanan', 8, 4, 15, 3, 1, 4, 1, 3, 5, 2, 1, 0, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(4, 'Kementerian', 'Kementerian Agama', 5, 9, 6, 7, 4, 1, 4, 3, 3, 3, 2, 0, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(5, 'Kementerian', 'Kementerian Hukum', 6, 10, 9, 6, 2, 4, 2, 1, 2, 1, 1, 2, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(6, 'Kementerian', 'Kementerian Hak Asasi Manusia', 8, 8, 11, 6, 4, 2, 4, 1, 4, 3, 2, 1, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(7, 'Kementerian', 'Kementerian Imigrasi dan Pemasyarakatan', 5, 5, 14, 7, 2, 4, 2, 3, 2, 1, 1, 0, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(8, 'Kementerian', 'Kementerian Keuangan', 5, 9, 15, 4, 1, 4, 1, 3, 3, 1, 2, 1, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(9, 'Kementerian', 'Kementerian Pendidikan Dasar dan Menengah', 3, 6, 14, 3, 3, 1, 3, 1, 2, 2, 1, 2, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(10, 'Kementerian', 'Kementerian Pendidikan Tinggi, Sains, dan Teknologi', 4, 10, 7, 6, 5, 2, 2, 3, 4, 2, 2, 2, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(11, 'Kementerian', 'Kementerian Kebudayaan', 7, 8, 14, 5, 3, 2, 1, 3, 4, 3, 1, 1, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(12, 'LPNK', 'LPNK A', 5, 7, 10, 2, 1, 1, 2, 1, 3, 1, 1, 0, 0, 0, 1, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(13, 'LPNK', 'LPNK B', 8, 6, 12, 4, 3, 2, 4, 3, 5, 2, 2, 1, 0, 0, 1, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(14, 'LNS', 'LNS A', 6, 4, 9, 3, 2, 1, 2, 2, 3, 1, 1, 1, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(15, 'LNS', 'LNS B', 4, 2, 7, 2, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 1, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(16, 'Instansi Lain', 'Instansi Lain A', 3, 2, 5, 1, 1, 1, 2, 1, 2, 1, 1, 1, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(17, 'Instansi Lain', 'Instansi Lain B', 7, 5, 11, 3, 2, 2, 3, 2, 4, 1, 1, 1, 0, 0, 1, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(18, 'Provinsi', 'Provinsi A', 9, 8, 15, 4, 3, 2, 4, 2, 5, 2, 1, 1, 0, 0, 1, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(19, 'Provinsi', 'Provinsi B', 2, 3, 6, 2, 1, 1, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(20, 'Kab/Kota', 'Kabupaten/Kota A', 6, 4, 8, 2, 1, 1, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19'),
(21, 'Kab/Kota', 'Kabupaten/Kota B', 4, 2, 10, 7, 2, 1, 3, 1, 2, 1, 1, 0, 1, 0, 0, 0, '2025-10-06 00:14:19', '2025-10-06 00:14:19');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `instansi`
--
ALTER TABLE `instansi`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `instansi`
--
ALTER TABLE `instansi`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
