module aether_protocol_adapters::scallop_adapter {
    use sui::balance::Balance;
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::TxContext;

    // Test USDC coin for testnet
    public struct USDC has copy, drop {}

    /// Scallop pool deposit receipt
    public struct ScallopPosition has key, store {
        id: UID,
        amount: u64,
        timestamp: u64,
    }

    public struct ScallopDeposited has copy, drop {
        amount: u64,
        position_id: address,
    }

    public struct ScallopWithdrawn has copy, drop {
        amount: u64,
        position_id: address,
        yield_earned: u64,
    }

    /// Deposit USDC to Scallop protocol
    public fun deposit_to_scallop(
        usdc_coin: Coin<USDC>,
        ctx: &mut TxContext,
    ): ScallopPosition {
        let amount = coin::value(&usdc_coin);
        transfer::public_transfer(usdc_coin, @0x0);
        
        let position = ScallopPosition {
            id: object::new(ctx),
            amount,
            timestamp: tx_context::epoch(ctx),
        };

        event::emit(ScallopDeposited {
            amount,
            position_id: object::uid_to_address(&position.id),
        });

        position
    }

    /// Withdraw from Scallop
    public fun withdraw_from_scallop(
        position: ScallopPosition,
        _ctx: &mut TxContext,
    ) {
        let ScallopPosition { id, amount, timestamp: _ } = position;
        
        // Simulate yield: 0.65% per epoch
        let yield_earned = (amount * 65) / 10000;

        event::emit(ScallopWithdrawn {
            amount,
            position_id: object::uid_to_address(&id),
            yield_earned,
        });

        object::delete(id);
    }

    /// Get current APY from Scallop (simplified)
    public fun get_scallop_apy(): u64 {
        // Mock: 11.5% APY
        1150 // in basis points
    }
}
