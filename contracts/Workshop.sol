// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

error Workshop__Invalid();
error Workshop__Full();
error Workshop__Ended();

enum WorkshopStatus { Scheduled, Live, Completed, Cancelled }

struct Workshop {
    string title;
    string description;
    string instructor;
    uint256 startTime;
    uint256 duration;
    uint256 maxParticipants;
    uint256 currentParticipants;
    string streamingUrl;
    WorkshopStatus status;
}

contract KubernaWorkshop is Ownable {
    uint256 public workshopCount;
    mapping(uint256 => Workshop) public workshops;
    mapping(uint256 => mapping(address => bool)) public registered;
    mapping(uint256 => mapping(address => bool)) public attended;
    mapping(uint256 => address[]) public participants;
    mapping(address => uint256[]) public userWorkshops;

    event WorkshopCreated(uint256, string, uint256);
    event WorkshopStarted(uint256);
    event WorkshopEnded(uint256);
    event ParticipantRegistered(uint256, address);
    event ParticipantRemoved(uint256, address);
    event RecordingUrlSet(uint256 indexed workshopId, string url);
    event AttendanceMarked(uint256 indexed workshopId, address indexed participant);

    constructor() Ownable(msg.sender) {}

    function createWorkshop(
        string calldata title,
        string calldata description,
        string calldata instructor,
        uint256 startTime,
        uint256 duration,
        uint256 maxParticipants,
        string calldata streamingUrl
    ) external onlyOwner returns (uint256) {
        require(startTime > block.timestamp);
        
        uint256 id = workshopCount++;
        
        workshops[id] = Workshop({
            title: title,
            description: description,
            instructor: instructor,
            startTime: startTime,
            duration: duration,
            maxParticipants: maxParticipants,
            currentParticipants: 0,
            streamingUrl: streamingUrl,
            status: WorkshopStatus.Scheduled
        });

        emit WorkshopCreated(id, title, startTime);
        return id;
    }

    function register(uint256 workshopId) external {
        Workshop storage w = workshops[workshopId];
        require(w.startTime > 0);
        require(!registered[workshopId][msg.sender]);
        require(w.currentParticipants < w.maxParticipants || w.maxParticipants == 0);
        require(w.status == WorkshopStatus.Scheduled);

        registered[workshopId][msg.sender] = true;
        participants[workshopId].push(msg.sender);
        userWorkshops[msg.sender].push(workshopId);
        
        unchecked { w.currentParticipants++; }

        emit ParticipantRegistered(workshopId, msg.sender);
    }

    function unregister(uint256 workshopId) external {
        Workshop storage w = workshops[workshopId];
        require(registered[workshopId][msg.sender]);
        require(w.status == WorkshopStatus.Scheduled);

        registered[workshopId][msg.sender] = false;
        
        unchecked { w.currentParticipants--; }

        emit ParticipantRemoved(workshopId, msg.sender);
    }

    function startWorkshop(uint256 workshopId) external onlyOwner {
        Workshop storage w = workshops[workshopId];
        require(w.status == WorkshopStatus.Scheduled);
        
        w.status = WorkshopStatus.Live;
        
        emit WorkshopStarted(workshopId);
    }

    function endWorkshop(uint256 workshopId) external onlyOwner {
        Workshop storage w = workshops[workshopId];
        require(w.status == WorkshopStatus.Live);
        
        w.status = WorkshopStatus.Completed;
        
        emit WorkshopEnded(workshopId);
    }

    /**
     * @dev Set/update the recording URL after a workshop ends.
     */
    function setRecordingUrl(uint256 workshopId, string calldata url) external onlyOwner {
        Workshop storage w = workshops[workshopId];
        require(w.status == WorkshopStatus.Completed, "Workshop not completed");
        w.streamingUrl = url;
        emit RecordingUrlSet(workshopId, url);
    }

    /**
     * @dev Mark a registered participant as having attended.
     */
    function markAttendance(uint256 workshopId, address participant) external onlyOwner {
        require(registered[workshopId][participant], "Not registered");
        require(!attended[workshopId][participant], "Already marked");
        attended[workshopId][participant] = true;
        emit AttendanceMarked(workshopId, participant);
    }

    /**
     * @dev Check if a participant attended.
     */
    function hasAttended(uint256 workshopId, address participant) external view returns (bool) {
        return attended[workshopId][participant];
    }

    function cancelWorkshop(uint256 workshopId) external onlyOwner {
        Workshop storage w = workshops[workshopId];
        require(w.status == WorkshopStatus.Scheduled);
        
        w.status = WorkshopStatus.Cancelled;
    }

    function getWorkshop(uint256 id) external view returns (Workshop memory) {
        return workshops[id];
    }

    function isRegistered(uint256 workshopId, address user) external view returns (bool) {
        return registered[workshopId][user];
    }

    function getParticipants(uint256 workshopId) external view returns (address[] memory) {
        return participants[workshopId];
    }

    function getUserWorkshops(address user) external view returns (uint256[] memory) {
        return userWorkshops[user];
    }
}
