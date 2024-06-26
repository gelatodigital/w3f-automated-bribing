# Web3 Function Automated Bribing
This project demonstrates automated bribing with configurable bribe plans stored on-chain.
The plans are periodically executed with off-chain data by a Web3 Function when user-defined criteria are met.

> [!WARNING]
> The documentation has not yet been updated to reflect the most recent release.

## Creating a bribe plan
Plans can be added using either ``addPlan`` or ``addPlanAll``.
The former bribes a fixed amount of tokens every epoch whereas the latter bribes all available tokens every epoch.
Arguments for the respective functions are the following:

1. ``addPlan``
   - Hidden Hand briber (e.g., Balancer, Aura)
   - Gauge (e.g., bb-g-usd)
   - Token (e.g., Gear)
   - Amount (Bribe per execution/epoch)
   - Interval (Between executions in seconds)
   - Start (Starting timestamp)
   - Epochs (Total number of executions)
   - Unsafe ([See below](#guarantees))
2. ``addPlanAll``
   - Hidden Hand briber (e.g., Balancer, Aura)
   - Gauge (e.g., bb-g-usd)
   - Token (e.g., Gear)
   - Interval (Between executions in seconds)
   - Start (Starting timestamp)
   - Epochs (Total number of executions)
  
> [!NOTE]
> Plans can be scheduled in advance by specifying a starting timestamp out in the future.
  
Plans are identified by a ``bytes32`` key which is derived by [hashing its attributes](https://github.com/gelatodigital/w3f-automated-bribing/blob/main/contracts/Briber/Briber.sol#L247-L251).  
This implicitly prevents the creation of duplicate plans.

## Removing a bribe plan
There are three ways for a plan to be removed:
1. Calling ``removePlan``
   - Frees up its remaining allocated tokens
   - Emits ``PlanRemoved``
2. Plan Completion
   - Plan has no epochs remaining
   - No tokens to free up since they will have all been spent
   - Emits ``PlanCompleted``
3. Plan Cancellation
   - Plan has insufficient tokens to bribe
   - It is gracefully removed and its remaining tokens are freed up
   - This can only occur if the ``unsafe=true`` override was used
   - Emits ``PlanCancelled``
  
## Executing a bribe
The Web3 Function will periodically fetch all bribe plans from the contract.
Once it finds a plan scheduled for execution, it translates its ``gauge address`` to a ``proposal hash`` by performing off-chain computation.
The translation is protocol specific and is defined in [gaugeToProposal](https://github.com/gelatodigital/w3f-automated-bribing/blob/main/web3-functions/bribe/gaugeToProposal.ts).
Handlers are modular by design to allow for easy implementation/support of additional protocols.

The Web3 Function executes at most one bribe per run which prevents it from exceeding request/resource limits.
This does however allow plans with short intervals to starve others since iterating the plans array sequentially introduces bias (Plans at the start will always be evaluated first).
To remove bias, the Web3 Function first shuffles the array before iterating.

## Guarantees
Whenever a new plan is added the tokens it requires are allocated to it and are kept track of in a mapping.
This ensures that multiple plans can coexist and execute in parallel without stealing tokens from one another.
The contract prevents the creation of plans which have insufficient tokens to run until completion and prevents the withdrawal of tokens in use by existing plans.

> [!NOTE]
> ``addPlanAll`` is inherently safe as its plans bribe all remaining unallocated tokens.

This behaviour can be overridden with ``unsafe=true`` in ``addPlan`` and ``withdrawERC20``

> [!WARNING]
> Using this override voids the guarantees outlined above and may lead to plan cancellation.

## Deployment

> [!WARNING]
> Contracts are not audited by a third-party. Please use at your own discretion.

1. Install dependencies
   ```
   yarn install
   ```
2. Compile smart contracts
   ```
   yarn run hardhat compile
   ```
3. Edit ``.env``
   ```
   cp .env.example .env
   ```
4. Deploy contracts
   ```
   yarn run hardhat deploy --tags Briber --network ethereum
   ```
5. Deploy the W3F to IPFS and create a W3F task
   ```
   yarn run hardhat run scripts/w3f-deploy-and-create-task.ts --network ethereum
   ```
6. Verify contracts on Etherscan (Optional)
   ```
   yarn run hardhat etherscan-verify --network ethereum
   ```
6. Deposit ``ETH`` into ``Briber`` contract for fee payment

## Testing
1. Install dependencies
   ```
   yarn install
   ```
2. Compile smart contracts
   ```
   yarn run hardhat compile
   ```
3. Edit ``.env``
   ```
   cp .env.example .env
   ```
4. Run unit tests
   ```
   yarn run hardhat test
   ```
