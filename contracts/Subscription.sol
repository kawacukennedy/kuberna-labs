// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error Subscription__Invalid();

enum SubStatus { None, Active, Paused, Cancelled, Expired }
enum PlanType { Monthly, Annual }

struct Subscription {
    address subscriber;
    uint256 planId;
    uint256 startTime;
    uint256 nextPaymentTime;
    uint256 amountPaid;
    SubStatus status;
}

struct Plan {
    string name;
    address token;
    uint256 price;
    PlanType planType;
    uint256 durationSeconds;
    bool active;
}

contract KubernaSubscription is Ownable, ReentrancyGuard {
    uint256 public planCount;
    uint256 public immutable GRACE_PERIOD = 86400;

    mapping(uint256 => Plan) public plans;
    mapping(address => mapping(uint256 => Subscription)) public subscriptions;
    mapping(address => uint256[]) public subscriberPlans;

    event PlanCreated(uint256, string, uint256, PlanType);
    event PlanUpdated(uint256);
    event SubscriptionCreated(address, uint256, uint256);
    event SubscriptionRenewed(address, uint256, uint256);
    event SubscriptionCancelled(address, uint256);
    event PaymentReceived(address, uint256, address);
    event Payout(address, uint256, address);

    constructor() Ownable(msg.sender) {}

    function createPlan(string calldata name, address token, uint256 price, PlanType planType, uint256 durationSeconds)
        external onlyOwner returns (uint256) {
        require(price > 0 && durationSeconds > 0);

        uint256 planId = planCount++;
        plans[planId] = Plan(name, token, price, planType, durationSeconds, true);

        emit PlanCreated(planId, name, price, planType);
        return planId;
    }

    function updatePlan(uint256 planId, uint256 newPrice, bool newActive) external onlyOwner {
        require(plans[planId].price > 0);
        plans[planId].price = newPrice;
        plans[planId].active = newActive;
        emit PlanUpdated(planId);
    }

    function subscribe(uint256 planId) external nonReentrant {
        Plan memory p = plans[planId];
        require(p.price > 0 && p.active);

        Subscription storage s = subscriptions[msg.sender][planId];
        require(s.status == SubStatus.None);

        _processPayment(msg.sender, p.token, p.price);

        uint256 startTime = block.timestamp;
        subscriptions[msg.sender][planId] = Subscription({
            subscriber: msg.sender,
            planId: planId,
            startTime: startTime,
            nextPaymentTime: startTime + p.durationSeconds,
            amountPaid: p.price,
            status: SubStatus.Active
        });

        subscriberPlans[msg.sender].push(planId);
        emit SubscriptionCreated(msg.sender, planId, startTime);
    }

    function renew(uint256 planId) external nonReentrant {
        Subscription storage s = subscriptions[msg.sender][planId];
        require(s.status == SubStatus.Active || s.status == SubStatus.Expired);

        Plan memory p = plans[planId];
        require(p.active);

        _processPayment(msg.sender, p.token, p.price);

        s.nextPaymentTime = block.timestamp + p.durationSeconds;
        unchecked { s.amountPaid += p.price; }
        s.status = SubStatus.Active;

        emit SubscriptionRenewed(msg.sender, planId, p.price);
    }

    function cancelSubscription(uint256 planId) external {
        Subscription storage s = subscriptions[msg.sender][planId];
        require(s.status == SubStatus.Active);
        s.status = SubStatus.Cancelled;
        emit SubscriptionCancelled(msg.sender, planId);
    }

    function pauseSubscription(uint256 planId) external {
        Subscription storage s = subscriptions[msg.sender][planId];
        require(s.status == SubStatus.Active);
        s.status = SubStatus.Paused;
    }

    function resumeSubscription(uint256 planId) external {
        Subscription storage s = subscriptions[msg.sender][planId];
        require(s.status == SubStatus.Paused);
        s.status = SubStatus.Active;
    }

    function _processPayment(address user, address token, uint256 amount) internal {
        if (token == address(0)) {
            require(msg.value >= amount);
        } else {
            require(IERC20(token).transferFrom(user, address(this), amount));
        }
        emit PaymentReceived(user, amount, token);
    }

    function withdraw(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0));
        
        if (token == address(0)) {
            (bool success,) = payable(to).call{value: amount}("");
            require(success);
        } else {
            require(IERC20(token).transfer(to, amount));
        }
        
        emit Payout(to, amount, token);
    }

    function getSubscription(address user, uint256 planId) external view returns (Subscription memory) { return subscriptions[user][planId]; }
    function getPlan(uint256 planId) external view returns (Plan memory) { return plans[planId]; }
    function getUserPlans(address user) external view returns (uint256[] memory) { return subscriberPlans[user]; }

    function isActive(address user, uint256 planId) external view returns (bool) {
        Subscription memory s = subscriptions[user][planId];
        return s.status == SubStatus.Active && block.timestamp < s.nextPaymentTime + GRACE_PERIOD;
    }

    receive() external payable {}
}
