module aether_portfolio_vault::portfolio_vault {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    /// Portfolio allocation configuration
    public struct PortfolioAllocation<phantom CoinType> has key, store {
        id: UID,
        owner: address,
        task_id: address,
        total_balance: Balance<CoinType>,
        allocations: vector<AllocationEntry>,
        version: u64,
        created_at: u64,
        last_rebalance: u64,
    }

    /// Individual protocol allocation
    public struct AllocationEntry has store, drop {
        protocol: vector<u8>,  // "navi", "scallop", "cetus", "aftermath"
        percentage: u64,        // 0-10000 (basis points, 100 = 1%)
        deposited_amount: u64,
        current_yield: u64,
    }

    /// Vault position in a protocol
    public struct VaultPosition<phantom CoinType> has key, store {
        id: UID,
        portfolio_id: address,
        protocol: vector<u8>,
        amount: Balance<CoinType>,
        yield_earned: u64,
        entry_block: u64,
    }

    #[allow(unused_field)]
    public struct PortfolioCreated has copy, drop {
        portfolio_id: address,
        owner: address,
        total_amount: u64,
        task_id: address,
    }

    #[allow(unused_field)]
    public struct AllocationUpdated has copy, drop {
        portfolio_id: address,
        protocol: vector<u8>,
        new_percentage: u64,
        amount: u64,
    }

    #[allow(unused_field)]
    public struct PositionDeposited has copy, drop {
        position_id: address,
        portfolio_id: address,
        protocol: vector<u8>,
        amount: u64,
    }

    #[allow(unused_field)]
    public struct PositionWithdrawn has copy, drop {
        position_id: address,
        portfolio_id: address,
        protocol: vector<u8>,
        amount: u64,
        yield_earned: u64,
    }

    /// Create a new portfolio with initial USDC deposit
    public fun create_portfolio<CoinType>(
        task_id: address,
        deposit_coin: Coin<CoinType>,
        ctx: &mut TxContext,
    ): PortfolioAllocation<CoinType> {
        let amount = coin::value(&deposit_coin);
        let owner = tx_context::sender(ctx);

        let portfolio = PortfolioAllocation {
            id: object::new(ctx),
            owner,
            task_id,
            total_balance: coin::into_balance(deposit_coin),
            allocations: vector[],
            version: 0,
            created_at: tx_context::epoch(ctx),
            last_rebalance: tx_context::epoch(ctx),
        };

        let portfolio_id = object::uid_to_address(&portfolio.id);
        event::emit(PortfolioCreated {
            portfolio_id,
            owner,
            total_amount: amount,
            task_id,
        });

        portfolio
    }

    /// Set allocation percentages for each protocol
    /// percentages should be a vector of 4 values (navi, scallop, cetus, aftermath)
    /// each value is in basis points (10000 = 100%)
    public fun set_allocations<CoinType>(
        portfolio: &mut PortfolioAllocation<CoinType>,
        protocols: vector<vector<u8>>,
        percentages: vector<u64>,
        ctx: &mut TxContext,
    ) {
        assert!(tx_context::sender(ctx) == portfolio.owner, 1); // E_NOT_OWNER
        assert!(vector::length(&protocols) == vector::length(&percentages), 2); // E_INVALID_ALLOCATION
        
        let mut total_percentage: u64 = 0;
        let mut i = 0;
        while (i < vector::length(&percentages)) {
            total_percentage = total_percentage + *vector::borrow(&percentages, i);
            i = i + 1;
        };

        // Allow 1% slippage due to rounding
        assert!(total_percentage >= 9900 && total_percentage <= 10100, 3); // E_ALLOCATION_SUM_INVALID

        // Clear existing allocations
        portfolio.allocations = vector[];

        // Add new allocations
        let mut j = 0;
        while (j < vector::length(&protocols)) {
            vector::push_back(&mut portfolio.allocations, AllocationEntry {
                protocol: *vector::borrow(&protocols, j),
                percentage: *vector::borrow(&percentages, j),
                deposited_amount: 0,
                current_yield: 0,
            });
            j = j + 1;
        };

        portfolio.version = portfolio.version + 1;
    }

    /// Create a vault position for a specific protocol allocation
    public fun create_position<CoinType>(
        portfolio: &mut PortfolioAllocation<CoinType>,
        protocol_index: u64,
        ctx: &mut TxContext,
    ): VaultPosition<CoinType> {
        assert!(protocol_index < vector::length(&portfolio.allocations), 4); // E_INVALID_PROTOCOL
        
        let allocation = vector::borrow_mut(&mut portfolio.allocations, protocol_index);
        let total_balance_value = balance::value(&portfolio.total_balance);
        let amount_to_deposit = (total_balance_value * allocation.percentage) / 10000;

        assert!(amount_to_deposit > 0, 5); // E_AMOUNT_ZERO

        let coin_to_deposit = coin::take(&mut portfolio.total_balance, amount_to_deposit, ctx);
        allocation.deposited_amount = amount_to_deposit;

        let position = VaultPosition {
            id: object::new(ctx),
            portfolio_id: object::uid_to_address(&portfolio.id),
            protocol: allocation.protocol,
            amount: coin::into_balance(coin_to_deposit),
            yield_earned: 0,
            entry_block: tx_context::epoch(ctx),
        };

        let position_id = object::uid_to_address(&position.id);
        event::emit(PositionDeposited {
            position_id,
            portfolio_id: object::uid_to_address(&portfolio.id),
            protocol: allocation.protocol,
            amount: amount_to_deposit,
        });

        position
    }

    /// Record yield earned on a position
    public fun record_yield<CoinType>(position: &mut VaultPosition<CoinType>, yield_amount: u64) {
        position.yield_earned = position.yield_earned + yield_amount;
    }

    /// Withdraw from a position
    public fun withdraw_position<CoinType>(
        position: VaultPosition<CoinType>,
        ctx: &mut TxContext,
    ): Coin<CoinType> {
        let VaultPosition {
            id,
            portfolio_id,
            protocol,
            amount,
            yield_earned,
            entry_block: _,
        } = position;

        let position_id = object::uid_to_address(&id);
        object::delete(id);
        let coin_to_return = coin::from_balance(amount, ctx);

        event::emit(PositionWithdrawn {
            position_id,
            portfolio_id,
            protocol,
            amount: coin::value(&coin_to_return),
            yield_earned,
        });

        coin_to_return
    }

    /// Get total portfolio value (balance + yield)
    public fun portfolio_value<CoinType>(portfolio: &PortfolioAllocation<CoinType>): u64 {
        balance::value(&portfolio.total_balance)
    }

    /// Get allocation count
    public fun allocation_count<CoinType>(portfolio: &PortfolioAllocation<CoinType>): u64 {
        vector::length(&portfolio.allocations)
    }
}
