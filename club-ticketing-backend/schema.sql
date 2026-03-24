-- Database Name: club_ticketing

-- Create MEMBER Table
CREATE TABLE Member (
    memberID INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    nationalID VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create ADMIN Table
CREATE TABLE Admin (
    adminID INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    role ENUM('SuperAdmin', 'GateAdmin') DEFAULT 'GateAdmin'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create MATCH Table
CREATE TABLE MatchEvent (
    matchID INT AUTO_INCREMENT PRIMARY KEY,
    teams VARCHAR(255) NOT NULL,
    matchDate DATETIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    totalTickets INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create TICKET Table
CREATE TABLE Ticket (
    ticketID INT AUTO_INCREMENT PRIMARY KEY,
    matchID INT,
    memberID INT,
    status ENUM('Valid', 'Used', 'Cancelled') DEFAULT 'Valid',
    QRCode VARCHAR(255) UNIQUE NOT NULL,
    FOREIGN KEY (matchID) REFERENCES MatchEvent(matchID) ON DELETE CASCADE,
    FOREIGN KEY (memberID) REFERENCES Member(memberID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create ATTENDANCE LOG Table
CREATE TABLE AttendanceLog (
    logID INT AUTO_INCREMENT PRIMARY KEY,
    memberID INT,
    matchID INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (memberID) REFERENCES Member(memberID) ON DELETE CASCADE,
    FOREIGN KEY (matchID) REFERENCES MatchEvent(matchID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;