// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error CourseNFT__Invalid();

enum CourseStatus { Draft, Published, Archived }

struct Course {
    string name;
    string description;
    string metadataURI;
    uint256 price;
    address paymentToken;
    CourseStatus status;
    uint256 maxStudents;
    uint256 enrolledCount;
    bool hasCertificate;
    uint256 duration;
}

contract KubernaCourseNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => Course) public courses;
    mapping(uint256 => mapping(address => bool)) public courseEnrolled;
    mapping(uint256 => address[]) public courseStudents;
    mapping(address => uint256[]) public userEnrolledCourses;

    event CourseCreated(uint256, string, uint256);
    event CourseUpdated(uint256);
    event CoursePublished(uint256);
    event StudentEnrolled(uint256, address);
    event StudentRemoved(uint256 indexed courseId, address indexed student);
    event CourseArchived(uint256 indexed courseId);
    event AccessGranted(uint256, address);

    constructor() ERC721("Kuberna Course", "KBC") Ownable(msg.sender) {}

    function createCourse(
        string calldata name,
        string calldata description,
        string calldata metadataURI,
        uint256 price,
        address paymentToken,
        uint256 maxStudents,
        bool hasCertificate,
        uint256 duration
    ) external onlyOwner returns (uint256) {
        uint256 courseId = _nextTokenId++;
        
        courses[courseId] = Course({
            name: name,
            description: description,
            metadataURI: metadataURI,
            price: price,
            paymentToken: paymentToken,
            status: CourseStatus.Draft,
            maxStudents: maxStudents,
            enrolledCount: 0,
            hasCertificate: hasCertificate,
            duration: duration
        });

        _safeMint(address(this), courseId);
        
        emit CourseCreated(courseId, name, price);
        return courseId;
    }

    function updateCourse(
        uint256 courseId,
        string calldata name,
        string calldata description,
        string calldata metadataURI,
        uint256 price,
        uint256 maxStudents
    ) external onlyOwner {
        Course storage c = courses[courseId];
        require(c.price > 0);
        
        c.name = name;
        c.description = description;
        c.metadataURI = metadataURI;
        c.price = price;
        c.maxStudents = maxStudents;
        
        emit CourseUpdated(courseId);
    }

    function publishCourse(uint256 courseId) external onlyOwner {
        Course storage c = courses[courseId];
        require(c.price > 0);
        
        c.status = CourseStatus.Published;
        emit CoursePublished(courseId);
    }

    function enrollStudent(uint256 courseId, address student) external onlyOwner {
        Course storage c = courses[courseId];
        require(c.status == CourseStatus.Published);
        require(!courseEnrolled[courseId][student]);
        require(c.enrolledCount < c.maxStudents || c.maxStudents == 0);
        
        courseEnrolled[courseId][student] = true;
        courseStudents[courseId].push(student);
        userEnrolledCourses[student].push(courseId);
        
        unchecked { c.enrolledCount++; }
        
        emit StudentEnrolled(courseId, student);
    }

    function grantAccess(uint256 courseId, address student) external onlyOwner {
        require(courses[courseId].price > 0);
        courseEnrolled[courseId][student] = true;
        
        emit AccessGranted(courseId, student);
    }

    function revokeAccess(uint256 courseId, address student) external onlyOwner {
        courseEnrolled[courseId][student] = false;
    }

    /**
     * @dev Archive a published course (removes from active listings).
     */
    function archiveCourse(uint256 courseId) external onlyOwner {
        Course storage c = courses[courseId];
        require(c.status == CourseStatus.Published, "Course not published");
        c.status = CourseStatus.Archived;
        emit CourseArchived(courseId);
    }

    /**
     * @dev Remove a student from a course (for refund scenarios).
     */
    function removeStudent(uint256 courseId, address student) external onlyOwner {
        require(courseEnrolled[courseId][student], "Student not enrolled");
        courseEnrolled[courseId][student] = false;
        unchecked { courses[courseId].enrolledCount--; }
        emit StudentRemoved(courseId, student);
    }

    function isEnrolled(uint256 courseId, address student) external view returns (bool) {
        return courseEnrolled[courseId][student];
    }

    function getCourseStudents(uint256 courseId) external view returns (address[] memory) {
        return courseStudents[courseId];
    }

    function getUserCourses(address user) external view returns (uint256[] memory) {
        return userEnrolledCourses[user];
    }

    function getCourse(uint256 courseId) external view returns (Course memory) {
        return courses[courseId];
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
