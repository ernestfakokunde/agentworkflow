module aether_task_manager::task_manager {
    use sui::event;
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};

    const STATUS_CREATED: u8 = 0;
    const STATUS_RUNNING: u8 = 1;
    const STATUS_VALIDATED: u8 = 2;
    const STATUS_SETTLED: u8 = 3;
    const E_NOT_OWNER: u64 = 1;

    public struct Task has key, store {
        id: UID,
        owner: address,
        objective_hash: vector<u8>,
        walrus_ref: vector<u8>,
        assigned_agents: vector<address>,
        status: u8,
        version: u64,
    }

    public struct TaskCreated has copy, drop {
        task_id: address,
        owner: address,
        status: u8,
        version: u64,
    }

    public struct WorkflowUpdated has copy, drop {
        task_id: address,
        owner: address,
        status: u8,
        version: u64,
    }

    public fun create_task(
        objective_hash: vector<u8>,
        walrus_ref: vector<u8>,
        assigned_agents: vector<address>,
        ctx: &mut TxContext,
    ): Task {
        let task = Task {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            objective_hash,
            walrus_ref,
            assigned_agents,
            status: STATUS_CREATED,
            version: 0,
        };

        let task_id = object::uid_to_address(&task.id);
        event::emit(TaskCreated {
            task_id,
            owner: tx_context::sender(ctx),
            status: STATUS_CREATED,
            version: 0,
        });
        task
    }

    public fun update_status(task: &mut Task, status: u8, ctx: &TxContext) {
        assert!(task.owner == tx_context::sender(ctx), E_NOT_OWNER);
        task.status = status;
        task.version = task.version + 1;
        event::emit(WorkflowUpdated {
            task_id: object::uid_to_address(&task.id),
            owner: task.owner,
            status,
            version: task.version,
        });
    }

    public fun is_settled(task: &Task): bool {
        task.status == STATUS_SETTLED
    }

    public fun running_status(): u8 {
        STATUS_RUNNING
    }

    public fun validated_status(): u8 {
        STATUS_VALIDATED
    }

    public fun settled_status(): u8 {
        STATUS_SETTLED
    }
}
