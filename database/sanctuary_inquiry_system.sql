-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 17, 2025 at 03:53 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sanctuary_inquiry_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `inquiries`
--

CREATE TABLE `inquiries` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `subject` varchar(150) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `status` enum('Pending','In Progress','Resolved') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inquiries`
--

INSERT INTO `inquiries` (`id`, `name`, `email`, `subject`, `message`, `status`, `created_at`) VALUES
(38, 'Charles yutuc', 'charlesyutuc12@gmail.com', 'Chapel Services', 'Hi I would to inquire to you for the prices and availability of the services offered, how can I book?', 'Pending', '2025-10-16 16:39:24'),
(39, 'Charlieee', 'charlesyutuc12@gmail.com', 'dwdwdwdw', 'dwdwdwdwd', 'Pending', '2025-10-16 17:09:30');

-- --------------------------------------------------------

--
-- Table structure for table `records`
--

CREATE TABLE `records` (
  `id` int(11) NOT NULL,
  `client_name` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `contact` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `service` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `status` varchar(50) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `records`
--

INSERT INTO `records` (`id`, `client_name`, `email`, `contact`, `address`, `service`, `date`, `status`) VALUES
(3, 'Emily Carter', 'emily.carter@austral.com', '+61451234567', 'Sydney, Australia', 'Digital Marketing', '2025-08-22', 'Active'),
(4, 'Michael Brown', 'michael.brown@uktech.co.uk', '+447912345678', 'London, United Kingdom', 'Software Development', '2025-07-15', 'Inactive'),
(5, 'Sophia Martinez', 'sophia.martinez@latinaimports.com', '+573123456789', 'Bogotá, Colombia', 'E-Commerce Setup', '2025-09-05', 'Active'),
(6, 'Liam O’Connor', 'liam.oconnor@emeraldfinance.ie', '+353871234567', 'Dublin, Ireland', 'Financial Consulting', '2025-09-28', 'Pending'),
(7, 'Ava Johnson', 'ava.johnson@canadaworks.ca', '+14161234567', 'Toronto, Canada', 'Brand Strategy', '2025-10-01', 'Active'),
(8, 'Rajesh Kumar', 'rajesh.kumar@infotech.in', '+919812345678', 'Bangalore, India', 'Mobile App Development', '2025-08-19', 'Inactive'),
(9, 'Hiroshi Tanaka', 'hiroshi.tanaka@nipponconsulting.jp', '+818012345678', 'Tokyo, Japan', 'IT Consulting', '2025-09-17', 'Active'),
(10, 'Maria Fernandez', 'maria.fernandez@hispanicdesigns.es', '+34600123456', 'Madrid, Spain', 'Graphic Design', '2025-07-30', 'Active'),
(11, 'David Miller', 'david.miller@millercorp.com', '+12025550123', 'New York, USA', 'Customer Support Outsourcing', '2025-09-12', 'Pending'),
(12, 'Chen Wei', 'chen.wei@orienttech.cn', '+8613812345678', 'Beijing, China', 'Cloud Integration', '2025-08-03', 'Active'),
(13, 'Isabella Rossi', 'isabella.rossi@italiadigital.it', '+393491234567', 'Rome, Italy', 'SEO Optimization', '2025-09-25', 'Active'),
(14, 'Lucas Silva', 'lucas.silva@brazillabs.com', '+5521987654321', 'Rio de Janeiro, Brazil', 'App Maintenance', '2025-10-05', 'Active'),
(15, 'Emma Wilson', 'emma.wilson@northsolutions.ca', '+14165550111', 'Vancouver, Canada', 'Cloud Hosting', '2025-09-02', 'Inactive'),
(16, 'Noah Davis', 'noah.davis@usatech.com', '+12125550122', 'Los Angeles, USA', 'System Upgrade', '2025-08-15', 'Pending'),
(17, 'Carlos Gomez', 'carlos.gomez@andesdata.pe', '+51981234567', 'Lima, Peru', 'Data Migration', '2025-09-07', 'Active'),
(18, 'Fatima Al-Farsi', 'fatima.alfarsi@dubaiinnovates.ae', '+971501234567', 'Dubai, UAE', 'Cybersecurity Audit', '2025-09-21', 'Active'),
(19, 'Olivia Müller', 'olivia.muller@deconsult.de', '+4915123456789', 'Berlin, Germany', 'Process Automation', '2025-07-22', 'Inactive'),
(20, 'Ethan Lee', 'ethan.lee@koreadev.kr', '+821012345678', 'Seoul, South Korea', 'Mobile App Design', '2025-09-29', 'Active'),
(21, 'Chloe Dubois', 'chloe.dubois@frenchmedia.fr', '+33612345678', 'Paris, France', 'Content Management', '2025-08-26', 'Active'),
(22, 'Ahmed Nasser', 'ahmed.nasser@egyptconnect.eg', '+201001234567', 'Cairo, Egypt', 'Network Setup', '2025-07-10', 'Inactive'),
(23, 'Siti Nurhaliza', 'siti.nurhaliza@malaysiahub.my', '+60123456789', 'Kuala Lumpur, Malaysia', 'Marketing Campaign', '2025-10-03', 'Active'),
(24, 'William Anderson', 'will.anderson@globalcorp.com', '+447700900123', 'Manchester, UK', 'Server Maintenance', '2025-09-11', 'Active'),
(25, 'Natalia Ivanova', 'natalia.ivanova@russtech.ru', '+79161234567', 'Moscow, Russia', 'Database Optimization', '2025-08-05', 'Pending'),
(26, 'Thomas Dupont', 'thomas.dupont@cloudfrance.fr', '+33123456789', 'Lyon, France', 'CRM Development', '2025-09-08', 'Active'),
(27, 'Khalid Bin Rashid', 'khalid.rashid@qatarinnovate.qa', '+97430123456', 'Doha, Qatar', 'Infrastructure Setup', '2025-09-18', 'Active'),
(28, 'Angela White', 'angela.white@whitemedia.us', '+12025550156', 'Chicago, USA', 'Social Media Management', '2025-07-29', 'Inactive'),
(29, 'George Taylor', 'george.taylor@nzenterprise.nz', '+64211234567', 'Auckland, New Zealand', 'Brand Identity Design', '2025-08-20', 'Active'),
(30, 'Hannah Kim', 'hannah.kim@seoulmarketing.kr', '+82105550123', 'Busan, South Korea', 'Email Automation', '2025-10-02', 'Pending'),
(32, 'John Dela Cruz', 'john.delacruz@example.com', '+639171234567', '123 Mabini St, Manila', 'Columbarium - Unit with perpetual care', '2025-10-01', 'Pending'),
(33, 'Maria Santos', 'maria.santos@example.com', '+639181234568', '45 Rizal St, Quezon City', 'Cremation Services - Adult cremation', '2025-10-02', 'Completed'),
(34, 'Carlos Reyes', 'carlos.reyes@example.com', '+639191234569', '78 Bonifacio St, Makati', 'Funeral service - Embalming services', '2025-10-03', 'Pending'),
(35, 'Ana Velasco', 'ana.velasco@example.com', '+639171234570', '90 Taft Ave, Manila', 'Cremation Services - Urns', '2025-10-04', 'Completed'),
(36, 'Luis Gomez', 'luis.gomez@example.com', '+639181234571', '22 Quezon Ave, Quezon City', 'Funeral service - Casket', '2025-10-05', 'Pending'),
(37, 'Carmen De Leon', 'carmen.deleon@example.com', '+639191234572', '11 España Blvd, Manila', 'Columbarium - Interment service', '2025-10-06', 'Completed'),
(38, 'Ramon Bautista', 'ramon.bautista@example.com', '+639171234573', '56 Taft Ave, Manila', 'Cremation Services - Baby cremation', '2025-10-07', 'Pending'),
(39, 'Gloria Cruz', 'gloria.cruz@example.com', '+639181234574', '34 Quezon St, Manila', 'Funeral service - Chapel viewing', '2025-10-08', 'Completed'),
(40, 'Miguel Tan', 'miguel.tan@example.com', '+639191234575', '77 Mabini St, Manila', 'Other services - Funeral Mass', '2025-10-09', 'Pending'),
(41, 'Patricia Lopez', 'patricia.lopez@example.com', '+639171234576', '12 Rizal St, Manila', 'Cremation Services - Fetus cremation', '2025-10-10', 'Completed'),
(42, 'Josefa Aquino', 'josefa.aquino@example.com', '+639181234577', '88 Bonifacio St, Makati', 'Funeral service - House viewing or outside viewing', '2025-10-11', 'Pending'),
(43, 'Victor Ramos', 'victor.ramos@example.com', '+639191234578', '14 Taft Ave, Manila', 'Cremation Services - Bone cremation', '2025-10-12', 'Completed'),
(44, 'Lucia Fernandez', 'lucia.fernandez@example.com', '+639171234579', '23 Quezon Ave, Quezon City', 'Other services - Function area', '2025-10-13', 'Pending'),
(45, 'Antonio Cruz', 'antonio.cruz@example.com', '+639181234580', '55 Mabini St, Manila', 'Funeral service - Retrieval of cadaver', '2025-10-14', 'Completed'),
(46, 'Rosa Morales', 'rosa.morales@example.com', '+639191234581', '99 Rizal St, Quezon City', 'Cremation Services - Child cremation', '2025-10-15', 'Pending'),
(47, 'Pedro Sanchez', 'pedro.sanchez@example.com', '+639171234582', '31 Bonifacio St, Makati', 'Columbarium - Unit with perpetual care', '2025-10-16', 'Completed'),
(48, 'Isabel Herrera', 'isabel.herrera@example.com', '+639181234583', '67 Taft Ave, Manila', 'Funeral service - Hearse', '2025-10-17', 'Pending'),
(49, 'Manuel De Guzman', 'manuel.deguzman@example.com', '+639191234584', '44 Quezon St, Manila', 'Cremation Services - Keepsakes', '2025-10-18', 'Completed'),
(50, 'Teresa Aquino', 'teresa.aquino@example.com', '+639171234585', '21 Mabini St, Manila', 'Funeral service - Embalming services', '2025-10-19', 'Pending'),
(51, 'Fernando Reyes', 'fernando.reyes@example.com', '+639181234586', '15 Rizal St, Quezon City', 'Cremation Services - Urns', '2025-10-20', 'Completed'),
(52, 'Sofia Cruz', 'sofia.cruz@example.com', '+639191234587', '36 Bonifacio St, Makati', 'Other services - Function area', '2025-10-21', 'Pending'),
(53, 'Ricardo Gomez', 'ricardo.gomez@example.com', '+639171234588', '48 Taft Ave, Manila', 'Columbarium - Interment service', '2025-10-22', 'Completed'),
(54, 'Elena Flores', 'elena.flores@example.com', '+639181234589', '50 Quezon Ave, Quezon City', 'Funeral service - Chapel viewing', '2025-10-23', 'Pending'),
(55, 'Alfredo Tan', 'alfredo.tan@example.com', '+639191234590', '17 Mabini St, Manila', 'Cremation Services - Adult cremation', '2025-10-24', 'Completed'),
(56, 'Monica Lopez', 'monica.lopez@example.com', '+639171234591', '29 Rizal St, Manila', 'Funeral service - Casket', '2025-10-25', 'Pending'),
(57, 'Diego Santos', 'diego.santos@example.com', '+639181234592', '62 Bonifacio St, Makati', 'Cremation Services - Baby cremation', '2025-10-26', 'Completed'),
(58, 'Carla Herrera', 'carla.herrera@example.com', '+639191234593', '13 Taft Ave, Manila', 'Other services - Funeral Mass', '2025-10-27', 'Pending'),
(59, 'Miguel De Leon', 'miguel.deleon@example.com', '+639171234594', '75 Quezon St, Manila', 'Funeral service - Retrieval of cadaver', '2025-10-28', 'Completed'),
(60, 'Lourdes Ramos', 'lourdes.ramos@example.com', '+639181234595', '39 Mabini St, Manila', 'Cremation Services - Fetus cremation', '2025-10-29', 'Pending'),
(61, 'Rafael Cruz', 'rafael.cruz@example.com', '+639191234596', '86 Rizal St, Quezon City', 'Columbarium - Unit with perpetual care', '2025-10-09', 'Cancelled');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `inquiries`
--
ALTER TABLE `inquiries`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `records`
--
ALTER TABLE `records`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `inquiries`
--
ALTER TABLE `inquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `records`
--
ALTER TABLE `records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
