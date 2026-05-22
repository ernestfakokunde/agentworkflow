module aether_escrow::escrow {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    // Test USDC coin for testnet
    public struct USDC has copy, drop {}

    const STATUS_LOCKED: u8 = 0;
    const STATUS_RELEASED: u8 = 1;
    const E_NOT_LOCKED: u64 = 1;
    const E_NOT_OWNER: u64 = 2;

    public struct Escrow has key, store {
        id: UID,
        owner: address,
        task_id: address,
        usdc_balance: Balance<USDC>,
        status: u8,
        created_at: u64,
        released_at: u64,
    }

    public struct EscrowLocked has copy, drop {
        escrow_id: address,
        owner: address,
        task_id: address,
        amount: u64,
    }

    public struct EscrowReleased has copy, drop {
        escrow_id: address,
        task_id: address,
        amount: u64,
        released_at: u64,
    }

    public struct USDCDeposited has copy, drop {
        escrow_id: address,
        amount: u64,
    }

    public struct USDCWithdrawn has copy, drop {
        escrow_id: address,
        amount: u64,
    }

    /// Create a new escrow with initial USDC deposit
    public fun create_escrow(
        task_id: address,
        usdc_coin: Coin<USDC>,
        ctx: &mut TxContext,
    ): Escrow {
        let amount = coin::value(&usdc_coin);
        let owner = tx_context::sender(ctx);

        let escrow = Escrow {
            id: object::new(ctx),
            owner,
            task_id,
            usdc_balance: coin::into_balance(usdc_coin),
            status: STATUS_LOCKED,
            created_at: tx_context::epoch(ctx),
            released_at: 0,
        };

        let escrow_id = object::uid_to_address(&escrow.id);
        event::emit(EscrowLocked {
            escrow_id,
            owner,
            task_id,
            amount,
        });

        escrow
    }

    /// Withdraw USDC from escrow (only owner, requires unlocked status or release)
    public fun withdraw(
        escrow: &mut Escrow,
        amount: u64,
        ctx: &mut TxContext,
    ): Coin<USDC> {
        assert!(tx_context::sender(ctx) == escrow.owner, E_NOT_OWNER);
        assert!(escrow.status == STATUS_RELEASED, E_NOT_LOCKED);

        let coin_to_return = coin::take(&mut escrow.usdc_balance, amount, ctx);

        event::emit(USDCWithdrawn {
            escrow_id: object::uid_to_address(&escrow.id),
            amount,
        });

        coin_to_return
    }

    /// Release escrow (mark as ready for withdrawal)
    public fun release(escrow: &mut Escrow) {
        assert!(escrow.status == STATUS_LOCKED, E_NOT_LOCKED);
        escrow.status = STATUS_RELEASED;
        escrow.released_at = 1; // Mark as released

        event::emit(EscrowReleased {
            escrow_id: object::uid_to_address(&escrow.id),
            task_id: escrow.task_id,
            amount: balance::value(&escrow.usdc_balance),
            released_at: escrow.released_at,
        });
    }

    /// Get balance value
    public fun balance_value(escrow: &Escrow): u64 {
        balance::value(&escrow.usdc_balance)
    }

    /// Get escrow status
    public fun is_released(escrow: &Escrow): bool {
        escrow.status == STATUS_RELEASED
    }
}
